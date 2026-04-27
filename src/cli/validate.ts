/**
 * CLI: validate an OpenCut timeline for structural correctness,
 * asset existence, A/V sync, keyword overlap, and cumulative drift.
 *
 * Usage:
 *   npx ts-node src/cli/validate.ts src/examples/<project>/timeline.ts
 */

import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

function parseArgs() {
  const timelinePath = process.argv[2];
  if (!timelinePath) {
    console.error("Usage: npx ts-node src/cli/validate.ts <path-to-timeline.ts>");
    process.exit(1);
  }
  return path.resolve(timelinePath);
}

// ---------------------------------------------------------------------------
// Dynamic TS loader
// ---------------------------------------------------------------------------

function loadTsModule<T>(filePath: string): Record<string, T> {
  // Ensure ts-node is active so .ts files can be required
  try {
    require("ts-node/register");
  } catch {
    // ts-node may already be registered when running via npx ts-node
  }
  delete require.cache[require.resolve(filePath)];
  return require(filePath) as Record<string, T>;
}

function findExportedValue<T>(mod: Record<string, unknown>, predicate: (v: unknown) => boolean): T | undefined {
  for (const key of Object.keys(mod)) {
    if (predicate(mod[key])) {
      return mod[key] as T;
    }
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Types (mirrors engine/types.ts so we don't need to import at runtime)
// ---------------------------------------------------------------------------

interface TimelineSegment {
  id: string;
  type: string;
  facecamStartSec: number;
  durationSec: number;
  faceBubble: string;
  showSubtitles: boolean;
  screenImage?: string;
  screenVideo?: string;
  slideImages?: string[];
  slideDuration?: number;
  keywords?: Array<{ text: string; startSec: number; endSec: number }>;
  callouts?: Array<{ text: string; position: string; delaySec: number; durationSec: number }>;
  inlinePanels?: Array<{ title: string; items: string[]; startSec: number; endSec: number }>;
  splitContent?: unknown;
  diagramSteps?: unknown[];
  kineticText?: unknown;
  appMockup?: unknown;
  comparison?: unknown;
  videoBackground?: unknown;
  showTitleCard?: boolean;
  showEndCard?: boolean;
  overlayText?: string;
  overlayTextTiming?: [number, number];
  notifications?: {
    messages: Array<{ sender: string; text: string; delaySec: number }>;
    style: string;
    backgroundImage?: string;
  };
}

interface VideoConfig {
  playbackRate: number;
  fps: number;
  width: number;
  height: number;
  crossfadeFrames: number;
  facecamAsset?: string;
  bgMusicAsset?: string;
  bgMusicVolume?: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function findLineNumber(fileContent: string, search: string): number | undefined {
  const lines = fileContent.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(search)) return i + 1;
  }
  return undefined;
}

async function fileExists(relPath: string, publicDir: string): Promise<boolean> {
  const full = path.join(publicDir, relPath);
  try {
    await fs.promises.access(full, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function getVideoDuration(videoPath: string): Promise<number | null> {
  try {
    const { stdout } = await execAsync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`,
      { timeout: 15000 }
    );
    const val = parseFloat(stdout.trim());
    return isNaN(val) ? null : val;
  } catch {
    return null;
  }
}

function segmentsOverlap(a: { startSec: number; endSec: number }, b: { startSec: number; endSec: number }): boolean {
  return a.startSec < b.endSec && b.startSec < a.endSec;
}

// ---------------------------------------------------------------------------
// Validation checks
// ---------------------------------------------------------------------------

interface ValidationError {
  segmentId?: string;
  message: string;
  line?: number;
  fatal: boolean;
}

async function runChecks(
  timeline: TimelineSegment[],
  config: VideoConfig,
  publicDir: string,
  fileContent: string,
): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];

  // 1. Required fields
  for (const seg of timeline) {
    const line = findLineNumber(fileContent, `"${seg.id}"`);
    if (!seg.id) errors.push({ segmentId: seg.id, message: "Missing required field: id", line, fatal: true });
    if (!seg.type) errors.push({ segmentId: seg.id, message: "Missing required field: type", line, fatal: true });
    if (typeof seg.durationSec !== "number")
      errors.push({ segmentId: seg.id, message: "Missing or invalid required field: durationSec", line, fatal: true });
    if (typeof seg.facecamStartSec !== "number")
      errors.push({ segmentId: seg.id, message: "Missing or invalid required field: facecamStartSec", line, fatal: true });
    if (!seg.faceBubble)
      errors.push({ segmentId: seg.id, message: "Missing required field: faceBubble", line, fatal: true });
    if (typeof seg.showSubtitles !== "boolean")
      errors.push({ segmentId: seg.id, message: "Missing or invalid required field: showSubtitles", line, fatal: true });
  }

  // 2. Type-specific fields
  const typeRequirements: Record<string, string[]> = {
    "screen-static": ["screenImage"],
    "screen-video": ["screenVideo"],
    slides: ["slideImages", "slideDuration"],
    "split-screen": ["splitContent"],
    "animated-diagram": ["diagramSteps"],
    "kinetic-text": ["kineticText"],
    "app-mockup": ["appMockup"],
    comparison: ["comparison"],
    "video-background": ["videoBackground"],
  };

  for (const seg of timeline) {
    const reqs = typeRequirements[seg.type];
    if (reqs) {
      const line = findLineNumber(fileContent, `"${seg.id}"`);
      for (const field of reqs) {
        const val = (seg as unknown as Record<string, unknown>)[field];
        if (val === undefined || val === null || (Array.isArray(val) && val.length === 0)) {
          errors.push({
            segmentId: seg.id,
            message: `Type "${seg.type}" requires field: ${field}`,
            line,
            fatal: true,
          });
        }
      }
    }
  }

  // 3. Asset existence
  const assetFields: Array<{ key: keyof TimelineSegment; label: string; multiple?: boolean }> = [
    { key: "screenImage", label: "screenImage" },
    { key: "screenVideo", label: "screenVideo" },
    { key: "slideImages", label: "slideImages", multiple: true },
  ];

  for (const seg of timeline) {
    const line = findLineNumber(fileContent, `"${seg.id}"`);
    for (const { key, label, multiple } of assetFields) {
      const val = seg[key];
      if (!val) continue;
      if (multiple && Array.isArray(val)) {
        for (const p of val) {
          if (typeof p === "string" && !(await fileExists(p, publicDir))) {
            errors.push({ segmentId: seg.id, message: `Missing asset (${label}): public/${p}`, line, fatal: true });
          }
        }
      } else if (typeof val === "string" && !(await fileExists(val, publicDir))) {
        errors.push({ segmentId: seg.id, message: `Missing asset (${label}): public/${val}`, line, fatal: true });
      }
    }
  }

  // Facecam and music assets from config
  if (config.facecamAsset && !(await fileExists(config.facecamAsset, publicDir))) {
    errors.push({ message: `Missing asset (facecamAsset): public/${config.facecamAsset}`, fatal: true });
  }
  if (config.bgMusicAsset && !(await fileExists(config.bgMusicAsset, publicDir))) {
    errors.push({ message: `Missing asset (bgMusicAsset): public/${config.bgMusicAsset}`, fatal: false });
  }

  // 4. Cumulative drift
  let expectedStart = 0;
  for (const seg of timeline) {
    const line = findLineNumber(fileContent, `"${seg.id}"`);
    if (Math.abs(seg.facecamStartSec - expectedStart) > 0.001) {
      errors.push({
        segmentId: seg.id,
        message: `Cumulative drift: facecamStartSec is ${seg.facecamStartSec}, expected ${expectedStart} (sum of previous durations)`,
        line,
        fatal: true,
      });
    }
    expectedStart += seg.durationSec;
  }

  // 5. Dead keywords + keyword overlap
  for (const seg of timeline) {
    const segStart = seg.facecamStartSec;
    const segEnd = seg.facecamStartSec + seg.durationSec;
    const line = findLineNumber(fileContent, `"${seg.id}"`);

    if (seg.keywords) {
      for (let i = 0; i < seg.keywords.length; i++) {
        const kw = seg.keywords[i];
        if (kw.startSec < segStart || kw.endSec > segEnd) {
          errors.push({
            segmentId: seg.id,
            message: `Dead keyword "${kw.text}": [${kw.startSec}, ${kw.endSec}] outside segment [${segStart}, ${segEnd}]`,
            line,
            fatal: true,
          });
        }
        for (let j = i + 1; j < seg.keywords.length; j++) {
          const other = seg.keywords[j];
          if (segmentsOverlap(kw, other)) {
            errors.push({
              segmentId: seg.id,
              message: `Keyword overlap: "${kw.text}" [${kw.startSec}, ${kw.endSec}] overlaps "${other.text}" [${other.startSec}, ${other.endSec}]`,
              line,
              fatal: false,
            });
          }
        }
      }
    }
  }

  // 6. Dead inline panels
  for (const seg of timeline) {
    const segStart = seg.facecamStartSec;
    const segEnd = seg.facecamStartSec + seg.durationSec;
    const line = findLineNumber(fileContent, `"${seg.id}"`);
    if (seg.inlinePanels) {
      for (const panel of seg.inlinePanels) {
        if (panel.startSec < segStart || panel.endSec > segEnd) {
          errors.push({
            segmentId: seg.id,
            message: `Dead inline panel "${panel.title}": [${panel.startSec}, ${panel.endSec}] outside segment [${segStart}, ${segEnd}]`,
            line,
            fatal: true,
          });
        }
      }
    }
  }

  // 7. Dead callouts
  for (const seg of timeline) {
    const segDur = seg.durationSec;
    const line = findLineNumber(fileContent, `"${seg.id}"`);
    if (seg.callouts) {
      for (const c of seg.callouts) {
        if (c.delaySec + c.durationSec > segDur + 0.001) {
          errors.push({
            segmentId: seg.id,
            message: `Dead callout "${c.text}": delaySec(${c.delaySec}) + durationSec(${c.durationSec}) = ${c.delaySec + c.durationSec} exceeds segment duration ${segDur}`,
            line,
            fatal: false,
          });
        }
      }
    }
  }

  // 8. overlayText timing
  for (const seg of timeline) {
    if (seg.overlayText && seg.overlayTextTiming) {
      const segStart = seg.facecamStartSec;
      const segEnd = seg.facecamStartSec + seg.durationSec;
      const line = findLineNumber(fileContent, `"${seg.id}"`);
      const [tStart, tEnd] = seg.overlayTextTiming;
      if (tStart < segStart || tEnd > segEnd) {
        errors.push({
          segmentId: seg.id,
          message: `overlayTextTiming [${tStart}, ${tEnd}] outside segment [${segStart}, ${segEnd}]`,
          line,
          fatal: false,
        });
      }
    }
  }

  // 9. A/V sync
  const totalRawDuration = timeline.reduce((sum, s) => sum + s.durationSec, 0);
  const expectedOutputDuration = totalRawDuration / config.playbackRate;

  if (config.facecamAsset) {
    const facecamPath = path.join(publicDir, config.facecamAsset);
    const facecamDuration = await getVideoDuration(facecamPath);
    if (facecamDuration === null) {
      errors.push({
        message: `Could not probe facecam duration (ffprobe not installed or failed). Skipping A/V sync check.`,
        fatal: false,
      });
    } else {
      const diff = Math.abs(facecamDuration - totalRawDuration);
      if (diff > 2) {
        errors.push({
          message: `A/V sync drift: facecam duration ${facecamDuration.toFixed(2)}s vs total raw segment duration ${totalRawDuration.toFixed(2)}s (diff ${diff.toFixed(2)}s)`,
          fatal: false,
        });
      }
    }
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const timelinePath = parseArgs();
  const projectDir = path.dirname(timelinePath);
  const projectRoot = path.resolve(__dirname, "../..");
  const publicDir = path.join(projectRoot, "public");

  if (!fs.existsSync(timelinePath)) {
    console.error(`❌ Timeline file not found: ${timelinePath}`);
    process.exit(1);
  }

  // Load timeline
  let timelineMod: Record<string, unknown>;
  try {
    timelineMod = loadTsModule<TimelineSegment[]>(timelinePath);
  } catch (err) {
    console.error(`❌ Failed to load timeline module: ${err instanceof Error ? err.message : err}`);
    process.exit(1);
  }

  const timeline = findExportedValue<TimelineSegment[]>(timelineMod, (v) => Array.isArray(v));
  if (!timeline) {
    console.error("❌ Could not find exported TimelineSegment array in timeline file.");
    process.exit(1);
  }

  // Load config (sibling of timeline)
  const configPath = path.join(projectDir, "config.ts");
  let config: VideoConfig = {
    playbackRate: 1,
    fps: 30,
    width: 1920,
    height: 1080,
    crossfadeFrames: 10,
  };

  if (fs.existsSync(configPath)) {
    try {
      const configMod = loadTsModule<VideoConfig>(configPath);
      const found = findExportedValue<VideoConfig>(configMod, (v) =>
        v !== null && typeof v === "object" && "playbackRate" in v
      );
      if (found) config = found;
    } catch {
      console.warn("⚠️  Could not load config.ts; using default config for validation.");
    }
  }

  const fileContent = fs.readFileSync(timelinePath, "utf-8");

  console.log(`\nValidating ${timeline.length} segment(s)…\n`);

  const errors = await runChecks(timeline, config, publicDir, fileContent);

  const fatals = errors.filter((e) => e.fatal);
  const warnings = errors.filter((e) => !e.fatal);

  for (const e of fatals) {
    const loc = e.line ? ` (line ${e.line})` : "";
    const id = e.segmentId ? ` [${e.segmentId}]` : "";
    console.log(`❌ FATAL${id}${loc}: ${e.message}`);
  }

  for (const e of warnings) {
    const loc = e.line ? ` (line ${e.line})` : "";
    const id = e.segmentId ? ` [${e.segmentId}]` : "";
    console.log(`⚠️  WARN ${id}${loc}: ${e.message}`);
  }

  if (fatals.length === 0 && warnings.length === 0) {
    console.log("✅ All checks passed.");
    process.exit(0);
  } else {
    console.log(`\n${fatals.length === 0 ? "✅" : "❌"} ${fatals.length} fatal, ${warnings.length} warning(s).`);
    process.exit(fatals.length > 0 ? 1 : 0);
  }
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
