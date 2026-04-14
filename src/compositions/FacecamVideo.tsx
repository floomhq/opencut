/**
 * Generic facecam Remotion composition.
 *
 * Accepts all video data as inputProps so it can be driven dynamically
 * by the facecam pipeline without any hardcoded per-video files.
 *
 * Register via calculateMetadata so durationInFrames is computed from inputProps.
 */
import React from "react";
import { CalculateMetadataFunction } from "remotion";
import { VideoComposition } from "../engine";
import type { SubtitleSegment, TimelineSegment } from "../engine";

export interface FacecamVideoProps {
  subtitleSegments: SubtitleSegment[];
  timelineSegments: TimelineSegment[];
  videoSrc: string;
  playbackRate: number;
  fps: number;
  width: number;
  height: number;
  [key: string]: unknown;
}

const DEFAULT_PROPS: FacecamVideoProps = {
  subtitleSegments: [],
  timelineSegments: [],
  videoSrc: "placeholder.mp4",
  playbackRate: 1.0,
  fps: 30,
  width: 1920,
  height: 1080,
};

export const calculateFacecamMetadata: CalculateMetadataFunction<FacecamVideoProps> = ({
  props,
}) => {
  const { timelineSegments, playbackRate, fps } = props;
  const totalSec = timelineSegments.reduce((sum, s) => sum + s.durationSec, 0);
  const durationInFrames = Math.max(
    1,
    Math.round((totalSec / playbackRate) * fps),
  );
  return { durationInFrames, fps, width: props.width, height: props.height };
};

export const FacecamVideo: React.FC<FacecamVideoProps> = ({
  subtitleSegments,
  timelineSegments,
  videoSrc,
  playbackRate,
  fps,
  width,
  height,
}) => {
  const videoConfig = {
    playbackRate,
    fps,
    width,
    height,
    crossfadeFrames: 0,
    facecamAsset: videoSrc,
  };

  return (
    <VideoComposition
      timeline={timelineSegments}
      videoConfig={videoConfig}
      subtitleSegments={subtitleSegments}
      audioOffsetSec={0}
    />
  );
};

export { DEFAULT_PROPS };
