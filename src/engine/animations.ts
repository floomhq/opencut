/**
 * Animation utilities for the OpenCut engine.
 *
 * Pure helper functions for common motion patterns:
 * particles, wave motion, breathing effects, stagger, typewriter,
 * animated counters, easing, glitch offsets, color interpolation,
 * and audio-reactivity simulation.
 *
 * All functions are frame-based and deterministic.
 */

import { type SpringConfig } from "remotion";

// ---------------------------------------------------------------------------
// Particle system
// ---------------------------------------------------------------------------

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  delay: number;
}

/** Generate a seeded array of particles for reproducible motion. */
export function generateParticles(count: number, seed: number = 42): Particle[] {
  const particles: Particle[] = [];
  const random = (i: number) => {
    const x = Math.sin(seed + i * 9999) * 10000;
    return x - Math.floor(x);
  };

  for (let i = 0; i < count; i++) {
    particles.push({
      id: i,
      x: random(i * 1) * 100,
      y: random(i * 2) * 100,
      vx: (random(i * 3) - 0.5) * 0.015,
      vy: (random(i * 4) - 0.5) * 0.015,
      size: 0.3 + random(i * 5) * 1.2,
      opacity: 0.15 + random(i * 6) * 0.25,
      delay: random(i * 7) * 30,
    });
  }
  return particles;
}

/** Update a particle's position for a given frame. */
export function updateParticlePosition(
  particle: Particle,
  frame: number,
  bounds: { width: number; height: number } = { width: 100, height: 100 }
): { x: number; y: number } {
  const t = frame * 0.5;
  let x = particle.x + particle.vx * t;
  let y = particle.y + particle.vy * t;

  x = ((x % bounds.width) + bounds.width) % bounds.width;
  y = ((y % bounds.height) + bounds.height) % bounds.height;

  x += Math.sin(frame * 0.02 + particle.id) * 0.5;
  y += Math.cos(frame * 0.015 + particle.id * 0.7) * 0.3;

  return { x, y };
}

// ---------------------------------------------------------------------------
// Easing helpers
// ---------------------------------------------------------------------------

export const easing = {
  easeInOutCubic: (t: number) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,

  easeOutBack: (t: number) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },

  easeOutElastic: (t: number) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0
      ? 0
      : t === 1
        ? 1
        : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },

  easeOutExpo: (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
};

// ---------------------------------------------------------------------------
// Continuous motion
// ---------------------------------------------------------------------------

/** Sine-wave motion for "alive" floating elements. */
export function waveMotion(
  frame: number,
  frequency: number = 0.05,
  amplitude: number = 1,
  phase: number = 0
): number {
  return Math.sin(frame * frequency + phase) * amplitude;
}

/** Breathing / pulsing scale effect. */
export function breathe(
  frame: number,
  minScale: number = 0.98,
  maxScale: number = 1.02,
  speed: number = 0.03
): number {
  const t = (Math.sin(frame * speed) + 1) / 2;
  return minScale + t * (maxScale - minScale);
}

// ---------------------------------------------------------------------------
// Glitch effect
// ---------------------------------------------------------------------------

/** Random glitch offset for a given frame. */
export function glitchOffset(
  frame: number,
  intensity: number = 3
): { x: number; y: number } {
  const glitchChance = Math.sin(frame * 0.3) > 0.7;
  if (!glitchChance) return { x: 0, y: 0 };
  return {
    x: Math.sin(frame * 1.7) * intensity,
    y: Math.cos(frame * 2.3) * intensity * 0.5,
  };
}

// ---------------------------------------------------------------------------
// Color interpolation
// ---------------------------------------------------------------------------

/** Linearly interpolate between two hex colors. */
export function lerpColor(color1: string, color2: string, t: number): string {
  const parse = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 };
  };

  const c1 = parse(color1);
  const c2 = parse(color2);

  const r = Math.round(c1.r + (c2.r - c1.r) * t);
  const g = Math.round(c1.g + (c2.g - c1.g) * t);
  const b = Math.round(c1.b + (c2.b - c1.b) * t);

  return `rgb(${r}, ${g}, ${b})`;
}

// ---------------------------------------------------------------------------
// Stagger animation
// ---------------------------------------------------------------------------

/** Compute a 0-1 progress value for an item in a staggered reveal. */
export function stagger(
  index: number,
  totalItems: number,
  totalDurationSeconds: number,
  frame: number,
  fps: number
): number {
  const staggerDelay = (totalDurationSeconds / totalItems) * index;
  const itemFrame = Math.max(0, frame - staggerDelay * fps);
  return Math.min(1, itemFrame / (fps * 0.5));
}

// ---------------------------------------------------------------------------
// Typewriter effect
// ---------------------------------------------------------------------------

/** Return the substring that should be visible for a typewriter effect. */
export function typewriter(
  text: string,
  frame: number,
  fps: number,
  charsPerSecond: number = 20
): string {
  const charsToShow = Math.floor((frame / fps) * charsPerSecond);
  return text.slice(0, charsToShow);
}

// ---------------------------------------------------------------------------
// Animated counter
// ---------------------------------------------------------------------------

/** Interpolate a number with ease-out-expo easing. */
export function animatedCounter(
  from: number,
  to: number,
  progress: number,
  decimals: number = 0
): string {
  const value = from + (to - from) * easing.easeOutExpo(progress);
  return value.toFixed(decimals);
}

// ---------------------------------------------------------------------------
// Connection line drawing
// ---------------------------------------------------------------------------

/** 0-1 progress for a line-drawing animation. */
export function drawConnectionProgress(
  frame: number,
  startDelay: number,
  duration: number
): number {
  const progress = (frame - startDelay) / duration;
  return Math.max(0, Math.min(1, progress));
}

// ---------------------------------------------------------------------------
// Audio-reactivity simulation
// ---------------------------------------------------------------------------

/**
 * Simulate audio reactivity without actual audio analysis.
 * Returns a 0-1 value that pulses like bass hits.
 */
export function simulateAudioReactivity(
  frame: number,
  intensity: number = 1
): number {
  const bassCycle = frame % 30;
  const bassHit = bassCycle < 5 ? (5 - bassCycle) / 5 : 0;
  const midFreq = Math.sin(frame * 0.15) * 0.3 + 0.3;
  return (bassHit * 0.6 + midFreq * 0.4) * intensity;
}

// ---------------------------------------------------------------------------
// Spring helpers
// ---------------------------------------------------------------------------

/** Preset spring configs for common motion styles. */
export const springPresets = {
  gentle: { damping: 20, stiffness: 100, mass: 1, overshootClamping: false } satisfies SpringConfig,
  snappy: { damping: 12, stiffness: 200, mass: 0.5, overshootClamping: false } satisfies SpringConfig,
  bouncy: { damping: 8, stiffness: 150, mass: 0.8, overshootClamping: false } satisfies SpringConfig,
  slam: { damping: 8, stiffness: 200, mass: 1.2, overshootClamping: false } satisfies SpringConfig,
  overshoot: { damping: 10, stiffness: 150, mass: 0.8, overshootClamping: false } satisfies SpringConfig,
};

// ---------------------------------------------------------------------------
// Ken Burns presets
// ---------------------------------------------------------------------------

export interface KenBurnsPreset {
  scaleFrom: number;
  scaleTo: number;
  txFrom: number;
  txTo: number;
  tyFrom: number;
  tyTo: number;
}

/** Predefined cinematic camera-motion presets for background footage. */
export const KEN_BURNS_PRESETS: KenBurnsPreset[] = [
  { scaleFrom: 1.0, scaleTo: 1.15, txFrom: 0, txTo: -3, tyFrom: 0, tyTo: -1 },
  { scaleFrom: 1.15, scaleTo: 1.0, txFrom: 3, txTo: 0, tyFrom: 0, tyTo: 1 },
  { scaleFrom: 1.0, scaleTo: 1.12, txFrom: 2, txTo: -2, tyFrom: 0, tyTo: 0 },
  { scaleFrom: 1.05, scaleTo: 1.15, txFrom: 0, txTo: 0, tyFrom: 1, tyTo: -2 },
  { scaleFrom: 1.0, scaleTo: 1.1, txFrom: -2, txTo: 2, tyFrom: 0, tyTo: 0 },
  { scaleFrom: 1.12, scaleTo: 1.02, txFrom: 0, txTo: 0, tyFrom: -1, tyTo: 1 },
  { scaleFrom: 1.0, scaleTo: 1.15, txFrom: 2, txTo: -1, tyFrom: -1, tyTo: 1 },
  { scaleFrom: 1.1, scaleTo: 1.0, txFrom: -2, txTo: 1, tyFrom: 1, tyTo: -1 },
];

/** Interpolate a Ken Burns transform for a given progress (0-1). */
export function getKenBurnsTransform(
  preset: KenBurnsPreset,
  progress: number
): { scale: number; translateX: number; translateY: number } {
  const eased = 0.5 - 0.5 * Math.cos(Math.PI * progress); // ease-in-out
  const scale = preset.scaleFrom + (preset.scaleTo - preset.scaleFrom) * eased;
  const translateX = preset.txFrom + (preset.txTo - preset.txFrom) * eased;
  const translateY = preset.tyFrom + (preset.tyTo - preset.tyFrom) * eased;
  return { scale, translateX, translateY };
}


