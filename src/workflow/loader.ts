/**
 * Project file loader — reads JSON/YAML project configs.
 */

import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import type { VideoProjectConfig } from "./types";

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
