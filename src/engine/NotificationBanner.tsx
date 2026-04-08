/**
 * macOS-style notification banners that slide in from the top.
 *
 * Supports multiple visual styles: WhatsApp (green icon), iMessage
 * (blue icon), and a generic neutral style.
 *
 * Each message slides down independently based on its `delaySec`.
 */
import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
} from "remotion";
import type { NotificationMessage, NotificationStyle } from "./types";

export interface NotificationBannerProps {
  /** Messages to display, each with its own delay. */
  messages: NotificationMessage[];
  /** Raw start time of the current segment (seconds). */
  segmentRawStartSec: number;
  /** Playback rate multiplier. */
  playbackRate: number;
  /** Visual style preset. Defaults to "whatsapp". */
  notificationStyle?: NotificationStyle;
}

// WhatsApp SVG icon path
const WHATSAPP_ICON = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.025.507 3.932 1.396 5.608L0 24l6.576-1.353A11.946 11.946 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.6c-1.876 0-3.654-.504-5.184-1.44l-.372-.22-3.852.792.828-3.732-.252-.396A9.548 9.548 0 012.4 12c0-5.292 4.308-9.6 9.6-9.6 5.292 0 9.6 4.308 9.6 9.6 0 5.292-4.308 9.6-9.6 9.6z" />
  </svg>
);

const styleConfig: Record<
  NotificationStyle,
  { iconBg: string; icon: React.ReactNode; appLabel: string }
> = {
  whatsapp: {
    iconBg: "#25D366",
    icon: WHATSAPP_ICON,
    appLabel: "WhatsApp",
  },
  imessage: {
    iconBg: "#34C759",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
        <path d="M12 2C6.477 2 2 5.813 2 10.5c0 2.57 1.402 4.867 3.6 6.45-.18 1.812-.9 3.45-.9 3.45s2.7-.45 4.05-1.35c.99.27 2.07.45 3.25.45 5.523 0 10-3.813 10-8.5S17.523 2 12 2z" />
      </svg>
    ),
    appLabel: "iMessage",
  },
  generic: {
    iconBg: "#6B7280",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z" />
      </svg>
    ),
    appLabel: "Notification",
  },
};

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  messages,
  segmentRawStartSec,
  playbackRate,
  notificationStyle = "whatsapp",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const outputTimeSec = frame / fps;

  const { iconBg, icon, appLabel } = styleConfig[notificationStyle];

  return (
    <>
      {messages.map((msg, idx) => {
        const entryOutputSec = msg.delaySec / playbackRate;
        if (outputTimeSec < entryOutputSec) return null;

        const elapsed = outputTimeSec - entryOutputSec;
        const slideDur = 0.4;

        const translateY = interpolate(elapsed, [0, slideDur], [-80, 0], {
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.back(1.2)),
        });

        const opacity = interpolate(elapsed, [0, slideDur * 0.5], [0, 1], {
          extrapolateRight: "clamp",
        });

        return (
          <div
            key={idx}
            style={{
              position: "absolute",
              top: 30 + idx * 90,
              right: 30,
              zIndex: 18 + idx,
              opacity,
              transform: `translateY(${translateY}px)`,
            }}
          >
            <div
              style={{
                width: 360,
                background: "rgba(255, 255, 255, 0.92)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                borderRadius: 16,
                padding: "14px 16px",
                boxShadow:
                  "0 4px 24px rgba(0,0,0,0.15), 0 1px 4px rgba(0,0,0,0.1)",
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
              }}
            >
              {/* App icon */}
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: iconBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {icon}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 2,
                  }}
                >
                  <span
                    style={{
                      fontFamily:
                        "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#1a1a1a",
                    }}
                  >
                    {msg.sender}
                  </span>
                  <span
                    style={{
                      fontFamily:
                        "-apple-system, BlinkMacSystemFont, sans-serif",
                      fontSize: 12,
                      fontWeight: 400,
                      color: "#999",
                    }}
                  >
                    {appLabel}
                  </span>
                </div>
                <div
                  style={{
                    fontFamily:
                      "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
                    fontSize: 15,
                    fontWeight: 400,
                    color: "#333",
                    lineHeight: 1.35,
                  }}
                >
                  {msg.text}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
};
