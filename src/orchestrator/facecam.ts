import fs from "fs";
import path from "path";
import { transcribeVideo } from "../tools/gemini-transcribe";
import { renderJob } from "../api/renderer";
import { jobAssetsDir, updateJob } from "../api/jobs";
import type { SubtitleSegment, TimelineSegment } from "../engine";

export interface FacecamRequest {
  jobId: string;
  videoPath: string;
  compositionId?: string;
  playbackRate?: number;
}

function buildSegmentsFromTranscript(
  segments: Array<{ startSec: number; endSec: number; text: string }>,
): { subtitleSegments: SubtitleSegment[]; timelineSegments: TimelineSegment[] } {
  const subtitleSegments: SubtitleSegment[] = segments.map((seg) => ({
    start: seg.startSec,
    end: seg.endSec,
    text: seg.text,
    words: seg.text
      .split(/\s+/)
      .filter(Boolean)
      .map((word, i, arr) => {
        const wordDuration = (seg.endSec - seg.startSec) / arr.length;
        return {
          word,
          start: seg.startSec + i * wordDuration,
          end: seg.startSec + (i + 1) * wordDuration,
        };
      }),
  }));

  const lastSegment = segments[segments.length - 1];
  const totalDurationSec = lastSegment ? lastSegment.endSec : 0;

  const timelineSegments: TimelineSegment[] = [
    {
      id: "facecam-main",
      type: "facecam-full",
      facecamStartSec: 0,
      durationSec: totalDurationSec,
      faceBubble: "hidden",
      showSubtitles: true,
    },
  ];

  return { subtitleSegments, timelineSegments };
}

export async function runFacecamPipeline(req: FacecamRequest): Promise<void> {
  const {
    jobId,
    videoPath,
    compositionId = "FacecamVideo",
    playbackRate = 1.0,
  } = req;

  const assetsDir = jobAssetsDir(jobId);
  fs.mkdirSync(assetsDir, { recursive: true });

  try {
    // ── Step 1: Transcribe video ─────────────────────────────────────────────
    updateJob(jobId, { status: "running", phase: "transcribing" });
    const transcript = await transcribeVideo(videoPath);

    // ── Step 2: Build subtitle + timeline segments ───────────────────────────
    updateJob(jobId, { phase: "building-timeline" });
    const { subtitleSegments, timelineSegments } = buildSegmentsFromTranscript(
      transcript.segments,
    );

    // ── Step 3: Copy video into public/ so Remotion staticFile can serve it ──
    updateJob(jobId, { phase: "preparing-assets" });
    const publicJobDir = path.resolve(process.cwd(), "public", "jobs", jobId);
    fs.mkdirSync(publicJobDir, { recursive: true });
    const ext = path.extname(videoPath) || ".mp4";
    const publicVideoFilename = `input${ext}`;
    const publicVideoPath = path.join(publicJobDir, publicVideoFilename);
    fs.copyFileSync(videoPath, publicVideoPath);
    const videoSrc = `jobs/${jobId}/${publicVideoFilename}`;

    // ── Step 4: Render via Remotion ──────────────────────────────────────────
    updateJob(jobId, { phase: "rendering" });
    await renderJob({
      jobId,
      compositionId,
      entryPoint: "src/compositions/index.tsx",
      inputProps: {
        subtitleSegments,
        timelineSegments,
        videoSrc,
        playbackRate,
        fps: 30,
        width: 1920,
        height: 1080,
      },
    });
  } catch (err) {
    updateJob(jobId, {
      status: "error",
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}
