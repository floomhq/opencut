/**
 * Top-level video composition.
 *
 * Takes a timeline (array of TimelineSegments), a VideoConfig, and
 * subtitle data, then sequences everything into a single Remotion
 * composition with audio and visual segments.
 *
 * This is the component you register with Remotion via `<Composition>`.
 */
import React from "react";
import { Audio, Sequence, staticFile, useVideoConfig } from "remotion";
import { Segment } from "./Segment";
import type {
  TimelineSegment,
  VideoConfig,
  SubtitleSegment,
  SubtitleStyle,
  KeywordStyle,
  CardStyle,
  EndCardStyle,
} from "./types";

export interface VideoCompositionProps {
  /** Ordered array of timeline segments. */
  timeline: TimelineSegment[];
  /** Top-level video configuration. */
  videoConfig: VideoConfig;
  /** Whisper subtitle segments (full transcript). */
  subtitleSegments?: SubtitleSegment[];
  /** Audio offset for subtitle sync (seconds). */
  audioOffsetSec?: number;

  // Card content
  titleCardTitle?: string;
  titleCardSubtitle?: string;
  endCardTitle?: string;
  endCardCtaText?: string;
  endCardUrl?: string;

  // Style overrides
  subtitleStyle?: SubtitleStyle;
  keywordStyle?: KeywordStyle;
  titleCardStyle?: CardStyle;
  endCardStyle?: EndCardStyle;
}

export const VideoComposition: React.FC<VideoCompositionProps> = ({
  timeline,
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
  const { fps } = useVideoConfig();

  // Build the sequence layout
  let outputFrameOffset = 0;
  const sequences: Array<{
    segment: TimelineSegment;
    startFrame: number;
    durationFrames: number;
  }> = [];

  for (const seg of timeline) {
    const outputDurationSec = seg.durationSec / videoConfig.playbackRate;
    const durationFrames = Math.round(outputDurationSec * fps);
    sequences.push({
      segment: seg,
      startFrame: outputFrameOffset,
      durationFrames,
    });
    outputFrameOffset += durationFrames;
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* Primary audio (facecam audio track) */}
      <Audio
        src={staticFile(videoConfig.facecamAsset)}
        playbackRate={videoConfig.playbackRate}
        volume={1}
      />

      {/* Optional background music */}
      {videoConfig.bgMusicAsset && (
        <Audio
          src={staticFile(videoConfig.bgMusicAsset)}
          volume={videoConfig.bgMusicVolume ?? 0.08}
        />
      )}

      {/* Segment sequences */}
      {sequences.map(({ segment, startFrame, durationFrames }) => (
        <Sequence
          key={segment.id}
          from={startFrame}
          durationInFrames={durationFrames}
          name={segment.id}
        >
          <Segment
            segment={segment}
            durationFrames={durationFrames}
            videoConfig={videoConfig}
            subtitleSegments={subtitleSegments}
            audioOffsetSec={audioOffsetSec}
            titleCardTitle={titleCardTitle}
            titleCardSubtitle={titleCardSubtitle}
            endCardTitle={endCardTitle}
            endCardCtaText={endCardCtaText}
            endCardUrl={endCardUrl}
            subtitleStyle={subtitleStyle}
            keywordStyle={keywordStyle}
            titleCardStyle={titleCardStyle}
            endCardStyle={endCardStyle}
          />
        </Sequence>
      ))}
    </div>
  );
};
