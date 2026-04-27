/**
 * Unified project loader and code generator for OpenCut video projects.
 *
 * Reads a single project.json or project.yaml file and generates all the
 * necessary TypeScript source files (config.ts, timeline.ts, Root.tsx, index.ts).
 */

import fs from "fs";
import path from "path";
import yaml from "js-yaml";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VideoProjectConfig {
  name: string;
  format: "horizontal" | "vertical" | "square";
  facecam: string;
  music?: string;
  playbackRate: number;
  title?: string;
  subtitle?: string;
  endCardTitle?: string;
  endCardCta?: string;
  endCardUrl?: string;
  segments: ProjectSegment[];
}

export interface ProjectSegment {
  type: string;
  duration: number;
  id?: string;
  faceBubble?: string;
  showSubtitles?: boolean;

  // Background-specific
  screenImage?: string;
  screenVideo?: string;
  slideImages?: string[];
  slideDuration?: number;

  // Overlay fields
  overlayText?: string;
  overlayTextTiming?: [number, number];
  keywords?: Array<{ text: string; startSec: number; endSec: number }>;
  callouts?: Array<{
    text: string;
    position: string;
    delaySec: number;
    durationSec: number;
  }>;
  showTitleCard?: boolean;
  showEndCard?: boolean;

  notifications?: {
    messages: Array<{ sender: string; text: string; delaySec: number }>;
    style: string;
    backgroundImage?: string;
  };

  inlinePanels?: Array<Record<string, unknown>>;
  splitContent?: Record<string, unknown>;
  diagramSteps?: Array<Record<string, unknown>>;
  diagramTitle?: string;

  backgroundEffect?: Record<string, unknown>;

  kineticText?: Record<string, unknown>;
  appMockup?: Record<string, unknown>;
  comparison?: Record<string, unknown>;
  videoBackground?: Record<string, unknown>;
  audioWaveform?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FORMAT_DIMS = {
  horizontal: { width: 1920, height: 1080 },
  vertical: { width: 1080, height: 1920 },
  square: { width: 1080, height: 1080 },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toPascalCase(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join("");
}

function toScreamingSnakeCase(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .toUpperCase();
}

function getDefaultFaceBubble(type: string): string {
  switch (type) {
    case "facecam-full":
    case "kinetic-text":
    case "cta":
      return "hidden";
    case "slides":
    case "screen-static":
    case "screen-video":
    case "app-mockup":
    case "comparison":
    case "split-screen":
      return "bottom-left";
    default:
      return "hidden";
  }
}

function getDefaultShowSubtitles(type: string): boolean {
  switch (type) {
    case "kinetic-text":
    case "cta":
      return false;
    default:
      return true;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Load a project configuration from a JSON or YAML file.
 */
export function loadProject(filePath: string): VideoProjectConfig {
  const absPath = path.resolve(filePath);
  if (!fs.existsSync(absPath)) {
    throw new Error(`Project file not found: ${absPath}`);
  }

  const content = fs.readFileSync(absPath, "utf-8");
  const ext = path.extname(absPath).toLowerCase();

  let raw: unknown;
  if (ext === ".json") {
    raw = JSON.parse(content);
  } else if (ext === ".yaml" || ext === ".yml") {
    raw = yaml.load(content);
  } else {
    throw new Error(
      `Unsupported project file format: ${ext}. Use .json, .yaml, or .yml`
    );
  }

  return raw as VideoProjectConfig;
}

/**
 * Validate a project configuration.
 * Returns an array of error strings (empty if valid).
 */
export function validateProject(project: VideoProjectConfig): string[] {
  const errors: string[] = [];

  if (!project.name || typeof project.name !== "string") {
    errors.push("Missing or invalid 'name'");
  }
  if (
    !project.format ||
    !["horizontal", "vertical", "square"].includes(project.format)
  ) {
    errors.push("Invalid 'format': must be 'horizontal', 'vertical', or 'square'");
  }
  if (!project.facecam || typeof project.facecam !== "string") {
    errors.push("Missing or invalid 'facecam'");
  }
  if (
    typeof project.playbackRate !== "number" ||
    project.playbackRate <= 0
  ) {
    errors.push("Invalid 'playbackRate': must be a positive number");
  }
  if (!Array.isArray(project.segments) || project.segments.length === 0) {
    errors.push("Missing or empty 'segments' array");
  } else {
    project.segments.forEach((seg, i) => {
      if (!seg.type || typeof seg.type !== "string") {
        errors.push(`Segment ${i}: missing or invalid 'type'`);
      }
      if (typeof seg.duration !== "number" || seg.duration <= 0) {
        errors.push(`Segment ${i}: invalid 'duration'`);
      }
    });
  }

  return errors;
}

/**
 * Generate TypeScript source files from a project configuration.
 *
 * Writes:
 *   - {outDir}/config.ts   → VideoConfig constant
 *   - {outDir}/timeline.ts → TimelineSegment[] constant
 *   - {outDir}/Root.tsx    → Remotion root component
 *   - {outDir}/index.ts    → registerRoot entry point
 */
export function generateFromProject(
  project: VideoProjectConfig,
  outDir: string
): void {
  const errors = validateProject(project);
  if (errors.length > 0) {
    throw new Error("Project validation failed:\n" + errors.join("\n"));
  }

  const dims = FORMAT_DIMS[project.format];
  const pascalName = toPascalCase(project.name);
  const configConst = toScreamingSnakeCase(project.name) + "_CONFIG";

  // Build timeline segments with auto-computed facecamStartSec
  let currentSec = 0;
  const timelineSegments = project.segments.map((seg, i) => {
    const segment: Record<string, unknown> = {
      id: seg.id || `seg-${i}`,
      type: seg.type,
      facecamStartSec: currentSec,
      durationSec: seg.duration,
      faceBubble: seg.faceBubble ?? getDefaultFaceBubble(seg.type),
      showSubtitles: seg.showSubtitles ?? getDefaultShowSubtitles(seg.type),
    };

    // Passthrough all optional TimelineSegment fields
    const passthroughFields: Array<keyof ProjectSegment> = [
      "screenImage",
      "screenVideo",
      "slideImages",
      "slideDuration",
      "overlayText",
      "overlayTextTiming",
      "keywords",
      "callouts",
      "showTitleCard",
      "showEndCard",
      "notifications",
      "inlinePanels",
      "splitContent",
      "diagramSteps",
      "diagramTitle",
      "backgroundEffect",
      "kineticText",
      "appMockup",
      "comparison",
      "videoBackground",
      "audioWaveform",
    ];

    for (const key of passthroughFields) {
      if (seg[key] !== undefined) {
        segment[key] = seg[key];
      }
    }

    currentSec += seg.duration;
    return segment;
  });

  // -----------------------------------------------------------------------
  // config.ts
  // -----------------------------------------------------------------------
  const musicLine = project.music
    ? `  bgMusicAsset: ${JSON.stringify(project.music)},\n`
    : "";

  const configTs = `import type { VideoConfig } from "../../engine";

export const ${configConst}: VideoConfig = {
  playbackRate: ${project.playbackRate},
  fps: 30,
  width: ${dims.width},
  height: ${dims.height},
  crossfadeFrames: 10,
  facecamAsset: ${JSON.stringify(project.facecam)},
${musicLine}  bgMusicVolume: 0.08,
};
`;

  // -----------------------------------------------------------------------
  // timeline.ts
  // -----------------------------------------------------------------------
  const timelineTs = `import type { TimelineSegment } from "../../engine";

export const TIMELINE: TimelineSegment[] = ${JSON.stringify(
    timelineSegments,
    null,
    2
  )};
`;

  // -----------------------------------------------------------------------
  // Root.tsx
  // -----------------------------------------------------------------------
  const rootTsx = `import React from "react";
import { Composition } from "remotion";
import { VideoComposition, computeTotalFrames } from "../../engine";
import { ${configConst} } from "./config";
import { TIMELINE } from "./timeline";

const totalFrames = computeTotalFrames(TIMELINE, ${configConst});

const ${pascalName}: React.FC = () => (
  <VideoComposition
    timeline={TIMELINE}
    videoConfig={${configConst}}
    subtitleSegments={[]}
    titleCardTitle={${JSON.stringify(project.title || project.name)}}
    titleCardSubtitle={${JSON.stringify(project.subtitle || "")}}
    endCardTitle={${JSON.stringify(project.endCardTitle || project.name)}}
    endCardCtaText={${JSON.stringify(project.endCardCta || "Learn more")}}
    endCardUrl={${JSON.stringify(project.endCardUrl || "")}}
  />
);

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="${pascalName}"
      component={${pascalName}}
      durationInFrames={totalFrames}
      fps={${configConst}.fps}
      width={${configConst}.width}
      height={${configConst}.height}
    />
    <Composition
      id="${pascalName}Preview"
      component={${pascalName}}
      durationInFrames={5 * ${configConst}.fps}
      fps={${configConst}.fps}
      width={${configConst}.width}
      height={${configConst}.height}
    />
  </>
);
`;

  // -----------------------------------------------------------------------
  // index.ts
  // -----------------------------------------------------------------------
  const indexTs = `import { registerRoot } from "remotion";
import { RemotionRoot } from "./Root";

registerRoot(RemotionRoot);
`;

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "config.ts"), configTs);
  fs.writeFileSync(path.join(outDir, "timeline.ts"), timelineTs);
  fs.writeFileSync(path.join(outDir, "Root.tsx"), rootTsx);
  fs.writeFileSync(path.join(outDir, "index.ts"), indexTs);
}
