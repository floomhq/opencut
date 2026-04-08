/**
 * Full-screen title card overlay.
 *
 * Renders a centered title and subtitle over a semi-transparent blurred
 * backdrop. Fades in at the start of the segment and fades out after
 * `durationSec` output seconds.
 */
import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
} from "remotion";
import type { CardStyle } from "./types";

export interface TitleCardProps {
  /** Main title text. */
  title: string;
  /** Smaller subtitle text below the title. */
  subtitle?: string;
  /** How long the card stays visible, in output seconds. Defaults to 2. */
  durationSec?: number;
  /** Visual style overrides. */
  style?: CardStyle;
}

export const TitleCard: React.FC<TitleCardProps> = ({
  title,
  subtitle,
  durationSec = 2.0,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const outputTimeSec = frame / fps;

  const fadeInEnd = 0.15;
  const fadeOutStart = durationSec - 0.4;

  if (outputTimeSec > durationSec) return null;

  let opacity = 1;
  if (outputTimeSec < fadeInEnd) {
    opacity = interpolate(outputTimeSec, [0, fadeInEnd], [0, 1]);
  } else if (outputTimeSec > fadeOutStart) {
    opacity = interpolate(
      outputTimeSec,
      [fadeOutStart, durationSec],
      [1, 0],
      { easing: Easing.inOut(Easing.ease) },
    );
  }

  const fontFamily =
    style?.fontFamily ?? "Montserrat, Liberation Sans, Arial Black, sans-serif";
  const titleFontSize = style?.titleFontSize ?? 80;
  const subtitleFontSize = style?.subtitleFontSize ?? 34;
  const titleColor = style?.titleColor ?? "#ffffff";
  const subtitleColor = style?.subtitleColor ?? "rgba(255, 255, 255, 0.85)";
  const backgroundColor = style?.backgroundColor ?? "rgba(0, 0, 0, 0.55)";
  const backdropBlur = style?.backdropBlur ?? "blur(8px)";

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 25,
        opacity,
        background: backgroundColor,
        backdropFilter: backdropBlur,
      }}
    >
      <div
        style={{
          fontFamily,
          fontSize: titleFontSize,
          fontWeight: 900,
          color: titleColor,
          letterSpacing: 4,
          textShadow:
            "0 4px 24px rgba(0,0,0,0.6), 0 0 60px rgba(255,255,255,0.1)",
          marginBottom: subtitle ? 18 : 0,
        }}
      >
        {title}
      </div>
      {subtitle && (
        <div
          style={{
            fontFamily: "Inter, -apple-system, sans-serif",
            fontSize: subtitleFontSize,
            fontWeight: 500,
            color: subtitleColor,
            letterSpacing: 1.5,
            textShadow: "0 2px 12px rgba(0,0,0,0.5)",
          }}
        >
          {subtitle}
        </div>
      )}
    </div>
  );
};
