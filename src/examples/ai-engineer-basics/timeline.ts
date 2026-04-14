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
 *
 * A/V SYNC: each segment's facecamStartSec must equal the cumulative
 * sum of all preceding durationSec values. Any mismatch causes
 * audio/video drift from that point onward.
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
    callouts: [
      { text: "VibeCoder → AI Engineer", position: "center", delaySec: 0, durationSec: 1.5 },
    ],
    keywords: [
      // startSec 2 (not 1) so it doesn't overlap with callout (0–1.5s raw)
      { text: "VibeCoder", startSec: 2, endSec: 6 },
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
    callouts: [
      { text: "The Problem", position: "center", delaySec: 0, durationSec: 1.5 },
    ],
    keywords: [
      { text: "Chaos", startSec: 13, endSec: 17 },
      { text: "Nothing Works", startSec: 19, endSec: 23 },
      { text: "Can't Go Back", startSec: 25, endSec: 29 },
      { text: "Everything Breaks", startSec: 30, endSec: 34 },
    ],
  },

  // 36-46s: GitHub slide (screen-static with facecam PiP)
  {
    id: "s03-github-slide",
    type: "screen-static",
    facecamStartSec: 36,
    durationSec: 10,
    faceBubble: "bottom-left",
    showSubtitles: true,
    screenImage: "ae-slides/github.png",
    callouts: [
      { text: "GitHub", position: "center", delaySec: 0, durationSec: 1.5 },
    ],
  },

  // 46-105s: GitHub — version control, fix the chaos
  {
    id: "s03-github",
    type: "facecam-full",
    facecamStartSec: 46,
    durationSec: 59,
    faceBubble: "hidden",
    showSubtitles: true,
    keywords: [
      // "GitHub" keyword removed — outside window (was startSec:40, window starts at 46)
      { text: "Version Control", startSec: 47, endSec: 51 },
      { text: "Every Change Saved", startSec: 53, endSec: 57 },
      { text: "Branches", startSec: 63, endSec: 67 },
      { text: "Staging Preview", startSec: 73, endSec: 77 },
      { text: "Preview Mode", startSec: 92, endSec: 96 },
    ],
    inlinePanels: [
      {
        title: "Working with Git Branches",
        items: [
          "New features isolated from main code",
          "Bug fixes developed on separate tracks",
          "Prevents breaking the working application",
          "Merge only when feature is complete",
        ],
        itemStyle: "bullets",
        startSec: 61,
        endSec: 68,
      },
      {
        title: "The Staging Pipeline",
        items: [
          "Develop feature in isolated branch",
          "Push to Preview (production copy)",
          "Verify and test in live mode",
          "Merge to production once confirmed",
        ],
        itemStyle: "numbered",
        startSec: 77,
        endSec: 85,
        position: "bottom-right",
      },
    ],
  },

  // 105-115s: Branches & PRs slide (screen-static with facecam PiP)
  {
    id: "s04-branches-prs-slide",
    type: "screen-static",
    facecamStartSec: 105,
    durationSec: 10,
    faceBubble: "bottom-left",
    showSubtitles: true,
    screenImage: "ae-slides/branches.png",
    callouts: [
      { text: "Branches & PRs", position: "center", delaySec: 0, durationSec: 1.5 },
    ],
  },

  // 115-164s: Branches & PRs — stop breaking working code
  // durationSec 49 (not 50) so next slide starts exactly at facecamStartSec 164
  {
    id: "s04-branches-prs",
    type: "facecam-full",
    facecamStartSec: 115,
    durationSec: 49,
    faceBubble: "hidden",
    showSubtitles: true,
    keywords: [
      // Shifted into window (was 107, 109 — both outside 115-164)
      { text: "Branches", startSec: 117, endSec: 121 },
      { text: "Merge Conflicts", startSec: 122, endSec: 126 },
      { text: "Pull Requests", startSec: 128, endSec: 132 },
      { text: "Feature Branch", startSec: 134, endSec: 138 },
      { text: "Atomic Commits", startSec: 148, endSec: 152 },
      { text: "Rollback", startSec: 157, endSec: 161 },
    ],
    inlinePanels: [
      {
        title: "What is a Pull Request (PR)?",
        items: [
          "A request to merge code changes into main",
          "Enables review of specific edits before merge",
          "Shows a file-by-file comparison view",
          "Acts as a quality gate before production",
        ],
        itemStyle: "bullets",
        startSec: 123,
        endSec: 130,
      },
      {
        title: "Why Use Atomic Commits?",
        items: [
          "One single logical change per commit",
          "Easier to pin down which commit broke things",
          "Simple to revert without losing unrelated work",
          "Creates a readable, searchable project history",
        ],
        itemStyle: "bullets",
        startSec: 145,
        endSec: 152,
        position: "bottom-right",
      },
    ],
  },

  // 164-174s: CI/CD slide (screen-static with facecam PiP)
  {
    id: "s05-cicd-slide",
    type: "screen-static",
    facecamStartSec: 164,
    durationSec: 10,
    faceBubble: "bottom-left",
    showSubtitles: true,
    screenImage: "ae-slides/cicd.png",
    callouts: [
      { text: "CI/CD Pipeline", position: "center", delaySec: 0, durationSec: 1.5 },
    ],
  },

  // 174-220s: CI/CD Pipelines — prevent regressions
  // durationSec 46 (not 47) so next slide starts exactly at facecamStartSec 220
  {
    id: "s05-cicd",
    type: "facecam-full",
    facecamStartSec: 174,
    durationSec: 46,
    faceBubble: "hidden",
    showSubtitles: true,
    keywords: [
      { text: "CI/CD Pipeline", startSec: 176, endSec: 180 },
      { text: "Auto Checks", startSec: 185, endSec: 189 },
      { text: "Builds Image", startSec: 202, endSec: 206 },
      { text: "Tests Run", startSec: 207, endSec: 211 },
      { text: "Tests Pass → Push", startSec: 211, endSec: 215 },
    ],
    inlinePanels: [
      {
        title: "What is CI/CD?",
        items: [
          "CI = Continuous Integration: auto-test every push",
          "CD = Continuous Deployment: auto-ship if tests pass",
          "Catches regressions before they reach users",
          "Builds a container image of your full app",
        ],
        itemStyle: "bullets",
        startSec: 177,
        endSec: 185,
      },
    ],
  },

  // 220-228s: Testing slide (screen-static with facecam PiP)
  {
    id: "s06-testing-types-slide",
    type: "screen-static",
    facecamStartSec: 220,
    durationSec: 8,
    faceBubble: "bottom-left",
    showSubtitles: true,
    screenImage: "ae-slides/testing.png",
    callouts: [
      { text: "Testing", position: "center", delaySec: 0, durationSec: 1.5 },
    ],
  },

  // 228-244s: Testing Types — unit, integration, end-to-end
  // durationSec 16 (not 17) so next slide starts exactly at facecamStartSec 244
  {
    id: "s06-testing-types",
    type: "facecam-full",
    facecamStartSec: 228,
    durationSec: 16,
    faceBubble: "hidden",
    showSubtitles: true,
    keywords: [
      // Shifted into window (was 222, 225 — both outside 228-244); 3 keywords fit cleanly
      { text: "Unit Tests", startSec: 229, endSec: 233 },
      { text: "Integration", startSec: 234, endSec: 238 },
      { text: "End-to-End", startSec: 239, endSec: 243 },
    ],
    inlinePanels: [
      {
        title: "The Testing Taxonomy",
        items: [
          "Unit: test individual functions in isolation",
          "Integration: test how modules work together",
          "End-to-End: test full user flows in a browser",
        ],
        itemStyle: "numbered",
        startSec: 229,
        endSec: 237,
        position: "bottom-right",
      },
    ],
  },

  // 244-254s: Deployment slide (screen-static with facecam PiP)
  {
    id: "s07-deployment-slide",
    type: "screen-static",
    facecamStartSec: 244,
    durationSec: 10,
    faceBubble: "bottom-left",
    showSubtitles: true,
    screenImage: "ae-slides/deployment.png",
    callouts: [
      { text: "Deployment", position: "center", delaySec: 0, durationSec: 1.5 },
    ],
  },

  // 254-291s: Deployment — Vercel, Render, Railway
  {
    id: "s07-deployment",
    type: "facecam-full",
    facecamStartSec: 254,
    durationSec: 37,
    faceBubble: "hidden",
    showSubtitles: true,
    keywords: [
      { text: "Vercel", startSec: 258, endSec: 262 },
      { text: "Render & Railway", startSec: 264, endSec: 268 },
      { text: "Always Online", startSec: 273, endSec: 277 },
      { text: "Auto-Scaled", startSec: 275, endSec: 279 },
      { text: "Own Server", startSec: 285, endSec: 289 },
    ],
    inlinePanels: [
      {
        title: "AI Engineer Cloud Stack",
        items: [
          "Frontend → Vercel (instant deploys, global CDN)",
          "Backend → Render or Railway (managed servers)",
          "Auto-scaling: spins up more capacity on demand",
          "No manual server setup or SSH required",
        ],
        itemStyle: "bullets",
        startSec: 258,
        endSec: 266,
        position: "bottom-right",
      },
    ],
  },

  // 291-301s: Debugging Agents slide (screen-static with facecam PiP)
  {
    id: "s08-debugging-agents-slide",
    type: "screen-static",
    facecamStartSec: 291,
    durationSec: 10,
    faceBubble: "bottom-left",
    showSubtitles: true,
    screenImage: "ae-slides/debugging.png",
    callouts: [
      { text: "Debugging Agents", position: "center", delaySec: 0, durationSec: 1.5 },
    ],
  },

  // 301-353s: Debugging & Testing Agents
  {
    id: "s08-debugging-agents",
    type: "facecam-full",
    facecamStartSec: 301,
    durationSec: 52,
    faceBubble: "hidden",
    showSubtitles: true,
    keywords: [
      // Shifted into window (was 294 — outside 301-353)
      { text: "Debugging", startSec: 302, endSec: 306 },
      { text: "Automate Tests", startSec: 308, endSec: 312 },
      { text: "Happy Path", startSec: 318, endSec: 322 },
      { text: "Unhappy Path", startSec: 324, endSec: 328 },
      { text: "Browser Access", startSec: 334, endSec: 338 },
      { text: "Full User Power", startSec: 342, endSec: 346 },
    ],
  },

  // 353-361s: Docs & Issues slide (screen-static with facecam PiP)
  {
    id: "s09-docs-issues-slide",
    type: "screen-static",
    facecamStartSec: 353,
    durationSec: 8,
    faceBubble: "bottom-left",
    showSubtitles: true,
    screenImage: "ae-slides/docs.png",
    callouts: [
      { text: "Docs & Issues", position: "center", delaySec: 0, durationSec: 1.5 },
    ],
  },

  // 361-396s: Docs & GitHub Issues — README, MD files, issue tracking
  // durationSec 35 (not 36) so next slide starts exactly at facecamStartSec 396
  {
    id: "s09-docs-issues",
    type: "facecam-full",
    facecamStartSec: 361,
    durationSec: 35,
    faceBubble: "hidden",
    showSubtitles: true,
    keywords: [
      // Shifted into window (was 358 — outside 361-396); spaced to avoid overlap
      { text: "README", startSec: 363, endSec: 367 },
      { text: "MD Files", startSec: 369, endSec: 373 },
      { text: "Markdown", startSec: 375, endSec: 379 },
      { text: "GitHub Issues", startSec: 383, endSec: 387 },
      { text: "Tickets", startSec: 388, endSec: 392 },
    ],
    inlinePanels: [
      {
        title: "Documenting Your Project",
        items: [
          "README.md: project summary, setup steps, usage",
          "Architecture.md: system design decisions",
          "GitHub Issues: task tracking and bug reports",
          "CLAUDE.md: instructions for AI agents on the repo",
        ],
        itemStyle: "bullets",
        startSec: 374,
        endSec: 382,
      },
    ],
  },

  // 396-408s: AI Superpower slide (screen-static with facecam PiP)
  {
    id: "s10-ai-superpower-slide",
    type: "screen-static",
    facecamStartSec: 396,
    durationSec: 12,
    faceBubble: "bottom-left",
    showSubtitles: true,
    screenImage: "ae-slides/ai-superpower.png",
    callouts: [
      { text: "AI Superpower", position: "center", delaySec: 0, durationSec: 1.5 },
    ],
  },

  // 408-490s: AI Superpower — agents, quality loops, autonomous review
  // FIX 1: faceBubble "hidden" (not "bottom-left") — facecam-full shows face as bg already
  // durationSec 82 (not 83) so outro starts exactly at facecamStartSec 490
  {
    id: "s10-ai-superpower",
    type: "facecam-full",
    facecamStartSec: 408,
    durationSec: 82,
    faceBubble: "hidden",
    showSubtitles: true,
    keywords: [
      // Shifted into window (was 396, 406 — both outside 408-490)
      { text: "AI Superpower", startSec: 410, endSec: 414 },
      { text: "Ask AI Anything", startSec: 416, endSec: 420 },
      { text: "Remove Yourself", startSec: 428, endSec: 432 },
      { text: "Quality Loops", startSec: 443, endSec: 447 },
      { text: "Autonomous Agents", startSec: 454, endSec: 458 },
      { text: "Coding + Review", startSec: 476, endSec: 480 },
      // Shifted to avoid overlap with Coding+Review (was 479-483)
      { text: "10/10 Happy", startSec: 481, endSec: 485 },
      // Shifted into window (was 491-495, outside 408-490)
      { text: "Score 0-10", startSec: 486, endSec: 490 },
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
    callouts: [
      { text: "Wrap Up", position: "center", delaySec: 0, durationSec: 1.5 },
    ],
  },
];
