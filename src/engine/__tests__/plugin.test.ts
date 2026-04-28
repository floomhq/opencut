import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import React from "react";
import {
  registerPlugin,
  unregisterPlugin,
  clearPlugins,
  getPlugins,
  getSegmentRenderer,
  getBackgroundEffectRenderer,
  applyTimelineTransforms,
} from "../plugin";
import type { OpenCutPlugin } from "../plugin";
import type { TimelineSegment } from "../types";

const DummySegmentRenderer: React.FC = () => React.createElement("div", null, "custom");
const DummyBgEffect: React.FC = () => React.createElement("div", null, "effect");

describe("plugin registry", () => {
  beforeEach(() => {
    clearPlugins();
  });

  it("starts empty", () => {
    assert.strictEqual(getPlugins().length, 0);
  });

  it("registers a plugin", () => {
    const plugin: OpenCutPlugin = { name: "test" };
    registerPlugin(plugin);
    assert.strictEqual(getPlugins().length, 1);
    assert.strictEqual(getPlugins()[0].name, "test");
  });

  it("throws when registering duplicate name", () => {
    registerPlugin({ name: "dup" });
    assert.throws(() => registerPlugin({ name: "dup" }), /already registered/);
  });

  it("unregisters a plugin by name", () => {
    registerPlugin({ name: "a" });
    registerPlugin({ name: "b" });
    unregisterPlugin("a");
    assert.strictEqual(getPlugins().length, 1);
    assert.strictEqual(getPlugins()[0].name, "b");
  });

  it("clears all plugins", () => {
    registerPlugin({ name: "a" });
    registerPlugin({ name: "b" });
    clearPlugins();
    assert.strictEqual(getPlugins().length, 0);
  });
});

describe("plugin segment renderers", () => {
  beforeEach(() => {
    clearPlugins();
  });

  it("returns undefined when no renderer is registered", () => {
    assert.strictEqual(getSegmentRenderer("custom"), undefined);
  });

  it("finds a registered segment renderer", () => {
    registerPlugin({
      name: "custom-scene",
      segmentRenderers: {
        "my-scene": DummySegmentRenderer as React.FC<any>,
      },
    });
    assert.strictEqual(getSegmentRenderer("my-scene"), DummySegmentRenderer);
  });

  it("returns the first matching renderer", () => {
    const SecondRenderer: React.FC = () => React.createElement("div", null, "second");
    registerPlugin({
      name: "first",
      segmentRenderers: {
        scene: DummySegmentRenderer as React.FC<any>,
      },
    });
    registerPlugin({
      name: "second",
      segmentRenderers: {
        scene: SecondRenderer as React.FC<any>,
      },
    });
    assert.strictEqual(getSegmentRenderer("scene"), DummySegmentRenderer);
  });
});

describe("plugin background effect renderers", () => {
  beforeEach(() => {
    clearPlugins();
  });

  it("returns undefined when no effect renderer is registered", () => {
    assert.strictEqual(getBackgroundEffectRenderer("custom"), undefined);
  });

  it("finds a registered background effect renderer", () => {
    registerPlugin({
      name: "custom-effect",
      backgroundEffectRenderers: {
        stars: DummyBgEffect as React.FC<any>,
      },
    });
    assert.strictEqual(getBackgroundEffectRenderer("stars"), DummyBgEffect);
  });
});

describe("plugin timeline transforms", () => {
  beforeEach(() => {
    clearPlugins();
  });

  it("returns original timeline when no transforms are registered", () => {
    const timeline: TimelineSegment[] = [
      { id: "s1", type: "facecam-full", facecamStartSec: 0, durationSec: 5, faceBubble: "hidden", showSubtitles: false },
    ];
    const result = applyTimelineTransforms(timeline);
    assert.deepStrictEqual(result, timeline);
  });

  it("applies a single transform", () => {
    const timeline: TimelineSegment[] = [
      { id: "s1", type: "facecam-full", facecamStartSec: 0, durationSec: 5, faceBubble: "hidden", showSubtitles: false },
    ];
    registerPlugin({
      name: "double-duration",
      transformTimeline: (tl) =>
        tl.map((seg) => ({ ...seg, durationSec: seg.durationSec * 2 })),
    });
    const result = applyTimelineTransforms(timeline);
    assert.strictEqual(result[0].durationSec, 10);
  });

  it("applies transforms in registration order", () => {
    const timeline: TimelineSegment[] = [
      { id: "s1", type: "facecam-full", facecamStartSec: 0, durationSec: 5, faceBubble: "hidden", showSubtitles: false },
    ];
    registerPlugin({
      name: "add-one",
      transformTimeline: (tl) =>
        tl.map((seg) => ({ ...seg, durationSec: seg.durationSec + 1 })),
    });
    registerPlugin({
      name: "double",
      transformTimeline: (tl) =>
        tl.map((seg) => ({ ...seg, durationSec: seg.durationSec * 2 })),
    });
    const result = applyTimelineTransforms(timeline);
    // (5 + 1) * 2 = 12
    assert.strictEqual(result[0].durationSec, 12);
  });
});
