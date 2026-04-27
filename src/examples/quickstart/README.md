# Quickstart Example

This is the simplest possible OpenCut video.

## Files

- `config.ts` — minimal video settings (1920×1080, 30fps, no music)
- `timeline.ts` — two segments: a title card intro and an end card outro
- `subtitles.ts` — empty subtitle export (no captions needed)
- `Root.tsx` — Remotion composition wiring
- `index.ts` — entry point

## Render

1. Place a `facecam.mp4` file in the `public/` folder.
2. Run:
   ```bash
   npx remotion render src/examples/quickstart/index.ts Quickstart out/quickstart.mp4
   ```
   Or use the CLI helper:
   ```bash
   npx ts-node src/cli/render.ts quickstart
   ```
