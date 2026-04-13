import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";

const execFileAsync = promisify(execFile);

export interface ClipSegment {
  videoPath: string;      // Path to stock footage clip
  durationSec: number;   // How long to use from this clip
  caption?: string;      // Large on-screen callout (used sparingly, max 4 words)
  narrationText?: string; // Full narration for this clip (used to generate SRT subtitles)
  startSec?: number;     // Start offset within clip (default 0)
}

export interface FfmpegRenderOptions {
  clips: ClipSegment[];
  audioPath: string;       // Voiceover MP3
  outputPath: string;      // Output MP4
  width?: number;          // default 1920
  height?: number;         // default 1080
  fps?: number;            // default 30
  bgMusicPath?: string;    // Optional background music
  bgMusicVolume?: number;  // 0-1, default 0.08
}

// ---------------------------------------------------------------------------
// SRT subtitle generation from clip narration text
// ---------------------------------------------------------------------------

function formatSrtTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(ms).padStart(3, "0")}`;
}

/** Split narration text into subtitle lines of ≤40 characters each. */
function chunkNarration(text: string, maxChars = 40): string[] {
  const words = text.trim().split(/\s+/);
  const chunks: string[] = [];
  let current = "";

  for (const word of words) {
    if (current.length === 0) {
      current = word;
    } else if (current.length + 1 + word.length <= maxChars) {
      current += " " + word;
    } else {
      chunks.push(current);
      current = word;
    }
  }
  if (current.length > 0) chunks.push(current);
  return chunks;
}

/** Generate an SRT file from clip segments' narration text. */
export function generateSrtFromClips(
  clips: ClipSegment[],
  srtOutputPath: string,
): void {
  let srtContent = "";
  let entryIndex = 1;
  let timeOffset = 0;

  for (const clip of clips) {
    const clipEnd = timeOffset + clip.durationSec;

    if (clip.narrationText && clip.narrationText.trim().length > 0) {
      const chunks = chunkNarration(clip.narrationText);
      const chunkDuration = clip.durationSec / chunks.length;

      for (let i = 0; i < chunks.length; i++) {
        const start = timeOffset + i * chunkDuration;
        const end = Math.min(start + chunkDuration, clipEnd);
        srtContent += `${entryIndex}\n`;
        srtContent += `${formatSrtTimestamp(start)} --> ${formatSrtTimestamp(end)}\n`;
        srtContent += `${chunks[i]}\n\n`;
        entryIndex++;
      }
    }

    timeOffset = clipEnd;
  }

  fs.writeFileSync(srtOutputPath, srtContent, "utf8");
}

// ---------------------------------------------------------------------------
// Main render function
// ---------------------------------------------------------------------------

export async function renderWithFfmpeg(
  opts: FfmpegRenderOptions,
): Promise<string> {
  const width = opts.width ?? 1920;
  const height = opts.height ?? 1080;
  const fps = opts.fps ?? 30;
  const bgMusicVolume = opts.bgMusicVolume ?? 0.08;

  if (opts.clips.length === 0) {
    throw new Error("At least one clip is required");
  }

  // Generate SRT if any clip has narration text
  const hasNarration = opts.clips.some((c) => c.narrationText);
  const srtPath = hasNarration
    ? path.join(path.dirname(opts.outputPath), "subtitles.srt")
    : null;

  if (srtPath) {
    generateSrtFromClips(opts.clips, srtPath);
  }

  const fontFile =
    process.platform === "linux"
      ? "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
      : "/System/Library/Fonts/Helvetica.ttc";

  const args: string[] = [];

  // Input: voiceover audio
  args.push("-i", opts.audioPath);

  // Input: each video clip with trim args
  for (const clip of opts.clips) {
    const startSec = clip.startSec ?? 0;
    args.push("-ss", String(startSec));
    args.push("-t", String(clip.durationSec));
    args.push("-i", clip.videoPath);
  }

  // Optional: background music
  const hasBgMusic = Boolean(opts.bgMusicPath);
  if (hasBgMusic && opts.bgMusicPath) {
    args.push("-stream_loop", "-1", "-i", opts.bgMusicPath);
  }

  // Build filter_complex
  const filterParts: string[] = [];

  // Scale + normalize each video clip
  for (let i = 0; i < opts.clips.length; i++) {
    const inputIdx = i + 1;
    const clip = opts.clips[i]!;

    let videoFilter = `[${inputIdx}:v]scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=${fps}`;

    // Large callout caption (sparingly, for key moments only)
    if (clip.caption) {
      const escaped = clip.caption
        .replace(/\\/g, "\\\\")
        .replace(/:/g, "\\:")
        .replace(/'/g, "\\'")
        .replace(/\[/g, "\\[")
        .replace(/\]/g, "\\]");
      videoFilter += `,drawtext=fontfile='${fontFile}':text='${escaped}':fontsize=72:fontcolor=white:borderw=4:bordercolor=black:x=(w-text_w)/2:y=h*0.12`;
    }

    videoFilter += `[v${i}]`;
    filterParts.push(videoFilter);
  }

  // Concat all video streams
  const concatInputs = opts.clips.map((_, i) => `[v${i}]`).join("");
  filterParts.push(
    `${concatInputs}concat=n=${opts.clips.length}:v=1:a=0[vconcat]`,
  );

  // Apply SRT subtitles if generated
  if (srtPath) {
    // Escape path for ffmpeg filter (colons and backslashes)
    const escapedSrtPath = srtPath.replace(/\\/g, "\\\\").replace(/:/g, "\\:");
    filterParts.push(
      `[vconcat]subtitles=${escapedSrtPath}:force_style='Fontname=DejaVu Sans,FontSize=20,PrimaryColour=&Hffffff,OutlineColour=&H000000,BorderStyle=1,Outline=2,MarginV=60'[vout]`,
    );
  } else {
    filterParts.push(`[vconcat]copy[vout]`);
  }

  // Total video duration (sum of all clip durations)
  const totalDurationSec = opts.clips.reduce((sum, c) => sum + c.durationSec, 0);

  // Audio mixing with trim to prevent audio overrun
  if (hasBgMusic) {
    const bgMusicIdx = opts.clips.length + 1;
    filterParts.push(
      `[0:a]atrim=0:${totalDurationSec},volume=1.0[voiceover];[${bgMusicIdx}:a]volume=${bgMusicVolume}[bgm];[voiceover][bgm]amix=inputs=2:duration=first[aout]`,
    );
  } else {
    filterParts.push(`[0:a]atrim=0:${totalDurationSec},volume=1.0[aout]`);
  }

  args.push("-filter_complex", filterParts.join(";"));
  args.push("-map", "[vout]");
  args.push("-map", "[aout]");
  args.push("-c:v", "libx264");
  args.push("-preset", "fast");
  args.push("-crf", "23");
  args.push("-c:a", "aac");
  args.push("-b:a", "192k");
  args.push("-y");
  args.push(opts.outputPath);

  await execFileAsync("ffmpeg", args, { timeout: 600000 });

  return opts.outputPath;
}
