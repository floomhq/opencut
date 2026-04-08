/**
 * Remotion root for the OpenSlides demo video.
 *
 * Registers two compositions:
 *   - OpenSlidesDemo: full-length video
 *   - OpenSlidesDemoPreview: first 5 seconds (for quick iteration)
 */
import React from "react";
import { Composition } from "remotion";
import { VideoComposition, computeTotalFrames } from "../../engine";
import { OPENSLIDES_CONFIG, AUDIO_OFFSET_SEC } from "./config";
import { TIMELINE } from "./timeline";
import { SUBTITLE_SEGMENTS } from "./subtitles";

const totalFrames = computeTotalFrames(TIMELINE, OPENSLIDES_CONFIG);

const OpenSlidesDemo: React.FC = () => (
  <VideoComposition
    timeline={TIMELINE}
    videoConfig={OPENSLIDES_CONFIG}
    subtitleSegments={SUBTITLE_SEGMENTS}
    audioOffsetSec={AUDIO_OFFSET_SEC}
    titleCardTitle="OpenSlides"
    titleCardSubtitle="AI Pitch Deck Generator"
    endCardTitle="OpenSlides"
    endCardCtaText="Try it free"
    endCardUrl="floom.dev/apps/openslides"
  />
);

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="OpenSlidesDemo"
      component={OpenSlidesDemo}
      durationInFrames={totalFrames}
      fps={OPENSLIDES_CONFIG.fps}
      width={OPENSLIDES_CONFIG.width}
      height={OPENSLIDES_CONFIG.height}
    />
    <Composition
      id="OpenSlidesDemoPreview"
      component={OpenSlidesDemo}
      durationInFrames={5 * OPENSLIDES_CONFIG.fps}
      fps={OPENSLIDES_CONFIG.fps}
      width={OPENSLIDES_CONFIG.width}
      height={OPENSLIDES_CONFIG.height}
    />
  </>
);
