/**
 * Unified project workflow for OpenCut.
 *
 * Barrel re-export for backward compatibility.
 * Prefer importing directly from `./loader`, `./validator`, or `./generator`.
 */

export type { VideoProjectConfig, ProjectSegment } from "./types";
export { loadProject } from "./loader";
export { validateProject } from "./validator";
export { generateFromProject } from "./generator";
