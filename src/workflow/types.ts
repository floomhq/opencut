/**
 * Types for the OpenCut project workflow system.
 */

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
