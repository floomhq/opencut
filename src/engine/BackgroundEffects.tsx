/**
 * Background visual effects for OpenCut segments.
 *
 * Provides generative SVG backgrounds and animated orbs that can be
 * layered behind any segment type for visual richness.
 *
 * Usage in a segment:
 *   backgroundEffect: {
 *     type: "orbs",
 *     accentColor: "#3b82f6",
 *     intensity: 0.6,
 *   }
 */

import React from "react";
import { useCurrentFrame } from "remotion";
import {
  generateParticles,
  updateParticlePosition,
  breathe,
} from "./animations";

import { type BackgroundEffectConfig } from "./types";

// ---------------------------------------------------------------------------
// Orb background (from hyperniche launch video)
// ---------------------------------------------------------------------------

const OrbBackground: React.FC<{
  accentColor: string;
  intensity: number;
  orbCount: number;
}> = ({ accentColor, intensity, orbCount }) => {
  const frame = useCurrentFrame();

  const orbs = [
    {
      size: 900,
      color: `${accentColor}30`,
      midColor: `${accentColor}10`,
      xFn: (f: number) => Math.sin(f * 0.015) * 100 - 300,
      yFn: (f: number) => Math.cos(f * 0.012) * 80,
      blur: 100,
    },
    {
      size: 600,
      color: `${accentColor}20`,
      midColor: `${accentColor}08`,
      xFn: (f: number) => Math.cos(f * 0.018) * 120 + 350,
      yFn: (f: number) => Math.sin(f * 0.014) * 100 - 150,
      blur: 100,
    },
    {
      size: 700,
      color: `${accentColor}18`,
      midColor: `${accentColor}05`,
      xFn: (f: number) => Math.sin(f * 0.01) * -200,
      yFn: (f: number) => Math.cos(f * 0.008) * 150,
      blur: 120,
    },
  ];

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      {orbs.slice(0, orbCount).map((orb, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: orb.size,
            height: orb.size,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${orb.color} 0%, ${orb.midColor} 42%, transparent 72%)`,
            opacity: intensity * (i === 0 ? 1 : 0.7),
            transform: `translate(${orb.xFn(frame)}px, ${orb.yFn(frame)}px)`,
            filter: `blur(${orb.blur}px)`,
            left: "50%",
            top: "50%",
            marginLeft: -orb.size / 2,
            marginTop: -orb.size / 2,
          }}
        />
      ))}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Particle background
// ---------------------------------------------------------------------------

const ParticleBackground: React.FC<{
  accentColor: string;
  intensity: number;
  particleCount: number;
}> = ({ accentColor, intensity, particleCount }) => {
  const frame = useCurrentFrame();
  const particles = React.useMemo(
    () => generateParticles(particleCount, 789),
    [particleCount]
  );

  return (
    <svg
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      {particles.map((p) => {
        const pos = updateParticlePosition(p, frame * 1.5);
        const scale = breathe(frame + p.delay, 0.5, 1.5, 0.02);
        return (
          <circle
            key={p.id}
            cx={pos.x}
            cy={pos.y}
            r={p.size * scale * 1.4}
            fill={accentColor}
            opacity={p.opacity * intensity * 0.7}
          />
        );
      })}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Grid background
// ---------------------------------------------------------------------------

const GridBackground: React.FC<{
  accentColor: string;
  intensity: number;
}> = ({ accentColor, intensity }) => {
  const frame = useCurrentFrame();
  const gridSize = 10;

  return (
    <svg
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      {Array.from({ length: gridSize + 1 }, (_, i) => {
        const offset = Math.sin(frame * 0.02 + i * 0.5) * 0.5;
        const pos = (i / gridSize) * 100;
        const pulse = 0.8 + Math.sin(frame * 0.04 + i * 0.7) * 0.2;
        return (
          <React.Fragment key={i}>
            <line
              x1={pos + offset}
              y1="0"
              x2={pos + offset}
              y2="100"
              stroke={accentColor}
              strokeWidth="0.15"
              opacity={intensity * 0.4 * pulse}
            />
            <line
              x1="0"
              y1={pos + offset}
              x2="100"
              y2={pos + offset}
              stroke={accentColor}
              strokeWidth="0.15"
              opacity={intensity * 0.4 * pulse}
            />
          </React.Fragment>
        );
      })}
      <circle cx="0" cy="0" r="25" fill={accentColor} opacity={intensity * 0.06} />
      <circle cx="100" cy="100" r="25" fill={accentColor} opacity={intensity * 0.04} />
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Waves background
// ---------------------------------------------------------------------------

const WavesBackground: React.FC<{
  accentColor: string;
  intensity: number;
}> = ({ accentColor, intensity }) => {
  const frame = useCurrentFrame();

  return (
    <svg
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      {Array.from({ length: 10 }, (_, i) => {
        const baseY = 10 + i * 8;
        const path = `M0,${baseY} ${Array.from({ length: 50 }, (_, j) => {
          const x = (j / 49) * 100;
          const y =
            baseY + Math.sin(frame * 0.03 + j * 0.15 + i * 0.8) * 5;
          return `L${x},${y}`;
        }).join(" ")}`;
        return (
          <path
            key={i}
            d={path}
            fill="none"
            stroke={accentColor}
            strokeWidth="0.4"
            opacity={intensity * 0.45 * (1 - i * 0.06)}
          />
        );
      })}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Dots background
// ---------------------------------------------------------------------------

const DotsBackground: React.FC<{
  accentColor: string;
  intensity: number;
}> = ({ accentColor, intensity }) => {
  const frame = useCurrentFrame();

  return (
    <svg
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      {Array.from({ length: 100 }, (_, i) => {
        const baseX = 5 + (i % 10) * 10;
        const baseY = 5 + Math.floor(i / 10) * 10;
        const pulse = Math.sin(frame * 0.05 + i * 0.3) * 0.4 + 0.6;
        const driftX = Math.sin(frame * 0.008 + i * 0.7) * 1.5;
        const driftY = Math.cos(frame * 0.006 + i * 0.5) * 1.2;
        return (
          <circle
            key={i}
            cx={baseX + driftX}
            cy={baseY + driftY}
            r={0.5 * pulse}
            fill={accentColor}
            opacity={intensity * 0.55 * pulse}
          />
        );
      })}
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Vignette overlay
// ---------------------------------------------------------------------------

const VignetteOverlay: React.FC<{
  intensity: number;
}> = ({ intensity }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background:
        "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.16) 100%)",
      pointerEvents: "none",
      opacity: intensity,
    }}
  />
);

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export const BackgroundEffects: React.FC<{
  config: BackgroundEffectConfig;
}> = ({ config }) => {
  const {
    type,
    accentColor = "#4ade80",
    intensity = 0.5,
    orbCount = 1,
    particleCount = 40,
  } = config;

  switch (type) {
    case "orbs":
      return (
        <OrbBackground
          accentColor={accentColor}
          intensity={intensity}
          orbCount={orbCount}
        />
      );
    case "particles":
      return (
        <ParticleBackground
          accentColor={accentColor}
          intensity={intensity}
          particleCount={particleCount}
        />
      );
    case "grid":
      return <GridBackground accentColor={accentColor} intensity={intensity} />;
    case "waves":
      return <WavesBackground accentColor={accentColor} intensity={intensity} />;
    case "dots":
      return <DotsBackground accentColor={accentColor} intensity={intensity} />;
    case "vignette":
      return <VignetteOverlay intensity={intensity} />;
    default:
      return null;
  }
};
