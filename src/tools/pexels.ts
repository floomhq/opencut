import axios from "axios";
import fs from "fs";
import path from "path";
import { requireEnv } from "../env";

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
  const apiKey = requireEnv("PEXELS_API_KEY");

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

  await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });

  await new Promise<void>((resolve, reject) => {
    const writer = fs.createWriteStream(outputPath);
    response.data.pipe(writer);
    writer.on("finish", resolve);
    writer.on("error", reject);
    response.data.on("error", reject);
  });

  return outputPath;
}

// ---------------------------------------------------------------------------
// Stock B-roll helpers
// ---------------------------------------------------------------------------

export interface BrollResult {
  /** Path relative to public/ (e.g. "broll/nature-123.mp4"). */
  publicPath: string;
  /** Absolute filesystem path. */
  absolutePath: string;
  /** Video metadata. */
  video: PexelsVideo;
}

/**
 * Search Pexels for a video clip and download the best match to public/broll/.
 *
 * @param query Search term (e.g. "aerial city night")
 * @param targetDurationSec Desired clip length in seconds
 * @param projectRoot Absolute path to the project root (where public/ lives)
 * @returns The downloaded b-roll result
 */
export async function fetchBroll(
  query: string,
  targetDurationSec: number,
  projectRoot: string,
): Promise<BrollResult> {
  const videos = await searchVideos(query, targetDurationSec);
  if (videos.length === 0) {
    throw new Error(`No Pexels videos found for query: "${query}"`);
  }

  const top = videos[0];
  const safeName = query
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const filename = `${safeName}-${top.id}.mp4`;
  const publicPath = path.join("broll", filename);
  const absolutePath = path.join(projectRoot, "public", publicPath);

  await downloadVideo(top, absolutePath);

  return {
    publicPath: publicPath.replace(/\\/g, "/"),
    absolutePath,
    video: top,
  };
}

/**
 * Fetch multiple b-roll clips for a timeline.
 *
 * @param query Search term
 * @param count Number of clips to fetch
 * @param targetDurationSec Desired clip length in seconds
 * @param projectRoot Absolute path to the project root
 * @returns Array of downloaded b-roll results
 */
export async function fetchBrollBatch(
  query: string,
  count: number,
  targetDurationSec: number,
  projectRoot: string,
): Promise<BrollResult[]> {
  const allVideos = await searchVideos(query, targetDurationSec);
  if (allVideos.length === 0) {
    throw new Error(`No Pexels videos found for query: "${query}"`);
  }

  const results: BrollResult[] = [];
  const safeName = query
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  for (let i = 0; i < Math.min(count, allVideos.length); i++) {
    const video = allVideos[i];
    const filename = `${safeName}-${video.id}.mp4`;
    const publicPath = path.join("broll", filename);
    const absolutePath = path.join(projectRoot, "public", publicPath);

    // Skip re-download if already exists
    if (!fs.existsSync(absolutePath)) {
      await downloadVideo(video, absolutePath);
    }

    results.push({
      publicPath: publicPath.replace(/\\/g, "/"),
      absolutePath,
      video,
    });
  }

  return results;
}

/**
 * Generate a timeline snippet for the fetched b-roll clips.
 *
 * Each clip is treated as a facecam-full segment with a VideoBackground.
 * Adjust segment durations to match your actual voiceover timing.
 */
export function buildBrollTimelineSnippet(
  results: BrollResult[],
  segmentDurationSec: number = 5,
): unknown[] {
  return results.map((_r, i) => ({
    id: `broll-${i + 1}`,
    type: "facecam-full",
    facecamStartSec: i * segmentDurationSec,
    durationSec: segmentDurationSec,
    faceBubble: "hidden",
    showSubtitles: false,
    backgroundEffect: undefined,
    // To use VideoBackground, add this to your Segment renderer:
    // videoBackground: { videoUrl: r.publicPath, opacity: 0.4, presetIndex: i }
  }));
}
