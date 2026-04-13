import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export interface ClipSegment {
  videoPath: string; // Path to stock footage clip
  durationSec: number; // How long to use from this clip
  caption?: string; // Text to burn in (optional)
  startSec?: number; // Start offset within clip (default 0)
}

export interface FfmpegRenderOptions {
  clips: ClipSegment[];
  audioPath: string; // Voiceover MP3
  outputPath: string; // Output MP4
  width?: number; // default 1920
  height?: number; // default 1080
  fps?: number; // default 30
  bgMusicPath?: string; // Optional background music
  bgMusicVolume?: number; // 0-1, default 0.08
}

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

  // Scale + fps each video clip, apply caption if present
  // Clip inputs start at index 1 (index 0 is voiceover audio)
  for (let i = 0; i < opts.clips.length; i++) {
    const inputIdx = i + 1; // offset by 1 because audio is input 0
    const clip = opts.clips[i];

    let videoFilter = `[${inputIdx}:v]scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=${fps}`;

    if (clip.caption) {
      // Escape special characters in caption text for ffmpeg drawtext
      const escapedCaption = clip.caption
        .replace(/\\/g, "\\\\")
        .replace(/:/g, "\\:")
        .replace(/'/g, "\\'")
        .replace(/\[/g, "\\[")
        .replace(/\]/g, "\\]");

      videoFilter += `,drawtext=text='${escapedCaption}':font=Arial:fontsize=60:fontcolor=white:borderw=3:bordercolor=black:x=(w-text_w)/2:y=h-120`;
    }

    videoFilter += `[v${i}]`;
    filterParts.push(videoFilter);
  }

  // Concat all video streams
  const concatInputs = opts.clips.map((_, i) => `[v${i}]`).join("");
  filterParts.push(
    `${concatInputs}concat=n=${opts.clips.length}:v=1:a=0[vout]`,
  );

  // Audio mixing: voiceover at volume 1.0 + optional bg music
  if (hasBgMusic) {
    // bg music is the last input, after all video clips
    const bgMusicIdx = opts.clips.length + 1;
    filterParts.push(
      `[0:a]volume=1.0[voiceover];[${bgMusicIdx}:a]volume=${bgMusicVolume}[bgm];[voiceover][bgm]amix=inputs=2:duration=first[aout]`,
    );
  } else {
    filterParts.push(`[0:a]volume=1.0[aout]`);
  }

  args.push("-filter_complex", filterParts.join(";"));

  // Map outputs
  args.push("-map", "[vout]");
  args.push("-map", "[aout]");

  // Encoding options
  args.push("-c:v", "libx264");
  args.push("-preset", "fast");
  args.push("-crf", "23");
  args.push("-c:a", "aac");
  args.push("-b:a", "192k");

  // Overwrite output without prompting
  args.push("-y");

  args.push(opts.outputPath);

  await execFileAsync("ffmpeg", args, { timeout: 600000 });

  return opts.outputPath;
}
