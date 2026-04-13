/**
 * Text-only pipeline: prompt → Gemini scene plan → ElevenLabs TTS →
 * Pexels stock footage → ffmpeg render → MP4
 *
 * No camera recording required. Fully AI-generated.
 */
import fs from "fs";
import path from "path";
import { generateScenePlan } from "../ai/planner";
import { textToSpeech, type VoiceId } from "../tools/elevenlabs";
import { searchVideos, downloadVideo } from "../tools/pexels";
import { renderWithFfmpeg, type ClipSegment } from "../tools/ffmpeg";
import { jobAssetsDir, outputFile, updateJob } from "../api/jobs";

export interface TextOnlyRequest {
  jobId: string;
  prompt: string;
  targetDurationSec?: number; // default 60
  voice?: VoiceId;            // default "rachel"
}

export async function runTextOnlyPipeline(req: TextOnlyRequest): Promise<void> {
  const {
    jobId,
    prompt,
    targetDurationSec = 60,
    voice = "rachel",
  } = req;

  const assetsDir = jobAssetsDir(jobId);
  fs.mkdirSync(assetsDir, { recursive: true });

  // ── Step 1: AI scene planning ──────────────────────────────────────────────
  updateJob(jobId, { status: "running", phase: "planning" });
  const plan = await generateScenePlan({ prompt, targetDurationSec });

  // ── Step 2: ElevenLabs text-to-speech ─────────────────────────────────────
  updateJob(jobId, { phase: "tts" });
  const voicePath = path.join(assetsDir, "voiceover.mp3");
  await textToSpeech({ text: plan.fullNarration, voice, outputPath: voicePath });

  // ── Step 3: Pexels stock footage download (parallel) ──────────────────────
  updateJob(jobId, { phase: "footage" });
  const clips: ClipSegment[] = await Promise.all(
    plan.scenes.map(async (scene, i) => {
      const padded = String(i).padStart(2, "0");
      const clipPath = path.join(assetsDir, `scene-${padded}.mp4`);

      const videos = await searchVideos(scene.pexelsQuery, scene.durationSec);

      if (videos.length === 0) {
        // Fallback: generic query using first two words of narration
        const fallbackQuery = scene.narrationText.split(" ").slice(0, 3).join(" ");
        const fallback = await searchVideos(fallbackQuery, scene.durationSec);
        if (fallback.length === 0) {
          throw new Error(
            `No Pexels footage found for scene ${scene.id} (query: "${scene.pexelsQuery}", fallback: "${fallbackQuery}")`,
          );
        }
        await downloadVideo(fallback[0]!, clipPath);
      } else {
        await downloadVideo(videos[0]!, clipPath);
      }

      return {
        videoPath: clipPath,
        durationSec: scene.durationSec,
        caption: scene.caption ?? undefined,
      };
    }),
  );

  // ── Step 4: ffmpeg render ──────────────────────────────────────────────────
  updateJob(jobId, { phase: "rendering" });
  const out = outputFile(jobId);
  await renderWithFfmpeg({
    clips,
    audioPath: voicePath,
    outputPath: out,
  });

  updateJob(jobId, { status: "done", phase: "done" });
}
