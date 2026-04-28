import { describe, it } from "node:test";
import assert from "node:assert";
import fs from "fs";
import path from "path";
import os from "os";
import { execSync } from "child_process";
import { bundle } from "@remotion/bundler";
import { renderStill, getCompositions } from "@remotion/renderer";
import { computeTotalFrames } from "../index";
import { QUICKSTART_CONFIG } from "../../examples/quickstart/config";
import { TIMELINE as QUICKSTART_TIMELINE } from "../../examples/quickstart/timeline";

function findChrome(): string | null {
  const candidates = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/opt/google/chrome/chrome",
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  try {
    return execSync("which google-chrome || which chromium || which chromium-browser", {
      encoding: "utf-8",
    }).trim();
  } catch {
    return null;
  }
}

function hasFfmpeg(): boolean {
  try {
    execSync("ffmpeg -version", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

const isCI = process.env.CI === "true";
const chromePath = findChrome();
const canRender = !isCI && chromePath !== null && hasFfmpeg();

describe("integration: computeTotalFrames", () => {
  it("computes correct total frames for quickstart", () => {
    const frames = computeTotalFrames(QUICKSTART_TIMELINE, QUICKSTART_CONFIG);
    // 8s + 4s = 12s at 30fps = 360 frames
    assert.strictEqual(frames, 360);
  });
});

describe("integration: renderStill", () => {
  it("renders frame 0 of QuickstartPreview as PNG", async () => {
    if (!canRender) {
      console.log(
        `Skipping renderStill test: CI=${isCI}, chrome=${chromePath ?? "not found"}, ffmpeg=${hasFfmpeg()}`
      );
      return;
    }

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "opencut-integration-"));
    const outputPath = path.join(tmpDir, "frame-0.png");
    const publicDir = path.resolve(__dirname, "../../../public");
    const dummyVideo = path.join(publicDir, "facecam.mp4");
    let createdDummy = false;

    try {
      // Create a dummy facecam video if it doesn't exist
      if (!fs.existsSync(dummyVideo)) {
        execSync(
          `ffmpeg -f lavfi -i color=c=black:s=320x240:d=2 -r 30 -pix_fmt yuv420p "${dummyVideo}" -y`,
          { stdio: "ignore" }
        );
        createdDummy = true;
      }

      const entryPoint = path.resolve(__dirname, "../../examples/quickstart/index.ts");

      // Bundle the project
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const serveUrl = await (bundle as any)({
        entryPoint,
        webpackOverride: (config: unknown) => config,
      });

      // Get actual composition from bundle
      const compositions = await getCompositions(serveUrl, {
        browserExecutable: chromePath!,
        logLevel: "error",
      });

      const composition = compositions.find((c: { id: string }) => c.id === "QuickstartPreview");
      assert.ok(composition, "QuickstartPreview composition should exist in bundle");

      // Render frame 0
      await renderStill({
        serveUrl,
        composition,
        frame: 0,
        output: outputPath,
        imageFormat: "png",
        browserExecutable: chromePath!,
        logLevel: "error",
      });

      assert.ok(fs.existsSync(outputPath), "Output PNG should exist");
      const stats = fs.statSync(outputPath);
      assert.ok(stats.size > 1000, `PNG should be >1KB, got ${stats.size} bytes`);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
      if (createdDummy) {
        fs.unlinkSync(dummyVideo);
      }
    }
  });
});
