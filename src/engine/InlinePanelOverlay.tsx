/**
 * Inline concept-explanation panel overlay.
 *
 * Renders a semi-transparent dark panel with a title bar and bullet/numbered
 * items, overlaid ON TOP of the face without cutting away from it.
 * Slides in from the bottom on entry, fades out on exit.
 *
 * Timing uses raw-second coordinates (pre-speedup), same as KeywordOverlay.
 */
import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import type { InlinePanel } from "./types";

export interface InlinePanelOverlayProps {
  panels: InlinePanel[];
  segmentRawStartSec: number;
  playbackRate: number;
}

export const InlinePanelOverlay: React.FC<InlinePanelOverlayProps> = ({
  panels,
  segmentRawStartSec,
  playbackRate,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const outputTimeSec = frame / fps;
  const rawTimeSec = segmentRawStartSec + outputTimeSec * playbackRate;

  return (
    <>
      {panels.map((panel, idx) => {
        if (rawTimeSec < panel.startSec || rawTimeSec > panel.endSec) return null;

        const duration = panel.endSec - panel.startSec;
        const elapsed = rawTimeSec - panel.startSec;
        const remaining = panel.endSec - rawTimeSec;

        const slideInDur = Math.min(0.5, duration * 0.15);
        const fadeOutDur = Math.min(0.4, duration * 0.12);

        const slideProgress = elapsed < slideInDur
          ? interpolate(elapsed, [0, slideInDur], [0, 1], { easing: Easing.out(Easing.cubic) })
          : 1;

        const opacity = remaining < fadeOutDur ? remaining / fadeOutDur : 1;

        const accentColor = panel.accentColor ?? "#4ade80";

        const positionStyle: React.CSSProperties = (() => {
          switch (panel.position ?? "bottom") {
            case "bottom":
              return { bottom: 210, left: 60, right: 60 };
            case "bottom-right":
              return { bottom: 210, right: 60, width: 700 };
            case "center-right":
              return { top: "50%", right: 60, width: 700, transform: "translateY(-50%)" };
          }
        })();

        return (
          <div
            key={idx}
            style={{
              position: "absolute",
              ...positionStyle,
              zIndex: 20,
              opacity,
              transform: `${positionStyle.transform ?? ""} translateY(${(1 - slideProgress) * 40}px)`.trim(),
            }}
          >
            {/* Title bar */}
            <div
              style={{
                background: accentColor,
                borderRadius: "12px 12px 0 0",
                padding: "10px 24px",
              }}
            >
              <span
                style={{
                  fontFamily: "Inter, -apple-system, sans-serif",
                  fontSize: 26,
                  fontWeight: 700,
                  color: "#000",
                  letterSpacing: 0.3,
                }}
              >
                {panel.title}
              </span>
            </div>

            {/* Body */}
            <div
              style={{
                background: "rgba(10, 10, 10, 0.88)",
                backdropFilter: "blur(8px)",
                borderRadius: "0 0 12px 12px",
                border: `1px solid ${accentColor}44`,
                borderTop: "none",
                padding: "16px 24px 20px",
              }}
            >
              {panel.items.map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                    marginBottom: i < panel.items.length - 1 ? 10 : 0,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "Inter, -apple-system, sans-serif",
                      fontSize: 20,
                      fontWeight: 600,
                      color: accentColor,
                      minWidth: 28,
                      flexShrink: 0,
                      paddingTop: 1,
                    }}
                  >
                    {panel.itemStyle === "numbered" ? `${i + 1}.` : "→"}
                  </span>
                  <span
                    style={{
                      fontFamily: "Inter, -apple-system, sans-serif",
                      fontSize: 20,
                      fontWeight: 400,
                      color: "#e0e0e0",
                      lineHeight: 1.4,
                    }}
                  >
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
};
