# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Security
- Fixed command injection vulnerability in `render.ts` — replaced `execSync(cmd)` with `execFileSync("npx", args)` (#security-audit)
- Replaced all dynamic shell execution with argument-array APIs

### Changed
- Refactored `VideoProject.ts` (365 lines, 3 responsibilities) into focused modules:
  - `loader.ts` — JSON/YAML project loading
  - `validator.ts` — project validation
  - `generator.ts` — Remotion file generation
  - `types.ts` — shared interfaces
- Upgraded TypeScript target from `ES2018` to `ES2022` for native `Error.cause` support

### Added
- Zod-based environment variable validation in `src/env.ts`
- `.env.example` with all required API keys and configuration
- Agent instructions (`CLAUDE.md`) with project conventions, stack, and workflow
- ESLint + Prettier configuration with strict TypeScript rules
- `preserve-caught-error` rule: all re-thrown errors now attach `{ cause: originalError }`

### Fixed
- Added debug logging to 11 previously silent empty `catch` blocks
- Enabled `noUnusedLocals` + `noUnusedParameters` in `tsconfig.json`; fixed 5 violations
- All ESLint errors resolved (0 errors, warnings only for intentional dynamic `require` calls)

## [0.4.0] — 2025-04-27

### Added
- Plugin system (`src/engine/plugin.ts`) for custom segment renderers, background effects, and timeline transforms
- `--watch` mode for `render.ts` — auto-re-renders on config/timeline/Root.tsx changes
- 14 render CLI tests covering `findProjectFile`, `extractCompositionId`, `parseFramesArg`, `findEntryPoint`
- Integration test that renders actual frames via `@remotion/renderer` with auto-detected Chrome
- Performance benchmarks for particles, audio, and Ken Burns animations

### Changed
- README updated with plugin system, watch mode, and new examples

## [0.3.0] — 2025-04-26

### Added
- Animation domain refactor: split 307-line god-module into `src/engine/animation/`:
  - `audio.ts`, `color.ts`, `easing.ts`, `kenburns.ts`, `motion.ts`, `particles.ts`, `spring.ts`, `timing.ts`
- 3 new examples: `openslides`, `format-demo`, `floom-launch`
- GitHub Actions CI with typecheck, test coverage (`c8`), and `typedoc` docs
- `init-core.ts` extracted from `init.ts` for testability

### Fixed
- Audit cleanup: removed unused imports, deduplicated types, fixed CrossfadeScene overlap

## [0.2.0] — 2025-04-25

### Added
- Production video components: `SubtitleOverlay`, `TitleCard`, `EndCard`, `FaceBubble`, `BackgroundEffects`
- Multi-format support via `FormatAdapter` (16:9, 9:16, 1:1, 4:5)
- Stock B-roll integration with GitHub/Unsplash image fallbacks
- AI visual planner (`src/ai/planner.ts`) with Gemini scene generation
- `InlinePanelOverlay`, `SplitScreenBackground`, `AnimatedDiagram`
- 4 concept slides per section with background music
- Real GitHub B-roll with 18s max per facecam segment

### Changed
- Faster playback (1.2→1.35x) and quieter background music (0.07→0.04)

## [0.1.0] — 2025-04-24

### Added
- Initial OpenCut engine with Remotion 4.0.446
- Core CLI tools: `init`, `validate`, `transcribe`, `render`
- Quickstart example with config-driven timeline
- `CrossfadeScene`, `KineticTypography`, `TypingText`, `VideoBackground`
- Audio waveform visualization
- Node.js built-in test runner with `ts-node/register`
