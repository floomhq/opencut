/**
 * Project config validator.
 */

import type { VideoProjectConfig } from "./types";

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
