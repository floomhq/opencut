/**
 * Single timeline segment renderer.
 *
 * Given a TimelineSegment, this component renders the appropriate
 * background (facecam, static image, video, slideshow) and layers
 * all active overlays on top: face bubble, subtitles, keywords,
 * callouts, notification banners, title card, and end card.
 *
 * This is the main composition unit -- the Composition component
 * sequences these into the full video.
 */
import React from "react";
import {
  Img,
  OffthreadVideo,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import { FaceBubble } from "./FaceBubble";
import { SubtitleOverlay } from "./SubtitleOverlay";
import { KeywordOverlay } from "./KeywordOverlay";
import { TitleCard } from "./TitleCard";
import { EndCard } from "./EndCard";
import { NotificationBanner } from "./NotificationBanner";
import type {
  TimelineSegment,
  VideoConfig,
  SubtitleSegment,
  SubtitleStyle,
  KeywordStyle,
  CardStyle,
  EndCardStyle,
} from "./types";

// ---------------------------------------------------------------------------
// Internal sub-components
// ---------------------------------------------------------------------------

const SlideShowBackground: React.FC<{
  slideImages: string[];
  slideDuration: number;
  frame: number;
  fps: number;
  playbackRate: number;
  width: number;
  height: number;
}> = ({ slideImages, slideDuration, frame, fps, playbackRate, width, height }) => {
  const outputTimeSec = frame / fps;
  const rawElapsed = outputTimeSec * playbackRate;
  const slideIndex = Math.min(
    Math.floor(rawElapsed / slideDuration),
    slideImages.length - 1,
  );

  return (
    <Img
      src={staticFile(slideImages[slideIndex])}
      style={{
        width,
        height,
        objectFit: "contain",
        backgroundColor: "#FAFAF7",
      }}
    />
  );
};

const OverlayText: React.FC<{
  text: string;
  timing: [number, number];
  outputTimeSec: number;
  playbackRate: number;
}> = ({ text, timing, outputTimeSec, playbackRate }) => {
  const outStart = timing[0] / playbackRate;
  const outEnd = timing[1] / playbackRate;

  if (outputTimeSec < outStart || outputTimeSec > outEnd) return null;

  const fadeInDur = 0.3;
  const fadeOutDur = 0.3;
  let opacity = 1;
  if (outputTimeSec - outStart < fadeInDur) {
    opacity = (outputTimeSec - outStart) / fadeInDur;
  } else if (outEnd - outputTimeSec < fadeOutDur) {
    opacity = (outEnd - outputTimeSec) / fadeOutDur;
  }

  return (
    <div
      style={{
        position: "absolute",
        top: 10,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        zIndex: 15,
        opacity,
      }}
    >
      <div
        style={{
          background: "rgba(0, 0, 0, 0.6)",
          borderRadius: 10,
          padding: "10px 28px",
          fontFamily: "Inter, -apple-system, sans-serif",
          fontSize: 28,
          fontWeight: 600,
          color: "#ffffff",
          letterSpacing: 0.5,
        }}
      >
        {text}
      </div>
    </div>
  );
};

const CalloutOverlays: React.FC<{
  callouts: Array<{
    text: string;
    position: "top-right" | "top-left" | "center";
    delaySec: number;
    durationSec: number;
  }>;
  outputTimeSec: number;
  playbackRate: number;
}> = ({ callouts, outputTimeSec, playbackRate }) => {
  return (
    <>
      {callouts.map((callout, idx) => {
        const startOut = callout.delaySec / playbackRate;
        const endOut = (callout.delaySec + callout.durationSec) / playbackRate;

        if (outputTimeSec < startOut || outputTimeSec > endOut) return null;

        const fadeIn = 0.3;
        const fadeOut = 0.3;
        let opacity = 1;
        if (outputTimeSec - startOut < fadeIn) {
          opacity = (outputTimeSec - startOut) / fadeIn;
        } else if (endOut - outputTimeSec < fadeOut) {
          opacity = (endOut - outputTimeSec) / fadeOut;
        }

        const posStyle: React.CSSProperties =
          callout.position === "top-right"
            ? { top: 30, right: 40 }
            : callout.position === "top-left"
              ? { top: 30, left: 40 }
              : { top: 30, left: "50%", transform: "translateX(-50%)" };

        return (
          <div
            key={idx}
            style={{
              position: "absolute",
              ...posStyle,
              zIndex: 17,
              opacity,
            }}
          >
            <div
              style={{
                background: "rgba(0, 0, 0, 0.65)",
                borderRadius: 12,
                padding: "12px 24px",
                backdropFilter: "blur(6px)",
                border: "1px solid rgba(255,255,255,0.15)",
                fontFamily: "Inter, -apple-system, sans-serif",
                fontSize: 26,
                fontWeight: 600,
                color: "#4ade80",
                letterSpacing: 0.5,
              }}
            >
              {callout.text}
            </div>
          </div>
        );
      })}
    </>
  );
};

// ---------------------------------------------------------------------------
// Main Segment component
// ---------------------------------------------------------------------------

export interface SegmentProps {
  /** The timeline segment to render. */
  segment: TimelineSegment;
  /** Total frames allocated to this segment in the output. */
  durationFrames: number;
  /** Top-level video configuration. */
  videoConfig: VideoConfig;
  /** Whisper subtitle segments (pass the full array; timing is resolved internally). */
  subtitleSegments?: SubtitleSegment[];
  /** Audio offset for subtitle sync, in seconds. Defaults to 0. */
  audioOffsetSec?: number;

  // Title/End card content (engine doesn't hardcode product names)
  /** Title card text. Required when segment.showTitleCard is true. */
  titleCardTitle?: string;
  /** Title card subtitle. */
  titleCardSubtitle?: string;
  /** End card title. Required when segment.showEndCard is true. */
  endCardTitle?: string;
  /** End card CTA text. */
  endCardCtaText?: string;
  /** End card URL. */
  endCardUrl?: string;

  // Style overrides
  subtitleStyle?: SubtitleStyle;
  keywordStyle?: KeywordStyle;
  titleCardStyle?: CardStyle;
  endCardStyle?: EndCardStyle;
}

export const Segment: React.FC<SegmentProps> = ({
  segment,
  durationFrames,
  videoConfig,
  subtitleSegments,
  audioOffsetSec = 0,
  titleCardTitle,
  titleCardSubtitle,
  endCardTitle,
  endCardCtaText,
  endCardUrl,
  subtitleStyle,
  keywordStyle,
  titleCardStyle,
  endCardStyle,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const outputTimeSec = frame / fps;

  const { playbackRate, width, height, facecamAsset } = videoConfig;

  const facecamFilter = "contrast(1.05) saturate(1.1)";

  // Ken Burns: slow zoom 100% -> 105% for facecam-full
  const kenBurnsScale =
    segment.type === "facecam-full"
      ? interpolate(frame, [0, durationFrames], [1.0, 1.05], {
          extrapolateRight: "clamp",
          extrapolateLeft: "clamp",
        })
      : 1;

  // Quick zoom-in snap for screen/slide segments
  const zoomTransitionFrames = Math.round(0.2 * fps);
  const zoomIn =
    segment.type === "screen-static" ||
    segment.type === "screen-video" ||
    segment.type === "slides"
      ? interpolate(frame, [0, zoomTransitionFrames], [1.02, 1.0], {
          extrapolateRight: "clamp",
          extrapolateLeft: "clamp",
        })
      : 1;

  // Determine whether to use a static background for notification segments
  const hasNotifications = !!segment.notifications;
  const notifBgImage = segment.notifications?.backgroundImage;

  return (
    <div
      style={{
        position: "relative",
        width,
        height,
        overflow: "hidden",
        backgroundColor: "#0a0a0a",
      }}
    >
      {/* Facecam full background */}
      {segment.type === "facecam-full" && (
        <div
          style={{
            width,
            height,
            transform: `scale(${kenBurnsScale})`,
            transformOrigin: "center center",
          }}
        >
          <OffthreadVideo
            src={staticFile(facecamAsset)}
            startFrom={Math.round(segment.facecamStartSec * fps)}
            playbackRate={playbackRate}
            style={{
              width,
              height,
              objectFit: "cover",
              filter: facecamFilter,
            }}
            volume={0}
            muted
          />
        </div>
      )}

      {/* Slideshow background */}
      {segment.type === "slides" && segment.slideImages && (
        <div
          style={{
            width,
            height,
            transform: `scale(${zoomIn})`,
            transformOrigin: "center center",
          }}
        >
          <SlideShowBackground
            slideImages={segment.slideImages}
            slideDuration={segment.slideDuration ?? 2}
            frame={frame}
            fps={fps}
            playbackRate={playbackRate}
            width={width}
            height={height}
          />
        </div>
      )}

      {/* Static screenshot background */}
      {segment.type === "screen-static" && segment.screenImage && (
        <div
          style={{
            width,
            height,
            transform: `scale(${zoomIn})`,
            transformOrigin: "center center",
          }}
        >
          <Img
            src={staticFile(segment.screenImage)}
            style={{
              width,
              height,
              objectFit: "contain",
              backgroundColor: "#FAFAF7",
            }}
          />
        </div>
      )}

      {/* Notification segment: static background + notification overlays */}
      {hasNotifications && notifBgImage && (
        <div
          style={{
            width,
            height,
            transform: `scale(${zoomIn})`,
            transformOrigin: "center center",
          }}
        >
          <Img
            src={staticFile(notifBgImage)}
            style={{
              width,
              height,
              objectFit: "contain",
              backgroundColor: "#FAFAF7",
            }}
          />
        </div>
      )}

      {/* Screen video background (only when no notifications override it) */}
      {(segment.type === "screen-video" || segment.type === "cta") &&
        segment.screenVideo &&
        !hasNotifications && (
          <div
            style={{
              width,
              height,
              transform: `scale(${zoomIn})`,
              transformOrigin: "center center",
            }}
          >
            <OffthreadVideo
              src={staticFile(segment.screenVideo)}
              playbackRate={playbackRate}
              style={{ width, height, objectFit: "cover" }}
              volume={0}
              muted
            />
          </div>
        )}

      {/* Notification banners */}
      {hasNotifications && segment.notifications && (
        <NotificationBanner
          messages={segment.notifications.messages}
          segmentRawStartSec={segment.facecamStartSec}
          playbackRate={playbackRate}
          notificationStyle={segment.notifications.style}
        />
      )}

      {/* Face bubble */}
      <FaceBubble
        position={segment.faceBubble}
        facecamStartSec={segment.facecamStartSec}
        facecamAsset={facecamAsset}
        playbackRate={playbackRate}
        sharpen
      />

      {/* Subtitles */}
      {segment.showSubtitles && subtitleSegments && (
        <SubtitleOverlay
          segments={subtitleSegments}
          segmentRawStartSec={segment.facecamStartSec}
          faceBubblePosition={segment.faceBubble}
          playbackRate={playbackRate}
          audioOffsetSec={audioOffsetSec}
          style={subtitleStyle}
        />
      )}

      {/* Overlay text */}
      {segment.overlayText && segment.overlayTextTiming && (
        <OverlayText
          text={segment.overlayText}
          timing={segment.overlayTextTiming}
          outputTimeSec={outputTimeSec}
          playbackRate={playbackRate}
        />
      )}

      {/* Keywords */}
      {segment.keywords && segment.keywords.length > 0 && (
        <KeywordOverlay
          keywords={segment.keywords}
          segmentRawStartSec={segment.facecamStartSec}
          playbackRate={playbackRate}
          style={keywordStyle}
        />
      )}

      {/* Callouts */}
      {segment.callouts && segment.callouts.length > 0 && (
        <CalloutOverlays
          callouts={segment.callouts}
          outputTimeSec={outputTimeSec}
          playbackRate={playbackRate}
        />
      )}

      {/* Title card */}
      {segment.showTitleCard && titleCardTitle && (
        <TitleCard
          title={titleCardTitle}
          subtitle={titleCardSubtitle}
          style={titleCardStyle}
        />
      )}

      {/* End card */}
      {segment.showEndCard && endCardTitle && (
        <EndCard
          title={endCardTitle}
          ctaText={endCardCtaText}
          url={endCardUrl}
          playbackRate={playbackRate}
          style={endCardStyle}
        />
      )}
    </div>
  );
};
