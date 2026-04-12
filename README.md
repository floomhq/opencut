# OpenCut

![License: MIT](https://img.shields.io/badge/License-MIT-green.svg) ![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg) ![Remotion](https://img.shields.io/badge/Remotion-4.x-blueviolet.svg)

Open-source, AI-powered video production engine built on Remotion. Define a timeline, point it at your footage and transcript, render a polished video.

Built for product demo videos, LinkedIn content, and social media clips: word-level captions/subtitles, face-cam bubbles, keyword overlays, notification banners, title/end cards.

## Features

- **AI transcription via Whisper** — word-level captions and subtitles with active-word highlighting, powered by OpenAI Whisper
- **LinkedIn & social media ready** — renders 1080p/1920p MP4s optimized for content creation on LinkedIn, YouTube, and other platforms
- **Timeline-driven** — declarative TypeScript timeline segments; no drag-and-drop, no UI bloat
- **Face-cam picture-in-picture** — circular face bubble with configurable position, size, and filters
- **Keyword overlays** — large animated text callouts to emphasize key moments
- **Notification banners** — macOS-style slide-in popups (WhatsApp, iMessage, generic)
- **Title and end cards** — full-screen branded cards with CTA
- **Open source** — MIT license, fully hackable TypeScript/React codebase

## Powered by

| Tool | Role |
|------|------|
| [Remotion](https://remotion.dev) | React-based programmatic video rendering |
| [Whisper](https://github.com/openai/whisper) | AI speech-to-text for word-level captions |
| TypeScript + React | Type-safe timeline and component authoring |

## How it works

```
Record (facecam + screen)
    |
Transcribe (Whisper --word_timestamps)
    |
Define timeline (array of TimelineSegments)
    |
Render (Remotion CLI)
    |
out/video.mp4
```

1. **Record** raw facecam footage, screen recordings, and screenshots.
2. **Transcribe** with Whisper (AI speech-to-text) using `--word_timestamps True` for word-level captions and timing.
3. **Define a timeline** as an array of `TimelineSegment` objects that map sections of your recording to visual backgrounds and overlays.
4. **Configure** playback rate, resolution, facecam path, and background music in a `VideoConfig`.
5. **Render** with the Remotion CLI.

## Quick start

```bash
npm install

# Preview in browser (requires assets in public/)
npm run preview

# Render full video
npm run render
```

## Project structure

```
src/
  engine/                   # Reusable video components
    types.ts                # All TypeScript interfaces
    Composition.tsx         # Sequences timeline segments + audio
    Segment.tsx             # Renders one segment (background + overlays)
    FaceBubble.tsx          # Circular face-cam PiP
    SubtitleOverlay.tsx     # Word-level captions/subtitles with active word highlight
    KeywordOverlay.tsx      # Large keyword text overlays
    TitleCard.tsx           # Full-screen title card
    EndCard.tsx             # Full-screen end card with CTA
    NotificationBanner.tsx  # Slide-in notification popups
    index.ts                # Public API exports
  examples/
    openslides/             # Example: OpenSlides product demo
```

## Creating a new video

Create a folder under `src/examples/your-project/` with three files:

**config.ts**

```ts
import type { VideoConfig } from "../../engine";

export const MY_CONFIG: VideoConfig = {
  playbackRate: 1.2,
  fps: 30,
  width: 1920,
  height: 1080,
  crossfadeFrames: 10,
  facecamAsset: "my-facecam.mov",
  bgMusicAsset: "music.mp3",
  bgMusicVolume: 0.06,
};
```

**timeline.ts**

```ts
import type { TimelineSegment } from "../../engine";

export const TIMELINE: TimelineSegment[] = [
  {
    id: "intro",
    type: "facecam-full",
    facecamStartSec: 0,
    durationSec: 10,
    faceBubble: "hidden",
    showSubtitles: true,
    showTitleCard: true,
  },
  {
    id: "demo",
    type: "screen-static",
    facecamStartSec: 10,
    durationSec: 20,
    faceBubble: "bottom-left",
    showSubtitles: true,
    screenImage: "my-screenshot.png",
    keywords: [
      { text: "Key Feature", startSec: 12, endSec: 16 },
    ],
  },
];
```

**Root.tsx**

```tsx
import React from "react";
import { Composition } from "remotion";
import { VideoComposition, computeTotalFrames } from "../../engine";
import { MY_CONFIG } from "./config";
import { TIMELINE } from "./timeline";
import { SUBTITLE_SEGMENTS } from "./subtitles";

const totalFrames = computeTotalFrames(TIMELINE, MY_CONFIG);

const MyVideo: React.FC = () => (
  <VideoComposition
    timeline={TIMELINE}
    videoConfig={MY_CONFIG}
    subtitleSegments={SUBTITLE_SEGMENTS}
    titleCardTitle="My Product"
    titleCardSubtitle="The tagline"
    endCardTitle="My Product"
    endCardCtaText="Try it now"
    endCardUrl="myproduct.com"
  />
);

export const RemotionRoot: React.FC = () => (
  <Composition
    id="MyVideo"
    component={MyVideo}
    durationInFrames={totalFrames}
    fps={MY_CONFIG.fps}
    width={MY_CONFIG.width}
    height={MY_CONFIG.height}
  />
);
```

Place assets in `public/` (create the directory if it doesn't exist — it is gitignored), then render:

```bash
npx remotion render src/examples/your-project/index.ts MyVideo out/my-video.mp4
```

## Engine components

| Component | What it does |
|-----------|-------------|
| `VideoComposition` | Top-level component. Takes timeline, config, subtitles; sequences everything into the final video. |
| `Segment` | Renders one timeline segment: background (facecam/screenshot/video/slides) + overlays. |
| `FaceBubble` | Circular face-cam picture-in-picture. Configurable position, size, and filters. |
| `SubtitleOverlay` | Groups words into 3-7 word phrases, highlights the active word. AI-transcribed captions/subtitles from Whisper. |
| `KeywordOverlay` | Large uppercase text with scale-in animation, positioned at the top. |
| `TitleCard` | Full-screen title overlay with configurable text and colors. |
| `EndCard` | Full-screen end card with CTA button and URL pill. |
| `NotificationBanner` | macOS-style slide-in notifications. Presets: WhatsApp (green), iMessage (blue), generic (gray). |

All style props (`SubtitleStyle`, `KeywordStyle`, `CardStyle`, `EndCardStyle`) are optional overrides on `VideoComposition`.

## Rendering on a server

```bash
timeout 10m npx remotion render src/examples/openslides/index.ts OpenSlidesDemo out/video.mp4
```

Use `timeout` to prevent runaway renders.

## License

MIT
