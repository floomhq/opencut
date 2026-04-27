/**
 * Music synchronization utilities for beat-aligned video editing.
 *
 * Calculate playback rates, scene durations, and volume curves
 * that lock video transitions to a musical tempo.
 *
 * Usage:
 *   const playbackRate = getBeatSyncPlaybackRate(162, getGridBPM(30, 11));
 *   const hookDur = beatsToFrames(12, 162, 30);
 */

/** Derive a target BPM from fps and frames-per-beat. */
export function getGridBPM(fps: number, framesPerBeat: number): number {
  return (fps * 60) / framesPerBeat;
}

/** Calculate playback rate to lock music to a target BPM. */
export function getBeatSyncPlaybackRate(
  sourceBPM: number,
  targetBPM: number
): number {
  return targetBPM / sourceBPM;
}

/** Convert beat count to frames. */
export function beatsToFrames(
  beats: number,
  bpm: number,
  fps: number
): number {
  const secondsPerBeat = 60 / bpm;
  return Math.round(beats * secondsPerBeat * fps);
}

/** Convert bar count (4/4) to frames. */
export function barsToFrames(
  bars: number,
  bpm: number,
  fps: number
): number {
  return beatsToFrames(bars * 4, bpm, fps);
}

/** Fade volume from 0 to target over fadeIn frames, then hold, then fade out. */
export function getSyncedMusicVolume(
  frame: number,
  totalFrames: number,
  baseVolume: number,
  fadeInFrames: number,
  fadeOutFrames: number
): number {
  const fadeIn = interpolateClamped(frame, [0, fadeInFrames], [0, baseVolume]);
  const fadeOut = interpolateClamped(
    frame,
    [totalFrames - fadeOutFrames, totalFrames - 1],
    [1, 0]
  );
  return fadeIn * fadeOut;
}

/** Linear interpolation with clamping. */
function interpolateClamped(
  value: number,
  inputRange: [number, number],
  outputRange: [number, number]
): number {
  const t =
    (value - inputRange[0]) / (inputRange[1] - inputRange[0]);
  const clamped = Math.max(0, Math.min(1, t));
  return outputRange[0] + clamped * (outputRange[1] - outputRange[0]);
}

/**
 * Build scene start frames with overlap crossfades.
 *
 * @param durations - Array of scene durations in frames.
 * @param overlapFrames - Crossfade overlap per transition.
 * @returns Array of start frames (same length as durations).
 */
export function buildSceneStarts(
  durations: number[],
  overlapFrames: number
): number[] {
  const starts: number[] = [];
  let current = 0;
  for (let i = 0; i < durations.length; i++) {
    starts.push(current);
    current += durations[i] - overlapFrames;
  }
  return starts;
}
