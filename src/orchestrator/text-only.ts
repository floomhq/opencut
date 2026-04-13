/**
 * Text-only pipeline: prompt → Gemini scene plan → ElevenLabs TTS →
 * Pexels stock footage → ffmpeg render → MP4
 *
 * No camera recording required. Fully AI-generated.
 */
import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { generateScenePlan } from "../ai/planner";
import { textToSpeech, type VoiceId } from "../tools/elevenlabs";
import { searchVideos, downloadVideo } from "../tools/pexels";
import { renderWithFfmpeg, type ClipSegment } from "../tools/ffmpeg";
import { jobAssetsDir, outputFile, updateJob } from "../api/jobs";

const execFileAsync = promisify(execFile);

/** Returns the actual duration in seconds of a video file using ffprobe. */
async function probeVideoDuration(filePath: string): Promise<number> {
  const { stdout } = await execFileAsync("ffprobe", [
    "-v", "quiet",
    "-print_format", "json",
    "-show_format",
    filePath,
  ]);
  const parsed = JSON.parse(stdout) as { format: { duration?: string } };
  return parseFloat(parsed.format.duration ?? "0");
}

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

  try {
    // ── Step 1: AI scene planning ────────────────────────────────────────────
    updateJob(jobId, { status: "running", phase: "planning" });
    const plan = await generateScenePlan({ prompt, targetDurationSec });

    // ── Step 2: ElevenLabs text-to-speech ───────────────────────────────────
    updateJob(jobId, { phase: "tts" });
    const voicePath = path.join(assetsDir, "voiceover.mp3");
    await textToSpeech({ text: plan.fullNarration, voice, outputPath: voicePath });

    // ── Step 3: Pexels stock footage download (parallel) ────────────────────
    updateJob(jobId, { phase: "footage" });
    const clips: ClipSegment[] = await Promise.all(
      plan.scenes.map(async (scene, i) => {
        const padded = String(i).padStart(2, "0");
        const clipPath = path.join(assetsDir, `scene-${padded}.mp4`);

        const videos = await searchVideos(scene.pexelsQuery, scene.durationSec);

        if (videos.length === 0) {
          // Fallback: generic query using first three words of narration
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

        // Use the actual downloaded clip duration (capped at planned duration)
        // to ensure A/V sync: ffmpeg -t will not exceed clip length
        const actualDuration = await probeVideoDuration(clipPath);
        const durationSec = Math.min(scene.durationSec, actualDuration > 0 ? actualDuration : scene.durationSec);

        return {
          videoPath: clipPath,
          durationSec,
          caption: scene.caption ?? undefined,
          narrationText: scene.narrationText,
        };
      }),
    );

    // ── Step 4: ffmpeg render ────────────────────────────────────────────────
    updateJob(jobId, { phase: "rendering" });

    // Probe actual voiceover duration and scale clip durations to match.
    // ElevenLabs TTS speaks at a rate that may differ from the planner's WPM
    // estimate, causing a silent tail if video > audio. We scale all clip
    // durations proportionally so total video time = actual audio time.
    const actualAudioSec = await probeVideoDuration(voicePath);
    const plannedTotalSec = clips.reduce((sum, c) => sum + c.durationSec, 0);
    if (actualAudioSec > 0 && Math.abs(actualAudioSec - plannedTotalSec) > 0.5) {
      const scale = actualAudioSec / plannedTotalSec;
      for (const clip of clips) {
        clip.durationSec = parseFloat((clip.durationSec * scale).toFixed(3));
      }
    }

    const out = outputFile(jobId);
    await renderWithFfmpeg({
      clips,
      audioPath: voicePath,
      outputPath: out,
    });

    updateJob(jobId, { status: "done", phase: "done" });
  } catch (err) {
    updateJob(jobId, {
      status: "error",
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}
