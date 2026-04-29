# OpenCut Quick Start

Go from zero to a rendered MP4 in under 10 commands.

---

## 1. Install

```bash
git clone https://github.com/federicodeponte/opencut.git
cd opencut
npm install
```

---

## 2. Create a video

```bash
npx ts-node src/cli/init.ts my-video
```

This scaffolds `src/examples/my-video/` with:
- `config.ts` — resolution, fps, asset paths
- `timeline.ts` — scene segments
- `subtitles.ts` — transcript data
- `Root.tsx` — Remotion composition
- `index.ts` — entry point

---

## 3. Add assets

Drop your files into `public/` (create it if it doesn't exist):

```
public/
  facecam.mp4      # primary talking-head footage
  bg-music.mp3     # optional background music
  screenshot.png   # optional screenshots for screen segments
```

Update `src/examples/my-video/config.ts` so `facecamAsset` matches your file name.

---

## 4. Transcribe (optional but recommended)

```bash
npx ts-node src/cli/transcribe.ts public/facecam.mp4
```

If you have [OpenAI Whisper](https://github.com/openai/whisper) installed, this generates word-level timestamps. If not, the CLI prints install instructions and creates an empty `subtitles.ts` template.

---

## 5. Edit the timeline

Open `src/examples/my-video/timeline.ts` and customize segments:

```ts
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
    screenImage: "screenshot.png",
  },
  {
    id: "outro",
    type: "facecam-full",
    facecamStartSec: 30,
    durationSec: 5,
    faceBubble: "hidden",
    showSubtitles: true,
    showEndCard: true,
  },
];
```

See `src/examples/openslides/timeline.ts` for advanced examples (keywords, notifications, slides, background effects).

---

## 6. Validate

```bash
npx ts-node src/cli/validate.ts src/examples/my-video/timeline.ts
```

Checks that:
- all referenced assets exist in `public/`
- segment durations are positive
- timeline has no gaps or overlaps

---

## 7. Test render (5-second preview)

```bash
npm run test-render
```

This renders the first 150 frames (~5s) of the built-in **quickstart** example so you can verify everything works without waiting for a full render.

To test your own project:

```bash
npx ts-node src/cli/render.ts my-video --preview
```

---

## 8. Full render

```bash
npm run render
```

Or render any project by name:

```bash
npx ts-node src/cli/render.ts my-video
```

---

## 9. Output

Find your MP4 in `out/`:

```bash
ls out/
# my-video.mp4
```

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| **"Asset not found"** | Check that the file exists in `public/` and the path in `config.ts` / `timeline.ts` matches exactly (case-sensitive). |
| **"A/V sync drift"** | Run `validate.ts`. Check that `durationSec` values line up with your facecam footage. Adjust `AUDIO_OFFSET_SEC` in `config.ts` if Whisper timestamps are slightly off. |
| **"Render fails"** | Ensure you have enough disk space (~1 GB per minute of 1080p video). Always run a test render first. Close other heavy apps. |
| **"Type errors"** | Run `npm run typecheck`. Make sure all required fields are present in timeline segments. |
| **"Whisper not found"** | Install with `pip install openai-whisper` and ensure `whisper` is on your `$PATH`. |
| **"Black screen / no video"** | Verify `facecamAsset` points to a valid video in `public/`. Check Remotion's preview (`npx remotion studio src/examples/my-video/index.ts`) to debug. |

---

## 5-Minute Video — Complete Minimal Example

Want the absolute smallest working video? Use the built-in `quickstart` example.

### Files

**`src/examples/quickstart/config.ts`**
```ts
import type { VideoConfig } from "../../engine";

export const QUICKSTART_CONFIG: VideoConfig = {
  playbackRate: 1.0,
  fps: 30,
  width: 1920,
  height: 1080,
  crossfadeFrames: 10,
  facecamAsset: "facecam.mp4",
};
```

**`src/examples/quickstart/timeline.ts`**
```ts
import type { TimelineSegment } from "../../engine";

export const TIMELINE: TimelineSegment[] = [
  {
    id: "intro",
    type: "facecam-full",
    facecamStartSec: 0,
    durationSec: 8,
    faceBubble: "hidden",
    showSubtitles: false,
    showTitleCard: true,
  },
  {
    id: "outro",
    type: "facecam-full",
    facecamStartSec: 8,
    durationSec: 4,
    faceBubble: "hidden",
    showSubtitles: false,
    showEndCard: true,
  },
];
```

**`src/examples/quickstart/subtitles.ts`**
```ts
import type { SubtitleSegment } from "../../engine";

export const SUBTITLE_SEGMENTS: SubtitleSegment[] = [];
```

**`src/examples/quickstart/Root.tsx`**
```tsx
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
  </>
);
```

### Render it

1. Copy any `facecam.mp4` into `public/`.
2. Run `npx ts-node src/cli/validate.ts src/examples/quickstart/timeline.ts`
3. Run `npx ts-node src/cli/render.ts quickstart`
4. Open `out/quickstart.mp4`

That's it — a 12-second branded video with a title card and end card.
