/**
 * OpenSlides demo video timeline.
 *
 * Each segment maps to a section of the facecam recording and defines
 * what visual background and overlays to show.
 *
 * ASSET MANIFEST (required in public/):
 *   facecam.mov           - Federico talking (primary footage)
 *   bg-music.mp3          - Background music track
 *   floom-empty.png       - Floom UI empty state
 *   floom-results.png     - Floom UI with generated slides
 *   github-openslides.png - GitHub repo screenshot
 *   slides/slide-hq-*.png - Generated pitch deck slides (01-08)
 *
 * NOTE: No Floom asset before raw 62.26s (word "Floom" spoken).
 */
import type { TimelineSegment } from "../../engine";

export const TIMELINE: TimelineSegment[] = [
  // 0-8s: "I built Open Slides, SOTA, state of the art"
  {
    id: "pA-intro",
    type: "facecam-full",
    facecamStartSec: 0,
    durationSec: 8,
    faceBubble: "hidden",
    showSubtitles: true,
    showTitleCard: true,
  },

  // 8-23s: "AI Slide Generator, pitch deck, consulting, why so well"
  {
    id: "pB-slides",
    type: "slides",
    facecamStartSec: 8,
    durationSec: 15,
    faceBubble: "bottom-left",
    showSubtitles: true,
    slideImages: [
      "slides/slide-hq-01.png",
      "slides/slide-hq-02.png",
      "slides/slide-hq-03.png",
      "slides/slide-hq-04.png",
      "slides/slide-hq-05.png",
      "slides/slide-hq-06.png",
      "slides/slide-hq-07.png",
      "slides/slide-hq-08.png",
    ],
    slideDuration: 1.875,
    overlayText: "8 slides. Branded. Ready.",
    overlayTextTiming: [1, 8],
  },

  // 23-54s: "URL, design system, logos, Gemini, auditor, permanent link"
  {
    id: "pC-process",
    type: "facecam-full",
    facecamStartSec: 23,
    durationSec: 31,
    faceBubble: "hidden",
    showSubtitles: true,
    keywords: [
      { text: "Design System", startSec: 24.0, endSec: 27.5 },
      { text: "Logos \u00b7 Fonts \u00b7 Colors", startSec: 28.0, endSec: 31.5 },
      { text: "Powered by Gemini", startSec: 36.5, endSec: 39.5 },
      { text: "Independent Quality Auditor", startSec: 43.5, endSec: 47.0 },
      { text: "Shareable Link", startSec: 48.5, endSec: 51.5 },
    ],
  },

  // 54-63s: "open source repo, how will you run it, I built Floom"
  {
    id: "pD-github",
    type: "screen-static",
    facecamStartSec: 54,
    durationSec: 9,
    faceBubble: "bottom-left",
    showSubtitles: true,
    screenImage: "github-openslides.png",
  },

  // 63-69s: "On Floom, I can just deploy any app. It will generate"
  {
    id: "pE-floom-empty",
    type: "screen-static",
    facecamStartSec: 63,
    durationSec: 6,
    faceBubble: "bottom-left",
    showSubtitles: true,
    screenImage: "floom-empty.png",
  },

  // 69-75s: "a UI, a schema, share it with a link. So now you can try"
  {
    id: "pF-floom-results",
    type: "screen-video",
    facecamStartSec: 69,
    durationSec: 6,
    faceBubble: "bottom-left",
    showSubtitles: true,
    screenVideo: "seg-vlad.mp4",
    callouts: [
      { text: "9/10 Quality Score", position: "top-right", delaySec: 1.0, durationSec: 4.0 },
      { text: "12.4s Generation Time", position: "top-left", delaySec: 2.0, durationSec: 3.0 },
    ],
    notifications: {
      messages: [
        { sender: "Vlad", text: "bro what is this", delaySec: 1.0 },
        { sender: "Vlad", text: "did you actually build this lol", delaySec: 2.5 },
        { sender: "Vlad", text: "can you make one for my startup?", delaySec: 4.0 },
      ],
      style: "whatsapp",
      backgroundImage: "floom-results.png",
    },
  },

  // 75-80s: "Open Slides on Floom. That's it."
  {
    id: "pG-outro",
    type: "facecam-full",
    facecamStartSec: 75,
    durationSec: 5,
    faceBubble: "hidden",
    showSubtitles: true,
    showEndCard: true,
  },
];
