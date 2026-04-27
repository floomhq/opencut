#!/usr/bin/env node
/**
 * Smarter render CLI for OpenCut projects.
 *
 * Usage:
 *   npx ts-node src/cli/render.ts <project> [--preview] [--frames 0-149]
 *
 * Examples:
 *   npx ts-node src/cli/render.ts src/my-project/project.json
 *   npx ts-node src/cli/render.ts src/my-project --preview
 *   npx ts-node src/cli/render.ts src/my-project --frames 0-149
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { loadProject } from "../workflow/VideoProject";

function findProjectFile(input: string): string {
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

function findEntryPoint(dir: string): string {
  const indexTs = path.join(dir, "index.ts");
  if (fs.existsSync(indexTs)) {
    return indexTs;
  }
  throw new Error(`No index.ts entry point found in ${dir}`);
}

function extractCompositionId(rootTsxPath: string): string {
  const content = fs.readFileSync(rootTsxPath, "utf-8");
  const match = content.match(/id="([^"]+)"/);
  if (!match) {
    throw new Error(`Could not find composition id in ${rootTsxPath}`);
  }
  return match[1];
}

function parseFramesArg(args: string[]): string | null {
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

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0].startsWith("-")) {
    console.error("Usage: npx ts-node src/cli/render.ts <project> [--preview] [--frames 0-149]");
    process.exit(1);
  }

  const projectArg = args[0];
  const preview = args.includes("--preview");
  const frames = parseFramesArg(args);

  // Resolve the project directory
  let dir: string;
  let project: { name: string } | undefined;

  const abs = path.resolve(projectArg);
  if (fs.existsSync(abs) && fs.statSync(abs).isFile()) {
    dir = path.dirname(abs);
    try {
      project = loadProject(abs);
    } catch {
      // ignore
    }
  } else {
    dir = abs;
    // Try to find a project config file
    try {
      const projectFile = findProjectFile(abs);
      project = loadProject(projectFile);
    } catch {
      // No project config — we'll work with the generated TS files directly
    }
  }

  // Auto-detect composition name from Root.tsx
  let compositionId: string;
  try {
    const rootTsx = path.join(dir, "Root.tsx");
    compositionId = extractCompositionId(rootTsx);
  } catch (e) {
    // Fallback: derive from directory or project name
    const fallbackName =
      project?.name || path.basename(dir);
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
    const cmd = `npx remotion studio ${entryPoint}`;
    console.log(`> ${cmd}`);
    execSync(cmd, { stdio: "inherit" });
    return;
  }

  const outDir = path.resolve("out");
  fs.mkdirSync(outDir, { recursive: true });
  const safeName = (project?.name || compositionId)
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .toLowerCase();
  const outputPath = path.join(outDir, `${safeName}.mp4`);

  let cmd = `timeout 10m npx remotion render ${entryPoint} ${compositionId} ${outputPath}`;
  if (frames) {
    cmd += ` --frames=${frames}`;
  }

  console.log(`Rendering "${project?.name || compositionId}"...`);
  console.log(`  Entry:   ${entryPoint}`);
  console.log(`  Comp:    ${compositionId}`);
  console.log(`  Output:  ${outputPath}`);
  if (frames) {
    console.log(`  Frames:  ${frames}`);
  }
  console.log(`> ${cmd}`);

  execSync(cmd, { stdio: "inherit" });
}

main();
