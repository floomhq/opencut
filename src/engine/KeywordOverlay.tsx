/**
 * Large keyword/phrase overlay.
 *
 * Displays bold, uppercase text at the top of the frame to emphasize
 * key concepts during a talking-head segment. Keywords fade and scale
 * in, stay visible, then fade out.
 */
import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
} from "remotion";
import type { KeywordEntry, KeywordStyle } from "./types";

export interface KeywordOverlayProps {
  /** Array of keywords with raw-second timing. */
  keywords: KeywordEntry[];
  /** Raw start time of the current timeline segment (seconds). */
  segmentRawStartSec: number;
  /** Playback rate multiplier. */
  playbackRate: number;
  /** Visual style overrides. */
  style?: KeywordStyle;
}

const DEFAULT_OUTLINE = [
  "-3px -3px 0 #000",
  "3px -3px 0 #000",
  "-3px 3px 0 #000",
  "3px 3px 0 #000",
  "-2px 0 0 #000",
  "2px 0 0 #000",
  "0 -2px 0 #000",
  "0 2px 0 #000",
  "0 0 14px rgba(0,0,0,0.9)",
  "0 0 28px rgba(0,0,0,0.5)",
];

export const KeywordOverlay: React.FC<KeywordOverlayProps> = ({
  keywords,
  segmentRawStartSec,
  playbackRate,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const outputTimeSec = frame / fps;
  const rawTimeSec = segmentRawStartSec + outputTimeSec * playbackRate;

  const fontFamily =
    style?.fontFamily ?? "Montserrat, Liberation Sans, Arial Black, sans-serif";
  const fontSize = style?.fontSize ?? 56;
  const fontWeight = style?.fontWeight ?? 900;
  const color = style?.color ?? "#ffffff";
  const outline = (style?.outline ?? DEFAULT_OUTLINE).join(", ");
  const topOffset = style?.topOffset ?? 55;

  return (
    <>
      {keywords.map((kw, idx) => {
        const fadeInDur = 0.35;
        const fadeOutDur = 0.3;

        if (rawTimeSec < kw.startSec || rawTimeSec > kw.endSec) return null;

        const elapsed = rawTimeSec - kw.startSec;
        const remaining = kw.endSec - rawTimeSec;

        let opacity = 1;
        if (elapsed < fadeInDur) {
          opacity = elapsed / fadeInDur;
        } else if (remaining < fadeOutDur) {
          opacity = remaining / fadeOutDur;
        }

        const scale =
          elapsed < fadeInDur
            ? interpolate(elapsed, [0, fadeInDur], [0.8, 1.0], {
                easing: Easing.out(Easing.cubic),
              })
            : 1;

        return (
          <div
            key={idx}
            style={{
              position: "absolute",
              top: topOffset,
              left: 0,
              right: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              zIndex: 16,
              opacity,
              transform: `scale(${scale})`,
            }}
          >
            <span
              style={{
                fontFamily,
                fontSize,
                fontWeight,
                color,
                letterSpacing: 2,
                WebkitTextStroke: "2.5px #000",
                textShadow: outline,
                textTransform: "uppercase",
              }}
            >
              {kw.text}
            </span>
            <div
              style={{
                width: Math.min(kw.text.length * 22, 500),
                height: 3,
                background:
                  "linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)",
                marginTop: 8,
                borderRadius: 2,
              }}
            />
          </div>
        );
      })}
    </>
  );
};
