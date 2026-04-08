/**
 * Full-screen end card overlay with CTA.
 *
 * Displays a large title, a call-to-action line, and a URL pill.
 * Fades in partway through the segment (controlled by `fadeStartSec`).
 */
import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
} from "remotion";
import type { EndCardStyle } from "./types";

export interface EndCardProps {
  /** Main title text (typically the product name). */
  title: string;
  /** Call-to-action text. Defaults to "Try it free". */
  ctaText?: string;
  /** URL shown in the pill at the bottom. */
  url?: string;
  /** When the card starts fading in, in raw seconds from segment start. Defaults to 1.0. */
  fadeStartRawSec?: number;
  /** Playback rate multiplier (used to convert raw to output time). */
  playbackRate: number;
  /** Visual style overrides. */
  style?: EndCardStyle;
}

export const EndCard: React.FC<EndCardProps> = ({
  title,
  ctaText = "Try it free",
  url,
  fadeStartRawSec = 1.0,
  playbackRate,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const outputTimeSec = frame / fps;

  const fadeStart = fadeStartRawSec / playbackRate;
  const fadeEnd = fadeStart + 0.4;

  if (outputTimeSec < fadeStart) return null;

  const opacity =
    outputTimeSec < fadeEnd
      ? interpolate(outputTimeSec, [fadeStart, fadeEnd], [0, 1], {
          easing: Easing.out(Easing.cubic),
        })
      : 1;

  const fontFamily =
    style?.fontFamily ?? "Montserrat, Liberation Sans, Arial Black, sans-serif";
  const titleFontSize = style?.titleFontSize ?? 84;
  const titleColor = style?.titleColor ?? "#ffffff";
  const ctaColor = style?.ctaColor ?? "#4ade80";
  const backgroundColor = style?.backgroundColor ?? "rgba(8, 8, 8, 0.8)";
  const backdropBlur = style?.backdropBlur ?? "blur(12px)";
  const urlFontFamily =
    style?.urlFontFamily ?? "JetBrains Mono, SF Mono, monospace";

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
          letterSpacing: 5,
          textShadow:
            "0 4px 28px rgba(0,0,0,0.5), 0 0 80px rgba(255,255,255,0.08)",
          marginBottom: 36,
        }}
      >
        {title}
      </div>

      {ctaText && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: url ? 28 : 0,
          }}
        >
          <span
            style={{
              fontFamily: "Inter, -apple-system, sans-serif",
              fontSize: 38,
              fontWeight: 600,
              color: ctaColor,
              letterSpacing: 1,
            }}
          >
            {ctaText}
          </span>
          <span
            style={{
              fontFamily: "Inter, -apple-system, sans-serif",
              fontSize: 38,
              color: ctaColor,
            }}
          >
            {"\u2192"}
          </span>
        </div>
      )}

      {url && (
        <div
          style={{
            fontFamily: urlFontFamily,
            fontSize: 26,
            fontWeight: 400,
            color: "rgba(255, 255, 255, 0.75)",
            letterSpacing: 0.8,
            background: "rgba(255, 255, 255, 0.06)",
            borderRadius: 50,
            padding: "12px 32px",
            border: "1px solid rgba(255, 255, 255, 0.12)",
          }}
        >
          {url}
        </div>
      )}
    </div>
  );
};
