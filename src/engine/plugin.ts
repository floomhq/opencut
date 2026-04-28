/**
 * Plugin system for OpenCut.
 *
 * Plugins can register custom segment renderers, background effects,
 * and transform timelines before rendering.
 *
 * Usage:
 *   import { registerPlugin } from "./plugin";
 *
 *   registerPlugin({
 *     name: "my-plugin",
 *     segmentRenderers: {
 *       "custom-scene": MyCustomScene,
 *     },
 *     transformTimeline: (timeline) => timeline,
 *   });
 */

import React from "react";
import type { TimelineSegment, BackgroundEffectConfig } from "./types";

export interface SegmentRendererProps {
  segment: TimelineSegment;
  frame: number;
  fps: number;
  width: number;
  height: number;
  playbackRate: number;
}

export interface BackgroundEffectProps {
  config: BackgroundEffectConfig;
  frame: number;
  width: number;
  height: number;
}

export interface OpenCutPlugin {
  /** Unique plugin name. */
  name: string;
  /** Custom segment renderers keyed by segment type string. */
  segmentRenderers?: Record<string, React.FC<SegmentRendererProps>>;
  /** Custom background effect renderers keyed by effect type string. */
  backgroundEffectRenderers?: Record<string, React.FC<BackgroundEffectProps>>;
  /** Transform timeline before rendering. Return a new array. */
  transformTimeline?: (timeline: TimelineSegment[]) => TimelineSegment[];
}

const registry: OpenCutPlugin[] = [];

/** Register a plugin globally. */
export function registerPlugin(plugin: OpenCutPlugin): void {
  if (registry.some((p) => p.name === plugin.name)) {
    throw new Error(`Plugin "${plugin.name}" is already registered.`);
  }
  registry.push(plugin);
}

/** Unregister a plugin by name. */
export function unregisterPlugin(name: string): void {
  const idx = registry.findIndex((p) => p.name === name);
  if (idx >= 0) {
    registry.splice(idx, 1);
  }
}

/** Clear all registered plugins. */
export function clearPlugins(): void {
  registry.length = 0;
}

/** Get all registered plugins. */
export function getPlugins(): ReadonlyArray<OpenCutPlugin> {
  return registry;
}

/** Find a custom segment renderer for the given type, if any. */
export function getSegmentRenderer(
  type: string
): React.FC<SegmentRendererProps> | undefined {
  for (const plugin of registry) {
    if (plugin.segmentRenderers?.[type]) {
      return plugin.segmentRenderers[type];
    }
  }
  return undefined;
}

/** Find a custom background effect renderer for the given type, if any. */
export function getBackgroundEffectRenderer(
  type: string
): React.FC<BackgroundEffectProps> | undefined {
  for (const plugin of registry) {
    if (plugin.backgroundEffectRenderers?.[type]) {
      return plugin.backgroundEffectRenderers[type];
    }
  }
  return undefined;
}

/** Apply all plugin timeline transforms in registration order. */
export function applyTimelineTransforms(timeline: TimelineSegment[]): TimelineSegment[] {
  let result = timeline;
  for (const plugin of registry) {
    if (plugin.transformTimeline) {
      result = plugin.transformTimeline(result);
    }
  }
  return result;
}
