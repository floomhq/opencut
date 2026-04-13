/**
 * AI Engineer Basics video timeline.
 *
 * Refined from Whisper transcript (176 segments, 523.5s, 1348 words).
 * Topics identified from actual transcript content.
 *
 * ASSET MANIFEST (required in public/):
 *   ai-engineer-basics.mov  - Federico talking (primary footage)
 *
 * Source video: facecam, raw duration ~523.5s at 1x speed.
 * At playbackRate 1.2, rendered duration ≈ 436s (~7.3min).
 */
import type { TimelineSegment } from "../../engine";

export const TIMELINE: TimelineSegment[] = [
  // 0-7s: Hook — "What do you need to go from VibeCoder to AI engineer?"
  {
    id: "s01-hook",
    type: "facecam-full",
    facecamStartSec: 0,
    durationSec: 7,
    faceBubble: "hidden",
    showSubtitles: true,
    showTitleCard: true,
    keywords: [
      { text: "VibeCoder", startSec: 1, endSec: 5 },
    ],
  },

  // 7-36s: The Problem — chaos when things break, no visibility
  {
    id: "s02-the-problem",
    type: "facecam-full",
    facecamStartSec: 7,
    durationSec: 29,
    faceBubble: "hidden",
    showSubtitles: true,
    keywords: [
      { text: "Chaos", startSec: 13, endSec: 17 },
    ],
  },

  // 36-105s: GitHub — version control, fix the chaos
  {
    id: "s03-github",
    type: "facecam-full",
    facecamStartSec: 36,
    durationSec: 69,
    faceBubble: "hidden",
    showSubtitles: true,
    keywords: [
      { text: "GitHub", startSec: 40, endSec: 44 },
      { text: "Version Control", startSec: 47, endSec: 51 },
    ],
  },

  // 105-165s: Branches & PRs — stop breaking working code
  {
    id: "s04-branches-prs",
    type: "facecam-full",
    facecamStartSec: 105,
    durationSec: 60,
    faceBubble: "hidden",
    showSubtitles: true,
    keywords: [
      { text: "Branches", startSec: 107, endSec: 111 },
      { text: "Pull Requests", startSec: 124, endSec: 128 },
      { text: "Atomic Commits", startSec: 148, endSec: 152 },
    ],
  },

  // 164-220s: CI/CD Pipelines — prevent regressions
  {
    id: "s05-cicd",
    type: "facecam-full",
    facecamStartSec: 164,
    durationSec: 57,
    faceBubble: "hidden",
    showSubtitles: true,
    keywords: [
      { text: "CI/CD Pipeline", startSec: 176, endSec: 180 },
      { text: "Auto Checks", startSec: 185, endSec: 189 },
    ],
  },

  // 220-244s: Testing Types — unit, integration, end-to-end
  {
    id: "s06-testing-types",
    type: "facecam-full",
    facecamStartSec: 220,
    durationSec: 25,
    faceBubble: "hidden",
    showSubtitles: true,
    keywords: [
      { text: "Unit Tests", startSec: 222, endSec: 226 },
      { text: "End-to-End", startSec: 228, endSec: 232 },
    ],
  },

  // 244-291s: Deployment — Vercel, Render, Railway
  {
    id: "s07-deployment",
    type: "facecam-full",
    facecamStartSec: 244,
    durationSec: 47,
    faceBubble: "hidden",
    showSubtitles: true,
    keywords: [
      { text: "Vercel", startSec: 258, endSec: 262 },
      { text: "Render & Railway", startSec: 264, endSec: 268 },
    ],
  },

  // 291-353s: Debugging & Testing Agents
  {
    id: "s08-debugging-agents",
    type: "facecam-full",
    facecamStartSec: 291,
    durationSec: 62,
    faceBubble: "hidden",
    showSubtitles: true,
    keywords: [
      { text: "Debugging", startSec: 294, endSec: 298 },
      { text: "Happy Path", startSec: 318, endSec: 322 },
      { text: "Unhappy Path", startSec: 324, endSec: 328 },
    ],
  },

  // 353-402s: Docs & GitHub Issues — README, MD files, issue tracking
  {
    id: "s09-docs-issues",
    type: "facecam-full",
    facecamStartSec: 353,
    durationSec: 44,
    faceBubble: "hidden",
    showSubtitles: true,
    keywords: [
      { text: "README", startSec: 376, endSec: 380 },
      { text: "GitHub Issues", startSec: 383, endSec: 387 },
    ],
  },

  // 396-490s: AI Superpower — agents, quality loops, autonomous review
  {
    id: "s10-ai-superpower",
    type: "facecam-full",
    facecamStartSec: 396,
    durationSec: 95,
    faceBubble: "bottom-left",
    showSubtitles: true,
    keywords: [
      { text: "Quality Loops", startSec: 443, endSec: 447 },
      { text: "Autonomous Agents", startSec: 454, endSec: 458 },
      { text: "Score 0-10", startSec: 491, endSec: 495 },
    ],
  },

  // 490-523.5s: Outro — summary and sign-off
  {
    id: "s11-outro",
    type: "facecam-full",
    facecamStartSec: 490,
    durationSec: 33.5,
    faceBubble: "hidden",
    showSubtitles: true,
    showEndCard: true,
  },
];
