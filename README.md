<h1 align="center">OpenCut — AI Video Production Engine</h1>

<p align="center">
  <a href="https://www.npmjs.com/package/opencut">
    <img src="https://img.shields.io/npm/v/opencut.svg" alt="npm version">
  </a>
  <a href="https://github.com/floomhq/opencut/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="MIT License">
  </a>
  <img src="https://img.shields.io/badge/TypeScript-5.x-blue.svg" alt="TypeScript 5">
  <img src="https://img.shields.io/badge/Remotion-4.x-blueviolet.svg" alt="Remotion 4">
  <img src="https://img.shields.io/badge/Tests-125%20passing-brightgreen.svg" alt="125 tests passing">
  <img src="https://img.shields.io/badge/Coverage-44%25-yellow.svg" alt="Code coverage">
</p>

<p align="center">
  <strong>Open-source, AI-powered video production engine built on Remotion.</strong><br>
  Define a timeline in TypeScript, point it at your footage and transcript, render a polished MP4.<br>
  Built for product demos, LinkedIn content, YouTube videos, and social media clips.
</p>

---

## Table of Contents

- [What is OpenCut?](#what-is-opencut)
- [Quick Start](#quick-start)
- [Why OpenCut?](#why-opencut)
- [Installation](#installation)
- [Workflow](#workflow)
- [CLI Commands](#cli-commands)
- [Features](#features)
- [Engine Components](#engine-components)
- [Animation Utilities](#animation-utilities)
- [Music Sync](#music-sync)
- [Background Effects](#background-effects)
- [Plugin API](#plugin-api)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Creating a New Video](#creating-a-new-video)
- [Server Rendering](#rendering-on-a-server)
- [Examples](#examples)
- [Contributing](#contributing)
- [Changelog](#changelog)
- [License](#license)

---

## What is OpenCut?

OpenCut is a **programmatic video production engine** that turns raw footage, screen recordings, and transcripts into professional MP4 videos using code. It combines:

- **AI transcription** via OpenAI Whisper for word-level captions and automated subtitles
- **React + Remotion** for frame-accurate, programmatic video rendering
- **TypeScript-driven timelines** for declarative, version-controlled video editing
- **A plugin system** for custom segments, background effects, and timeline transforms

Unlike traditional video editors that lock you into GUIs and proprietary formats, OpenCut treats video as code — fully version-controlled, reproducible, and automatable.

### Who is this for?

- **Founders & marketers** creating product demo videos at scale
- **Content creators** batch-producing LinkedIn and YouTube videos
- **Educators** building automated course content with subtitles
- **Developers** who want programmatic video generation in their apps
- **Agencies** rendering client videos from data-driven templates

---

## Quick Start

Get a rendered MP4 in under 5 minutes:

```bash
# 1. Clone and install
git clone https://github.com/floomhq/opencut.git
cd opencut
npm install

# 2. Scaffold a new video project
npx opencut-init my-video

# 3. Drop your facecam.mp4 into public/

# 4. Edit the timeline
# src/examples/my-video/timeline.ts

# 5. Validate assets and timings
npx opencut-validate src/examples/my-video/timeline.ts

# 6. Render your video
npx opencut-render my-video
```

Find your finished video at `out/my-video.mp4`.

For a detailed walkthrough, see **[QUICKSTART.md](./QUICKSTART.md)**.

---

## Why OpenCut?

| Problem | Traditional Editors | OpenCut |
|---------|-------------------|---------|
| Batch rendering | Manual export per video | `npx opencut-render project-name` |
| Subtitles | Manual typing or expensive services | Whisper AI → auto-generated word-level captions |
| Version control | Binary project files | Plain-text TypeScript — diffable, reviewable |
| Automation | No API | Full CLI + programmable timeline |
| Custom effects | Limited presets | React components + plugin system |
| Reproducibility | "It works on my machine" | Deterministic rendering from code |

---

## Installation

### Prerequisites

- [Node.js 20+](https://nodejs.org/)
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)
- (Optional) [Whisper](https://github.com/openai/whisper) for AI transcription
- (Optional) Chrome/Chromium for Remotion rendering

### From Source

```bash
git clone https://github.com/floomhq/opencut.git
cd opencut
npm install
```

### npm

```bash
npm install -g opencut
```

Or install locally in your project:

```bash
npm install opencut
```

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

| Command | Description |
|---------|-------------|
| `npx opencut-init <name>` | Scaffold a new project with config, timeline, subtitles, Root.tsx, and index.ts |
| `npx opencut-transcribe <video>` | Run Whisper AI transcription or generate a subtitle template |
| `npx opencut-validate <timeline.ts>` | Check asset paths, segment durations, and timeline contiguity |
| `npx opencut-render <name>` | Render the full video for a project |
| `npx opencut-render <name> --preview` | Open the Remotion Studio preview UI |
| `npx opencut-render <name> --watch` | Watch files and auto-re-render on changes |
| `npx opencut-render <name> --frames 0-149` | Render a specific frame range |
| `npm run typecheck` | Run TypeScript type checking across the entire codebase |
| `npm run test` | Run the full test suite (125 tests) |
| `npm run test:coverage` | Run tests with code coverage reporting |
| `npm run build` | Compile TypeScript to JavaScript with declaration files |
| `npx remotion studio src/examples/<name>/index.ts` | Open the Remotion preview UI in the browser |

---

## What's New

- **Plugin system** — Register custom segment renderers, background effects, and timeline transforms. See [Plugin API](#plugin-api).
- **Watch mode** — `opencut-render --watch` auto-re-renders when you save timeline.ts, config.ts, or Root.tsx.
- **125 tests** — Full test coverage including integration tests that render actual frames via Remotion.
- **Generative background effects** — Layer animated orbs, particles, grid, waves, dots, or vignette behind any segment without extra assets.
- **TypingText component** — Character-by-character typewriter animation with blinking cursor, configurable speed, and accent-color glow.
- **CrossfadeScene wrapper** — Reusable asymmetric fade-in / fade-out scene transition with cubic easing.
- **Music sync / beat alignment** — Lock scene transitions to musical tempo with `beatsToFrames`, `barsToFrames`, and synced volume curves.
- **Animation utilities** — Pure helper library for particles, wave motion, breathing effects, stagger reveals, lerp colors, Ken Burns presets, and audio-reactivity simulation.

---

## Features

- **AI-powered transcription** — Word-level captions and automated subtitles with active-word highlighting, powered by OpenAI Whisper
- **Social media ready** — Render 1080p horizontal, 1920p vertical, square, and 4:5 MP4s optimized for LinkedIn, YouTube, Instagram, and TikTok
- **Timeline-driven editing** — Declarative TypeScript timeline segments; no drag-and-drop, no UI bloat
- **Face-cam picture-in-picture** — Circular face bubble with configurable position, size, and filters
- **Keyword overlays** — Large animated text callouts to emphasize key moments in your video
- **Notification banners** — macOS-style slide-in popups (WhatsApp, iMessage, generic)
- **Title and end cards** — Full-screen branded cards with customizable CTAs
- **Background effects** — Orbs, particles, grid, waves, dots, vignette — no extra assets needed
- **Music beat synchronization** — Sync scene cuts and volume to musical tempo
- **Open source** — MIT license, fully hackable TypeScript/React codebase

---

## Engine Components

| Component | Description |
|-----------|-------------|
| `VideoComposition` | Top-level component. Takes timeline, config, subtitles; sequences everything into the final video. |
| `Segment` | Renders one timeline segment: background (facecam/screenshot/video/slides) + overlays. |
| `FaceBubble` | Circular face-cam picture-in-picture. Configurable position, size, and filters. |
| `SubtitleOverlay` | Groups words into 3-7 word phrases, highlights the active word. AI-transcribed captions from Whisper. |
| `KeywordOverlay` | Large uppercase text with scale-in animation, positioned at the top. |
| `TitleCard` | Full-screen title overlay with configurable text and colors. |
| `EndCard` | Full-screen end card with CTA button and URL pill. |
| `NotificationBanner` | macOS-style slide-in notifications. Presets: WhatsApp (green), iMessage (blue), generic (gray). |
| `BackgroundEffects` | Generative SVG backgrounds: `orbs`, `particles`, `grid`, `waves`, `dots`, `vignette`. |
| `TypingText` | Typewriter animation with optional blinking cursor, speed control, and accent glow. |
| `CrossfadeScene` | Wraps a scene in `<AbsoluteFill>` with asymmetric fade-in / fade-out opacity. |
| `AnimatedDiagram` | Step-by-step animated diagrams with reveal timing. |
| `ComparisonTable` | Side-by-side feature comparison with animated rows. |
| `AppMockup` | Device frame mockups for app demos. |
| `AudioWaveform` | Real-time audio waveform visualization. |
| `VideoBackground` | Full-motion video backgrounds. |

All style props (`SubtitleStyle`, `KeywordStyle`, `CardStyle`, `EndCardStyle`) are optional overrides on `VideoComposition`.

---

## Animation Utilities

Import pure helpers from `src/engine/animation`:

- `generateParticles(count, seed)` — seeded, deterministic particle array
- `updateParticlePosition(particle, frame, bounds)` — frame-based position with wrapping
- `waveMotion(frame, frequency, amplitude, phase)` — sine-wave motion
- `breathe(frame, minScale, maxScale, speed)` — pulsing scale between two values
- `glitchOffset(frame, intensity)` — randomized offset for glitch effects
- `lerpColor(color1, color2, t)` — linear interpolation between hex colors
- `stagger(index, totalItems, totalDurationSeconds, frame, fps)` — 0-1 reveal progress for list items
- `typewriter(text, frame, fps, charsPerSecond)` — substring for frame-accurate typing
- `animatedCounter(from, to, progress, decimals)` — number interpolation with `easeOutExpo`
- `getKenBurnsTransform(preset, progress)` — cinematic scale/translate for background footage
- `simulateAudioReactivity(frame, intensity)` — frame-pulsed 0-1 value for bass-hit simulation
- `springPresets` — Pre-configured spring physics presets for natural motion
- `easing` — Curated easing functions: `easeInOutCubic`, `easeOutExpo`, `easeInBack`, etc.

---

## Music Sync

Import beat-aware helpers from `src/engine/MusicSync`:

- `getGridBPM(fps, framesPerBeat)` — derive target BPM from grid settings
- `getBeatSyncPlaybackRate(sourceBPM, targetBPM)` — playback rate to lock music to tempo
- `beatsToFrames(beats, bpm, fps)` — exact frame count for N beats
- `barsToFrames(bars, bpm, fps)` — exact frame count for N bars (4/4)
- `buildSceneStarts(durations, overlapFrames)` — compute crossfade start frames
- `getSyncedMusicVolume(frame, totalFrames, baseVolume, fadeInFrames, fadeOutFrames)` — volume curve that fades in at the start and out at the end

---

## Background Effects

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

---

## Plugin API

OpenCut supports plugins for custom segment types, background effects, and timeline transformations.

```ts
import { registerPlugin } from "./engine";

registerPlugin({
  name: "my-plugin",
  segmentRenderers: {
    "custom-scene": CustomSceneComponent,
  },
  backgroundEffectRenderers: {
    "stars": StarsEffectComponent,
  },
  transformTimeline: (timeline) => {
    // Modify or augment timeline before rendering
    return timeline;
  },
});
```

### Plugin Hooks

| Hook | Description |
|------|-------------|
| `segmentRenderers` | Map segment `type` strings to React components. Rendered instead of built-in segments. |
| `backgroundEffectRenderers` | Map `backgroundEffect.type` strings to React components. |
| `transformTimeline` | Receive the full timeline array, return a modified timeline. Applied in registration order. |

### Plugin API Functions

- `registerPlugin(plugin)` — Register a plugin globally.
- `unregisterPlugin(name)` — Remove a plugin by name.
- `clearPlugins()` — Remove all plugins.
- `getSegmentRenderer(type)` — Look up a custom segment renderer.
- `getBackgroundEffectRenderer(type)` — Look up a custom background effect.
- `applyTimelineTransforms(timeline)` — Apply all registered timeline transforms.

---

## API Documentation

Generate and browse TypeDoc API docs for the engine:

```bash
# Generate docs (outputs to docs/api/)
npm run docs:generate

# Serve docs locally on http://localhost:3000
npm run docs:serve
```

The generated documentation covers all engine components, TypeScript types, interfaces, and utilities exported from `src/engine/index.ts` — including `VideoComposition`, `Segment`, `FaceBubble`, `SubtitleOverlay`, `KeywordOverlay`, `TitleCard`, `EndCard`, `NotificationBanner`, `BackgroundEffects`, `TypingText`, `CrossfadeScene`, animation helpers, music sync utilities, and their associated configuration types.

---

## Project Structure

```
src/
  engine/                   # Reusable video components and utilities
    types.ts                # All TypeScript interfaces
    Composition.tsx         # Sequences timeline segments + audio
    Segment.tsx             # Renders one segment (background + overlays)
    FaceBubble.tsx          # Circular face-cam PiP
    SubtitleOverlay.tsx     # Word-level captions with active word highlight
    KeywordOverlay.tsx      # Large keyword text overlays
    TitleCard.tsx           # Full-screen title card
    EndCard.tsx             # Full-screen end card with CTA
    NotificationBanner.tsx  # Slide-in notification popups
    BackgroundEffects.tsx   # Generative background effects
    CrossfadeScene.tsx      # Reusable fade-in/fade-out scene wrapper
    TypingText.tsx          # Typewriter text animation with cursor
    animations.ts           # Pure animation utilities
    MusicSync.ts            # Beat-to-frame math and synced volume curves
    plugin.ts               # Plugin registry for custom renderers
    index.ts                # Public API exports
  cli/
    init.ts                 # Scaffold a new video project
    transcribe.ts           # Whisper wrapper / subtitle template generator
    validate.ts             # Timeline and asset validator
    render.ts               # Render helper with --watch, --preview, --frames
  workflow/
    loader.ts               # JSON/YAML project config loader
    validator.ts            # Project config validation
    generator.ts            # Remotion file generator from project config
    types.ts                # Workflow types
  examples/
    quickstart/             # Minimal 2-segment example
    openslides/             # Product demo video
    format-demo/            # Background effects and multi-format demo
    ai-engineer-basics/     # Long-form educational video
    floom-launch/           # SaaS product launch with beat-synced crossfades
    hyperniche-launch/      # Competitive comparison + animated diagram
    opendraft-research/     # Educational research with kinetic typography
```

---

## Creating a New Video

Create a folder under `src/examples/your-project/` with three files:

### config.ts

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

### timeline.ts

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

### Root.tsx

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

---

## Rendering on a Server

```bash
timeout 10m npx remotion render src/examples/openslides/index.ts OpenSlidesDemo out/video.mp4
```

Use `timeout` to prevent runaway renders on CI or server environments.

---

## Examples

| Example | Description | Render Command |
|---------|-------------|----------------|
| **quickstart** | Minimal title + end card | `npm run test-render` |
| **openslides** | Product demo with facecam + slides | `npm run render` |
| **format-demo** | Background effects + typing text + multi-format | `npx remotion render src/examples/format-demo/index.ts FormatDemo out/format-demo.mp4` |
| **ai-engineer-basics** | Long-form educational video with inline panels | `npm run ai-basics:render` |
| **floom-launch** | SaaS launch with beat-synced crossfades | `npm run floom:render` |
| **hyperniche-launch** | Competitive comparison + animated diagram | `npm run hyperniche:render` |
| **opendraft-research** | Research video with kinetic typography | `npm run opendraft:render` |

---

## Contributing

We welcome contributions! Please see **[CONTRIBUTING.md](./CONTRIBUTING.md)** for guidelines on reporting issues, submitting pull requests, and coding standards.

---

## Changelog

See **[CHANGELOG.md](./CHANGELOG.md)** for a detailed history of releases and changes.

---

## License

OpenCut is released under the [MIT License](./LICENSE).

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/federicodeponte">Federico De Ponte</a>
</p>
