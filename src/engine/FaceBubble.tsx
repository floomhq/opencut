/**
 * Circular face-cam bubble overlay.
 *
 * Renders a round picture-in-picture of the speaker's face at one of
 * four corners. Pass `position="hidden"` to skip rendering entirely.
 */
import React from "react";
import { OffthreadVideo, staticFile, useVideoConfig } from "remotion";
import type { FaceBubblePosition } from "./types";

export interface FaceBubbleProps {
  /** Corner placement or "hidden". */
  position: FaceBubblePosition;
  /** Where in the raw facecam footage this segment starts (seconds). */
  facecamStartSec: number;
  /** Path to the facecam asset (relative to public/). */
  facecamAsset: string;
  /** Playback rate of the video (e.g. 1.3). */
  playbackRate: number;
  /** Diameter of the bubble in pixels. Defaults to 280. */
  size?: number;
  /** Distance from the edge of the frame in pixels. Defaults to 30. */
  margin?: number;
  /** Apply a slight contrast/saturation boost. Defaults to false. */
  sharpen?: boolean;
}

export const FaceBubble: React.FC<FaceBubbleProps> = ({
  position,
  facecamStartSec,
  facecamAsset,
  playbackRate,
  size = 280,
  margin = 30,
  sharpen = false,
}) => {
  const { fps } = useVideoConfig();

  if (position === "hidden") return null;

  const positionStyles: Record<
    Exclude<FaceBubblePosition, "hidden">,
    React.CSSProperties
  > = {
    "bottom-left": { bottom: margin, left: margin },
    "bottom-right": { bottom: margin, right: margin },
    "top-right": { top: margin, right: margin },
    "top-left": { top: margin, left: margin },
  };

  return (
    <div
      style={{
        position: "absolute",
        ...positionStyles[position],
        width: size,
        height: size,
        borderRadius: "50%",
        overflow: "hidden",
        border: "3px solid #ffffff",
        boxShadow: "0 6px 28px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.3)",
        zIndex: 10,
      }}
    >
      <OffthreadVideo
        src={staticFile(facecamAsset)}
        startFrom={Math.round(facecamStartSec * fps)}
        playbackRate={playbackRate}
        style={{
          width: size * 2,
          height: size * (720 / 1280) * 2,
          objectFit: "cover",
          marginLeft: -(size * 0.5),
          marginTop: -(size * 0.05),
          filter: sharpen ? "contrast(1.05) saturate(1.1)" : undefined,
        }}
        volume={0}
        muted
      />
    </div>
  );
};
