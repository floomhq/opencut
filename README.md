# OpenCut

![License: MIT](https://img.shields.io/badge/License-MIT-green.svg) ![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg) ![Remotion](https://img.shields.io/badge/Remotion-4.x-blueviolet.svg)

Open-source, AI-powered video production engine built on Remotion. Define a timeline, point it at your footage and transcript, render a polished video.

Built for product demo videos, LinkedIn content, and social media clips: word-level captions/subtitles, face-cam bubbles, keyword overlays, notification banners, title/end cards.

---

## Quick Start

Get a rendered MP4 in 5 minutes:

```bash
# 1. Install
git clone https://github.com/federicodeponte/opencut.git
cd opencut
npm install

# 2. Scaffold a new video
npx ts-node src/cli/init.ts my-video

# 3. Drop facecam.mp4 into public/

# 4. Edit src/examples/my-video/timeline.ts

# 5. Validate
npx ts-node src/cli/validate.ts src/examples/my-video/timeline.ts

# 6. Render
npx ts-node src/cli/render.ts my-video
```

Find your video in `out/my-video.mp4`.

For a step-by-step guide, see **[QUICKSTART.md](./QUICKSTART.md)**.

---

## Workflow

```
Record ──► Transcribe ──► Configure ──► Validate ──► Render
  │            │              │             │            │
  │            │              │             │            ▼
facecam    Whisper CLI    timeline.ts   validate.ts   out/*.mp4
+ screen   --word_        + config.ts   checks assets
           timestamps
```

1. **Record** raw facecam footage, screen recordings, and screenshots.
2. **Transcribe** with Whisper (`--word_timestamps True`) for word-level captions.
3. **Configure** your timeline and video settings in TypeScript.
4. **Validate** that all assets exist and timings line up.
5. **Render** with Remotion.

---

## CLI Commands

| Command | What it does |
|---------|-------------|
| `npx ts-node src/cli/init.ts <name>` | Scaffold `src/examples/<name>/` with config, timeline, subtitles, Root.tsx, and index.ts. |
| `npx ts-node src/cli/transcribe.ts <video>` | Run Whisper (if installed) or create an empty `subtitles.ts` template. |
| `npx ts-node src/cli/validate.ts <timeline.ts>` | Check asset paths, segment durations, and timeline contiguity. |
| `npx ts-node src/cli/render.ts <name>` | Render the full video for a project. |
| `npx ts-node src/cli/render.ts <name> --preview` | Render only the first 5 seconds for a quick sanity check. |
| `npm run typecheck` | Run `tsc --noEmit` across the repo. |
| `npm run test-render` | Render a 5-second test of the built-in quickstart example. |
| `npx remotion studio src/examples/<name>/index.ts` | Open the Remotion preview UI in the browser. |

---

## What's new

- **Generative background effects** — Layer animated orbs, particles, grid, waves, dots, or vignette behind any segment without extra assets.
- **TypingText component** — Character-by-character typewriter animation with blinking cursor, configurable speed, and accent-color glow.
- **CrossfadeScene wrapper** — Reusable asymmetric fade-in / fade-out scene transition with cubic easing.
- **Music sync / beat alignment** — Lock scene transitions to musical tempo with `beatsToFrames`, `barsToFrames`, and synced volume curves.
- **Animation utilities** — Pure helper library for particles, wave motion, breathing effects, stagger reveals, lerp colors, Ken Burns presets, and audio-reactivity simulation.

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
    BackgroundEffects.tsx   # Generative background effects (orbs, particles, grid, waves, dots, vignette)
    CrossfadeScene.tsx      # Reusable fade-in/fade-out scene wrapper
    TypingText.tsx          # Typewriter text animation with cursor
    animations.ts           # Pure animation utilities (particles, easing, Ken Burns, etc.)
    MusicSync.ts            # Beat-to-frame math and synced volume curves
    index.ts                # Public API exports
  cli/
    init.ts                 # Scaffold a new video project
    transcribe.ts           # Whisper wrapper / subtitle template generator
    validate.ts             # Timeline and asset validator
    render.ts               # Render helper by project name
  examples/
    quickstart/             # Minimal 2-segment example (title + end card)
    openslides/             # Example: OpenSlides product demo
    format-demo/            # Example: background effects, typing text, and multi-format compositions
    ai-engineer-basics/     # Example: long-form educational video
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
    backgroundEffect: {
      type: "orbs",
      accentColor: "#3b82f6",
      intensity: 0.5,
      orbCount: 2,
    },
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
    backgroundEffect: {
      type: "grid",
      accentColor: "#a78bfa",
      intensity: 0.4,
    },
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
| `BackgroundEffects` | Generative SVG backgrounds: `orbs`, `particles`, `grid`, `waves`, `dots`, `vignette`. |
| `TypingText` | Typewriter animation with optional blinking cursor, speed control, and accent glow. |
| `CrossfadeScene` | Wraps a scene in `<AbsoluteFill>` with asymmetric fade-in / fade-out opacity. |

All style props (`SubtitleStyle`, `KeywordStyle`, `CardStyle`, `EndCardStyle`) are optional overrides on `VideoComposition`.

## Animation utilities

Import pure helpers from `src/engine/animations`:

- `generateParticles(count, seed)` — seeded, deterministic particle array
- `updateParticlePosition(particle, frame, bounds)` — frame-based position with wrapping
- `waveMotion(frame, frequency, amplitude, phase)` — sine-wave motion
- `breathe(frame, minScale, maxScale, speed)` — pulsing scale between two values
- `lerpColor(color1, color2, t)` — linear interpolation between hex colors
- `stagger(index, totalItems, totalDurationSeconds, frame, fps)` — 0-1 reveal progress for list items
- `typewriter(text, frame, fps, charsPerSecond)` — substring for frame-accurate typing
- `animatedCounter(from, to, progress, decimals)` — number interpolation with `easeOutExpo`
- `getKenBurnsTransform(preset, progress)` — cinematic scale/translate for background footage
- `simulateAudioReactivity(frame, intensity)` — frame-pulsed 0-1 value for bass-hit simulation

## Music sync

Import beat-aware helpers from `src/engine/MusicSync`:

- `getGridBPM(fps, framesPerBeat)` — derive target BPM from grid settings
- `getBeatSyncPlaybackRate(sourceBPM, targetBPM)` — playback rate to lock music to tempo
- `beatsToFrames(beats, bpm, fps)` — exact frame count for N beats
- `barsToFrames(bars, bpm, fps)` — exact frame count for N bars (4/4)
- `buildSceneStarts(durations, overlapFrames)` — compute crossfade start frames
- `getSyncedMusicVolume(frame, totalFrames, baseVolume, fadeInFrames, fadeOutFrames)` — volume curve that fades in at the start and out at the end

## Background effects

Add a `backgroundEffect` field to any `TimelineSegment`:

```ts
backgroundEffect: {
  type: "orbs",        // or "particles" | "grid" | "waves" | "dots" | "vignette"
  accentColor: "#3b82f6",
  intensity: 0.5,
  orbCount: 2,         // only for "orbs"
  particleCount: 40,   // only for "particles"
}
```

Effects are rendered as SVG or CSS layers behind the segment content and animate automatically based on the current frame.

## Rendering on a server

```bash
timeout 10m npx remotion render src/examples/openslides/index.ts OpenSlidesDemo out/video.mp4
```

Use `timeout` to prevent runaway renders.

## License

MIT
