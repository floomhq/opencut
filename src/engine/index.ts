/**
 * video-engine -- Remotion-based video production engine.
 *
 * Import the components and types you need:
 *
 *   import { VideoComposition, type TimelineSegment, type VideoConfig } from "./engine";
 */

// Components
export { VideoComposition } from "./Composition";
export { Segment } from "./Segment";
export { FaceBubble } from "./FaceBubble";
export { SubtitleOverlay } from "./SubtitleOverlay";
export { KeywordOverlay } from "./KeywordOverlay";
export { TitleCard } from "./TitleCard";
export { EndCard } from "./EndCard";
export { NotificationBanner } from "./NotificationBanner";

// Types
export type {
  // Core data
  TimelineSegment,
  VideoConfig,
  SegmentType,
  FaceBubblePosition,
  KeywordEntry,
  CalloutEntry,
  NotificationMessage,
  NotificationStyle,
  Word,
  SubtitleSegment,
  // Styles
  SubtitleStyle,
  KeywordStyle,
  CardStyle,
  EndCardStyle,
} from "./types";

// Utility: compute total output frames from a timeline + config
export function computeTotalFrames(
  timeline: import("./types").TimelineSegment[],
  config: import("./types").VideoConfig,
): number {
  return timeline.reduce((sum, seg) => {
    const outputDurationSec = seg.durationSec / config.playbackRate;
    return sum + Math.round(outputDurationSec * config.fps);
  }, 0);
}
