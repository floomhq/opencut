import React from "react";
import { Composition } from "remotion";
import { VideoComposition, computeTotalFrames } from "../../engine";
import { QUICKSTART_CONFIG, AUDIO_OFFSET_SEC } from "./config";
import { TIMELINE } from "./timeline";
import { SUBTITLE_SEGMENTS } from "./subtitles";

const totalFrames = computeTotalFrames(TIMELINE, QUICKSTART_CONFIG);

const Quickstart: React.FC = () => (
  <VideoComposition
    timeline={TIMELINE}
    videoConfig={QUICKSTART_CONFIG}
    subtitleSegments={SUBTITLE_SEGMENTS}
    audioOffsetSec={AUDIO_OFFSET_SEC}
    titleCardTitle="Quickstart"
    titleCardSubtitle="Your first OpenCut video"
    endCardTitle="Quickstart"
    endCardCtaText="Get started"
    endCardUrl="github.com/federicodeponte/opencut"
  />
);

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="Quickstart"
      component={Quickstart}
      durationInFrames={totalFrames}
      fps={QUICKSTART_CONFIG.fps}
      width={QUICKSTART_CONFIG.width}
      height={QUICKSTART_CONFIG.height}
    />
    <Composition
      id="QuickstartPreview"
      component={Quickstart}
      durationInFrames={5 * QUICKSTART_CONFIG.fps}
      fps={QUICKSTART_CONFIG.fps}
      width={QUICKSTART_CONFIG.width}
      height={QUICKSTART_CONFIG.height}
    />
  </>
);
