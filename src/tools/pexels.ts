import axios from "axios";
import fs from "fs";

export interface PexelsVideo {
  id: number;
  url: string; // Direct download URL (MP4)
  width: number;
  height: number;
  duration: number; // seconds
  pexelsUrl: string; // Page URL (for attribution)
}

interface PexelsVideoFile {
  link: string;
  width: number;
  height: number;
  quality: string;
  file_type: string;
}

interface PexelsVideoItem {
  id: number;
  url: string;
  duration: number;
  video_files: PexelsVideoFile[];
}

interface PexelsSearchResponse {
  videos: PexelsVideoItem[];
}

function pickBestFile(files: PexelsVideoFile[]): PexelsVideoFile | null {
  // Filter to MP4 files only
  const mp4Files = files.filter((f) => f.file_type === "video/mp4");
  if (mp4Files.length === 0) return null;

  // Pick file with width closest to 1920, preferring larger widths
  return mp4Files.reduce((best, current) => {
    const bestDiff = Math.abs((best.width ?? 0) - 1920);
    const currDiff = Math.abs((current.width ?? 0) - 1920);
    return currDiff < bestDiff ? current : best;
  });
}

export async function searchVideos(
  query: string,
  targetDurationSec: number,
): Promise<PexelsVideo[]> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) {
    throw new Error("PEXELS_API_KEY environment variable is not set");
  }

  const response = await axios.get<PexelsSearchResponse>(
    "https://api.pexels.com/videos/search",
    {
      params: {
        query,
        per_page: 15,
        orientation: "landscape",
      },
      headers: {
        Authorization: apiKey,
      },
    },
  );

  const videos = response.data.videos;

  // Filter to videos within ±3s of target duration
  const durationTolerance = 3;
  const withinRange = videos.filter(
    (v) => Math.abs(v.duration - targetDurationSec) <= durationTolerance,
  );

  // Use filtered results if available, otherwise fall back to all videos sorted by duration proximity
  const candidates =
    withinRange.length > 0
      ? withinRange
      : [...videos].sort(
          (a, b) =>
            Math.abs(a.duration - targetDurationSec) -
            Math.abs(b.duration - targetDurationSec),
        );

  const results: PexelsVideo[] = [];

  for (const item of candidates) {
    if (results.length >= 3) break;

    const bestFile = pickBestFile(item.video_files);
    if (!bestFile) continue;

    results.push({
      id: item.id,
      url: bestFile.link,
      width: bestFile.width,
      height: bestFile.height,
      duration: item.duration,
      pexelsUrl: item.url,
    });
  }

  return results;
}

export async function downloadVideo(
  video: PexelsVideo,
  outputPath: string,
): Promise<string> {
  const response = await axios.get<NodeJS.ReadableStream>(video.url, {
    responseType: "stream",
  });

  await new Promise<void>((resolve, reject) => {
    const writer = fs.createWriteStream(outputPath);
    response.data.pipe(writer);
    writer.on("finish", resolve);
    writer.on("error", reject);
  });

  return outputPath;
}
