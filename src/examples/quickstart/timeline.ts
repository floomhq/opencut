import type { TimelineSegment } from "../../engine";

export const TIMELINE: TimelineSegment[] = [
  {
    id: "intro",
    type: "facecam-full",
    facecamStartSec: 0,
    durationSec: 8,
    faceBubble: "hidden",
    showSubtitles: false,
    showTitleCard: true,
  },
  {
    id: "outro",
    type: "facecam-full",
    facecamStartSec: 8,
    durationSec: 4,
    faceBubble: "hidden",
    showSubtitles: false,
    showEndCard: true,
  },
];
