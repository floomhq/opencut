# video-engine

Remotion-based video production engine for product demo videos.

Record yourself talking about your product, transcribe with Whisper, define a timeline, and render a polished video with word-level subtitles, face-cam bubbles, keyword overlays, notification banners, title cards, and end cards.

## Workflow

1. **Record** raw facecam footage (talking head, screen recordings, screenshots).
2. **Transcribe** with Whisper using `--word_timestamps True` to get word-level timing.
3. **Define a timeline** -- an array of `TimelineSegment` objects that map sections of your recording to visual backgrounds and overlays.
4. **Write subtitles** -- paste the Whisper JSON output into a `subtitles.ts` file.
5. **Configure** -- set playback rate, resolution, facecam path, and background music in a `VideoConfig`.
6. **Register** a Remotion composition using `VideoComposition` and render.

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
  engine/                 # Reusable video components
    types.ts              # All TypeScript interfaces
    Composition.tsx       # Sequences timeline segments + audio
    Segment.tsx           # Renders one segment (background + overlays)
    FaceBubble.tsx        # Circular face-cam PiP
    SubtitleOverlay.tsx   # Word-level subtitles with highlight
    KeywordOverlay.tsx    # Large keyword text overlays
    TitleCard.tsx         # Full-screen title overlay
    EndCard.tsx           # Full-screen end card with CTA
    NotificationBanner.tsx # Slide-in notification popups
    index.ts              # Public API exports
  examples/
    openslides/           # Example: OpenSlides product demo
      config.ts           # VideoConfig for this video
      timeline.ts         # Timeline segments
      subtitles.ts        # Whisper transcript data
      Root.tsx             # Remotion root + composition registration
      index.ts            # Entry point for remotion CLI
```

## Creating a new video

1. Create a folder under `src/examples/your-project/`.
2. Add three files:

**config.ts** -- video settings:
```ts
import type { VideoConfig } from "../../engine";

export const MY_CONFIG: VideoConfig = {
  playbackRate: 1.2,        // Speed up 20%
  fps: 30,
  width: 1920,
  height: 1080,
  crossfadeFrames: 10,
  facecamAsset: "my-facecam.mov",
  bgMusicAsset: "music.mp3",
  bgMusicVolume: 0.06,
};
```

**timeline.ts** -- what happens when:
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
  // ...more segments
];
```

**Root.tsx** -- wire it up:
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

3. Place your assets in `public/` (facecam, screenshots, music).
4. Render: `npx remotion render src/examples/your-project/index.ts MyVideo out/my-video.mp4`

## Component API

### VideoComposition

Top-level component. Takes the full timeline, config, and subtitles; sequences everything into the final video.

| Prop | Type | Description |
|------|------|-------------|
| `timeline` | `TimelineSegment[]` | Ordered segments |
| `videoConfig` | `VideoConfig` | Resolution, fps, playback rate, assets |
| `subtitleSegments` | `SubtitleSegment[]` | Whisper transcript with word timing |
| `audioOffsetSec` | `number` | Audio sync correction (seconds) |
| `titleCardTitle` | `string` | Title card main text |
| `titleCardSubtitle` | `string` | Title card subtitle |
| `endCardTitle` | `string` | End card main text |
| `endCardCtaText` | `string` | End card CTA button text |
| `endCardUrl` | `string` | End card URL pill |
| `subtitleStyle` | `SubtitleStyle` | Font, colors, outline overrides |
| `keywordStyle` | `KeywordStyle` | Keyword overlay style overrides |
| `titleCardStyle` | `CardStyle` | Title card style overrides |
| `endCardStyle` | `EndCardStyle` | End card style overrides |

### TimelineSegment

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique segment identifier |
| `type` | `SegmentType` | `"facecam-full"`, `"slides"`, `"screen-static"`, `"screen-video"`, `"cta"` |
| `facecamStartSec` | `number` | Where in raw footage this segment starts |
| `durationSec` | `number` | Raw duration (pre-speedup) |
| `faceBubble` | `FaceBubblePosition` | Bubble corner or `"hidden"` |
| `showSubtitles` | `boolean` | Enable subtitle overlay |
| `screenImage` | `string?` | Static background image path |
| `screenVideo` | `string?` | Video background path |
| `slideImages` | `string[]?` | Slideshow image paths |
| `slideDuration` | `number?` | Seconds per slide |
| `overlayText` | `string?` | Small overlay text |
| `overlayTextTiming` | `[number, number]?` | Start/end in raw seconds |
| `keywords` | `KeywordEntry[]?` | Large keyword overlays |
| `callouts` | `CalloutEntry[]?` | Callout badges |
| `showTitleCard` | `boolean?` | Show title card |
| `showEndCard` | `boolean?` | Show end card |
| `notifications` | `object?` | Notification banner config |

### FaceBubble

Circular PiP of the speaker. Configurable size, margin, position, and optional contrast/saturation sharpen filter.

### SubtitleOverlay

Auto-groups words into 3-7 word phrases. Highlights the active word in a configurable color (default gold `#F5C518`). Shifts up when a face bubble is at the bottom.

### KeywordOverlay

Large uppercase text with scale-in animation and fade-out. Positioned at the top of the frame.

### TitleCard / EndCard

Full-screen overlays with configurable text, colors, and timing. EndCard includes a CTA arrow and monospace URL pill.

### NotificationBanner

macOS-style slide-in notifications. Supports WhatsApp (green), iMessage (blue), and generic (gray) style presets. Each message has an independent delay.

## Rendering on a server

All rendering runs through Remotion CLI. On a headless server:

```bash
timeout 10m npx remotion render src/examples/openslides/index.ts OpenSlidesDemo out/video.mp4
```

Use `timeout` to prevent runaway renders. Recommended: run on a dedicated server, not a laptop.

## License

Private. Not for redistribution.
