/**
 * Reusable crossfade wrapper for scene transitions.
 *
 * Wraps children in an `<AbsoluteFill>` with animated opacity.
 * Supports asymmetric fade-in / fade-out durations and optional
 * cubic easing for smooth musical transitions.
 *
 * Usage:
 *   <Sequence from={start} durationInFrames={dur}>
 *     <CrossfadeScene durationInFrames={dur} fadeIn={11} fadeOut={11}>
 *       <MyScene />
 *     </CrossfadeScene>
 *   </Sequence>
 */

import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";

export interface CrossfadeSceneProps {
  children: React.ReactNode;
  /** Total duration of this scene in frames. */
  durationInFrames: number;
  /** Fade-in duration in frames. Default 11. */
  fadeIn?: number;
  /** Fade-out duration in frames. Default 11. */
  fadeOut?: number;
}

export const CrossfadeScene: React.FC<CrossfadeSceneProps> = ({
  children,
  durationInFrames,
  fadeIn = 11,
  fadeOut = 11,
}) => {
  const frame = useCurrentFrame();

  let opacity = 1;

  if (fadeIn === 0 && fadeOut === 0) {
    opacity = 1;
  } else if (fadeIn === 0) {
    // No fade in, only fade out
    opacity = interpolate(
      frame,
      [durationInFrames - fadeOut, durationInFrames],
      [1, 0],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.in(Easing.cubic),
      }
    );
  } else if (fadeOut === 0) {
    // Only fade in, no fade out
    opacity = interpolate(frame, [0, fadeIn], [0, 1], {
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    });
  } else {
    // Asymmetric easing to reduce muddy overlap on dark scenes
    // Fade-out takes precedence when fadeIn + fadeOut > durationInFrames
    if (frame >= durationInFrames - fadeOut) {
      opacity = interpolate(
        frame,
        [durationInFrames - fadeOut, durationInFrames],
        [1, 0],
        {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.in(Easing.cubic),
        }
      );
    } else if (frame <= fadeIn) {
      opacity = interpolate(frame, [0, fadeIn], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.cubic),
      });
    } else {
      opacity = 1;
    }
  }

  return (
    <AbsoluteFill style={{ opacity }}>
      {children}
    </AbsoluteFill>
  );
};
