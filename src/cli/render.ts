#!/usr/bin/env node
/**
 * Smarter render CLI for OpenCut projects.
 *
 * Usage:
 *   npx ts-node src/cli/render.ts <project> [--preview] [--frames 0-149] [--watch]
 *
 * Examples:
 *   npx ts-node src/cli/render.ts src/my-project/project.json
 *   npx ts-node src/cli/render.ts src/my-project --preview
 *   npx ts-node src/cli/render.ts src/my-project --frames 0-149
 *   npx ts-node src/cli/render.ts src/my-project --watch
 */

import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";
import { loadProject } from "../workflow/VideoProject";

export function findProjectFile(input: string): string {
  const abs = path.resolve(input);

  if (fs.existsSync(abs) && fs.statSync(abs).isFile()) {
    const ext = path.extname(abs).toLowerCase();
    if (ext === ".json" || ext === ".yaml" || ext === ".yml") {
      return abs;
    }
  }

  // Try as directory
  for (const name of ["project.json", "project.yaml", "project.yml"]) {
    const candidate = path.join(abs, name);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(`No project.json / project.yaml found in ${abs}`);
}

export function findEntryPoint(dir: string): string {
  const indexTs = path.join(dir, "index.ts");
  if (fs.existsSync(indexTs)) {
    return indexTs;
  }
  throw new Error(`No index.ts entry point found in ${dir}`);
}

export function extractCompositionId(rootTsxPath: string): string {
  const content = fs.readFileSync(rootTsxPath, "utf-8");
  const match = content.match(/id="([^"]+)"/);
  if (!match) {
    throw new Error(`Could not find composition id in ${rootTsxPath}`);
  }
  return match[1];
}

export function parseFramesArg(args: string[]): string | null {
  // --frames 0-149
  const idx = args.indexOf("--frames");
  if (idx >= 0 && args[idx + 1]) {
    return args[idx + 1];
  }

  // --frames=0-149
  const eqArg = args.find((a) => a.startsWith("--frames="));
  if (eqArg) {
    return eqArg.split("=")[1];
  }

  return null;
}

function buildRenderArgs(
  entryPoint: string,
  compositionId: string,
  outputPath: string,
  frames: string | null
): string[] {
  const args = ["remotion", "render", entryPoint, compositionId, outputPath];
  if (frames) {
    args.push(`--frames=${frames}`);
  }
  return args;
}

function runRender(
  entryPoint: string,
  compositionId: string,
  outputPath: string,
  frames: string | null,
  projectName?: string
): void {
  const args = buildRenderArgs(entryPoint, compositionId, outputPath, frames);

  console.log(`\nRendering "${projectName || compositionId}"...`);
  console.log(`  Entry:   ${entryPoint}`);
  console.log(`  Comp:    ${compositionId}`);
  console.log(`  Output:  ${outputPath}`);
  if (frames) {
    console.log(`  Frames:  ${frames}`);
  }
  console.log(`> npx ${args.join(" ")}`);

  execFileSync("npx", args, { stdio: "inherit", timeout: 10 * 60 * 1000 });
}

function watchProject(
  dir: string,
  entryPoint: string,
  compositionId: string,
  outputPath: string,
  frames: string | null,
  projectName?: string
): void {
  const watchFiles = [
    path.join(dir, "config.ts"),
    path.join(dir, "timeline.ts"),
    path.join(dir, "subtitles.ts"),
    path.join(dir, "Root.tsx"),
    path.join(dir, "index.ts"),
  ].filter((f) => fs.existsSync(f));

  console.log(`\n👁  Watch mode enabled. Watching ${watchFiles.length} file(s) for changes:`);
  watchFiles.forEach((f) => console.log(`   - ${path.relative(process.cwd(), f)}`));
  console.log(`\nPress Ctrl+C to stop.\n`);

  // Render once immediately
  try {
    runRender(entryPoint, compositionId, outputPath, frames, projectName);
    console.log("\n✅ Initial render complete. Waiting for changes...\n");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`\n⚠️  Initial render failed: ${msg}\n`);
  }

  const watchers = watchFiles.map((file) =>
    fs.watch(file, (eventType) => {
      if (eventType === "change") {
        console.log(`\n🔄 File changed: ${path.relative(process.cwd(), file)}`);
        try {
          // Re-extract composition ID in case Root.tsx changed
          let currentCompId = compositionId;
          try {
            const rootTsx = path.join(dir, "Root.tsx");
            currentCompId = extractCompositionId(rootTsx);
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            console.debug(`Could not re-extract composition id: ${msg}`);
          }
          runRender(entryPoint, currentCompId, outputPath, frames, projectName);
          console.log("\n✅ Render complete. Waiting for changes...\n");
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.log(`\n❌ Render failed: ${msg}\n`);
        }
      }
    })
  );

  process.on("SIGINT", () => {
    console.log("\n\n👋 Stopping watch mode...");
    watchers.forEach((w) => w.close());
    process.exit(0);
  });

  // Keep process alive
  setInterval(() => {}, 1000);
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0].startsWith("-")) {
    console.error("Usage: npx ts-node src/cli/render.ts <project> [--preview] [--frames 0-149] [--watch]");
    process.exit(1);
  }

  const projectArg = args[0];
  const preview = args.includes("--preview");
  const frames = parseFramesArg(args);
  const watch = args.includes("--watch");

  // Resolve the project directory
  let dir: string;
  let project: { name: string } | undefined;

  const abs = path.resolve(projectArg);
  if (fs.existsSync(abs) && fs.statSync(abs).isFile()) {
    dir = path.dirname(abs);
    try {
      project = loadProject(abs);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.debug(`Could not load project from file: ${msg}`);
    }
  } else {
    dir = abs;
    // Try to find a project config file
    try {
      const projectFile = findProjectFile(abs);
      project = loadProject(projectFile);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.debug(`No project config found: ${msg}`);
    }
  }

  // Auto-detect composition name from Root.tsx
  let compositionId: string;
  try {
    const rootTsx = path.join(dir, "Root.tsx");
    compositionId = extractCompositionId(rootTsx);
  } catch (e) {
    // Fallback: derive from directory or project name
    const fallbackName = project?.name || path.basename(dir);
    compositionId = fallbackName
      .replace(/[^a-zA-Z0-9]+/g, " ")
      .split(" ")
      .filter(Boolean)
      .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join("");
    console.warn(`Warning: could not read Root.tsx, falling back to "${compositionId}"`);
  }

  const entryPoint = findEntryPoint(dir);

  if (preview) {
    console.log(`Opening Remotion studio for "${project?.name || compositionId}"...`);
    console.log(`> npx remotion studio ${entryPoint}`);
    execFileSync("npx", ["remotion", "studio", entryPoint], { stdio: "inherit" });
    return;
  }

  const outDir = path.resolve("out");
  fs.mkdirSync(outDir, { recursive: true });
  const safeName = (project?.name || compositionId)
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .toLowerCase();
  const outputPath = path.join(outDir, `${safeName}.mp4`);

  if (watch) {
    watchProject(dir, entryPoint, compositionId, outputPath, frames, project?.name);
    return;
  }

  runRender(entryPoint, compositionId, outputPath, frames, project?.name);
}

if (require.main === module) {
  main();
}
