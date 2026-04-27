/**
 * CLI: transcribe a video with Whisper (or Gemini fallback) and emit
 * OpenCut-compatible subtitles.ts. Optionally generates a starter timeline
 * with chapter breaks at pauses > 2s.
 *
 * Usage:
 *   npx ts-node src/cli/transcribe.ts public/facecam.mp4 [--lang en]
 */

import fs from "fs";
import path from "path";
import os from "os";
import { exec, execSync } from "child_process";
import { promisify } from "util";
import { transcribeVideo } from "../tools/gemini-transcribe";

const execAsync = promisify(exec);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SubtitleSegment {
  start: number;
  end: number;
  text: string;
  words: Array<{ word: string; start: number; end: number }>;
}

interface WhisperSegment {
  id?: number;
  start: number;
  end: number;
  text: string;
  words?: Array<{ word: string; start: number; end: number }>;
}

interface WhisperJson {
  segments: WhisperSegment[];
}

interface TimelineSegment {
  id: string;
  type: string;
  facecamStartSec: number;
  durationSec: number;
  faceBubble: string;
  showSubtitles: boolean;
}

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

function parseArgs() {
  const args = process.argv.slice(2);
  const videoPath = args[0];
  const langIdx = args.findIndex((a) => a === "--lang");
  const lang = langIdx >= 0 ? args[langIdx + 1] || "en" : "en";

  if (!videoPath) {
    console.error("Usage: npx ts-node src/cli/transcribe.ts <video-path> [--lang en]");
    process.exit(1);
  }

  const resolvedVideo = path.resolve(videoPath);
  if (!fs.existsSync(resolvedVideo)) {
    console.error(`❌ Video file not found: ${resolvedVideo}`);
    process.exit(1);
  }

  return { videoPath: resolvedVideo, lang };
}

// ---------------------------------------------------------------------------
// Whisper CLI helpers
// ---------------------------------------------------------------------------

function isWhisperAvailable(): boolean {
  try {
    execSync("whisper --version", { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

async function runWhisper(videoPath: string, lang: string): Promise<SubtitleSegment[]> {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "opencut-whisper-"));
  const basename = path.basename(videoPath, path.extname(videoPath));

  console.error(`Running Whisper (model=small, lang=${lang})…`);

  try {
    await execAsync(
      `whisper "${videoPath}" --model small --language ${lang} --output_format json --output_dir "${tmpDir}"`,
      { timeout: 300_000 }
    );
  } catch (err) {
    // Clean up
    try { fs.rmSync(tmpDir, { recursive: true }); } catch { /* ignore */ }
    throw new Error(`Whisper failed: ${err instanceof Error ? err.message : err}`);
  }

  const jsonPath = path.join(tmpDir, `${basename}.json`);
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Whisper did not produce expected JSON output: ${jsonPath}`);
  }

  const raw = JSON.parse(fs.readFileSync(jsonPath, "utf-8")) as WhisperJson;

  // Clean up
  try { fs.rmSync(tmpDir, { recursive: true }); } catch { /* ignore */ }

  return raw.segments.map((seg) => ({
    start: seg.start,
    end: seg.end,
    text: seg.text.trim(),
    words:
      seg.words && seg.words.length > 0
        ? seg.words.map((w) => ({
            word: w.word.trim(),
            start: w.start,
            end: w.end,
          }))
        : distributeWords(seg.text.trim(), seg.start, seg.end),
  }));
}

function distributeWords(text: string, segStart: number, segEnd: number): Array<{ word: string; start: number; end: number }> {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const totalDur = segEnd - segStart;
  const perWord = totalDur / words.length;
  return words.map((w, i) => ({
    word: w,
    start: segStart + i * perWord,
    end: segStart + (i + 1) * perWord,
  }));
}

// ---------------------------------------------------------------------------
// Gemini fallback
// ---------------------------------------------------------------------------

async function runGemini(videoPath: string): Promise<SubtitleSegment[]> {
  console.error("Whisper CLI not found. Falling back to Gemini transcription…");
  const result = await transcribeVideo(videoPath);
  return result.segments.map((seg) => ({
    start: seg.startSec,
    end: seg.endSec,
    text: seg.text.trim(),
    words: distributeWords(seg.text.trim(), seg.startSec, seg.endSec),
  }));
}

// ---------------------------------------------------------------------------
// Project auto-detection
// ---------------------------------------------------------------------------

function detectProject(videoPath: string): string | null {
  const videoBasename = path.basename(videoPath);
  const projectRoot = path.resolve(__dirname, "../..");
  const examplesDir = path.join(projectRoot, "src/examples");

  if (!fs.existsSync(examplesDir)) return null;

  const dirs = fs.readdirSync(examplesDir).filter((d) => {
    const full = path.join(examplesDir, d);
    return fs.statSync(full).isDirectory();
  });

  for (const dir of dirs) {
    const configPath = path.join(examplesDir, dir, "config.ts");
    if (!fs.existsSync(configPath)) continue;
    try {
      const content = fs.readFileSync(configPath, "utf-8");
      // Naive string search for the asset name inside the config
      if (content.includes(videoBasename)) {
        return dir;
      }
    } catch {
      // ignore unreadable
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Output generators
// ---------------------------------------------------------------------------

function generateSubtitlesTs(segments: SubtitleSegment[]): string {
  const segLines = segments
    .map(
      (s) => `  {
    start: ${s.start},
    end: ${s.end},
    text: ${JSON.stringify(s.text)},
    words: [
${s.words
  .map((w) => `      { word: ${JSON.stringify(w.word)}, start: ${w.start.toFixed(3)}, end: ${w.end.toFixed(3)} }`)
  .join(",\n")}
    ],
  }`
    )
    .join(",\n");

  return `import type { SubtitleSegment } from "../../engine";

export const SUBTITLE_SEGMENTS: SubtitleSegment[] = [
${segLines}
];
`;
}

function generateBasicTimeline(segments: SubtitleSegment[]): string {
  // Build chapters at pauses > 2s
  const chapters: { start: number; end: number }[] = [];
  let currentStart = segments[0]?.start ?? 0;
  let currentEnd = segments[0]?.end ?? 0;

  for (let i = 1; i < segments.length; i++) {
    const seg = segments[i];
    const gap = seg.start - currentEnd;
    if (gap > 2) {
      chapters.push({ start: currentStart, end: currentEnd });
      currentStart = seg.start;
    }
    currentEnd = seg.end;
  }
  chapters.push({ start: currentStart, end: currentEnd });

  const timelineSegs = chapters.map((ch, idx) => {
    const duration = ch.end - ch.start;
    return `  {
    id: "ch${String(idx + 1).padStart(2, "0")}",
    type: "facecam-full",
    facecamStartSec: ${ch.start.toFixed(3)},
    durationSec: ${duration.toFixed(3)},
    faceBubble: "hidden",
    showSubtitles: true,
  }`;
  });

  return `import type { TimelineSegment } from "../../engine";

// Auto-generated starter timeline with chapter breaks at pauses > 2s.
// Customize segment types, overlays, and backgrounds as needed.
export const TIMELINE: TimelineSegment[] = [
${timelineSegs.join(",\n")}
];
`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const { videoPath, lang } = parseArgs();
  const projectRoot = path.resolve(__dirname, "../..");

  // Transcribe
  let segments: SubtitleSegment[];
  if (isWhisperAvailable()) {
    segments = await runWhisper(videoPath, lang);
  } else {
    segments = await runGemini(videoPath);
  }

  console.error(`Transcription complete: ${segments.length} segment(s).`);

  const subtitlesTs = generateSubtitlesTs(segments);

  // Detect project
  const projectName = detectProject(videoPath);

  if (projectName) {
    const projectDir = path.join(projectRoot, "src/examples", projectName);
    const subtitlesPath = path.join(projectDir, "subtitles.ts");
    fs.writeFileSync(subtitlesPath, subtitlesTs, "utf-8");
    console.error(`✅ Wrote subtitles → ${subtitlesPath}`);

    // Optionally generate timeline
    const timelinePath = path.join(projectDir, "timeline.ts");
    const timelineTs = generateBasicTimeline(segments);
    if (!fs.existsSync(timelinePath)) {
      fs.writeFileSync(timelinePath, timelineTs, "utf-8");
      console.error(`✅ Wrote starter timeline → ${timelinePath}`);
    } else {
      console.error("\n--- Generated starter timeline (timeline.ts already exists, printed below) ---");
      console.log(timelineTs);
      console.error("-------------------------------------------------------------------------------\n");
    }
  } else {
    console.error("⚠️  Could not auto-detect project (no config.ts references this video). Printing to stdout.\n");
    console.log(subtitlesTs);

    // Still print timeline suggestion to stderr/stdout
    const timelineTs = generateBasicTimeline(segments);
    console.error("\n--- Generated starter timeline ---");
    console.log(timelineTs);
    console.error("-----------------------------------\n");
  }
}

main().catch((err) => {
  console.error("Error:", err instanceof Error ? err.message : err);
  process.exit(1);
});
