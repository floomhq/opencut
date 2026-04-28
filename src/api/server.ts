import express, { Request, Response } from "express";
import fs from "fs";
import path from "path";
import multer from "multer";
import { createJob, getJob, outputFile, jobAssetsDir, updateJob } from "./jobs";
import { renderJob } from "./renderer";
import { runTextOnlyPipeline } from "../orchestrator/text-only";
import { runFacecamPipeline } from "../orchestrator/facecam";
import type { VoiceId } from "../tools/elevenlabs";

const app = express();
app.use(express.json());

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      const tmpDir = path.resolve(process.cwd(), "jobs", "_uploads");
      fs.mkdirSync(tmpDir, { recursive: true });
      cb(null, tmpDir);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || ".mp4";
      cb(null, `${Date.now()}${ext}`);
    },
  }),
});

// POST /render — submit a render job
// Body: { compositionId, entryPoint, inputProps? }
// Returns: { jobId }
app.post("/render", (req: Request, res: Response) => {
  const { compositionId, entryPoint, inputProps } = req.body as {
    compositionId?: string;
    entryPoint?: string;
    inputProps?: Record<string, unknown>;
  };

  if (!compositionId || !entryPoint) {
    res.status(400).json({ error: "compositionId and entryPoint are required" });
    return;
  }

  const job = createJob();

  // Fire-and-forget — rendering is async, client polls GET /jobs/:id
  renderJob({ jobId: job.jobId, compositionId, entryPoint, inputProps }).catch(
    (err: unknown) => {
      console.error(`[renderer] job ${job.jobId} failed:`, err);
      updateJob(job.jobId, { status: "error", error: String(err) });
    },
  );

  res.status(202).json({ jobId: job.jobId });
});

// GET /jobs/:id — poll job status
app.get("/jobs/:id", (req: Request, res: Response) => {
  const id = String(req.params.id);
  const job = getJob(id);
  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }
  res.json(job);
});

// GET /jobs/:id/download — stream the output MP4 (only when done)
app.get("/jobs/:id/download", (req: Request, res: Response) => {
  const id = String(req.params.id);
  const job = getJob(id);
  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }
  if (job.status !== "done") {
    res.status(409).json({ error: `Job is ${job.status}` });
    return;
  }
  const out = outputFile(id);
  if (!fs.existsSync(out)) {
    res.status(404).json({ error: "Output file not found" });
    return;
  }
  res.download(out, "output.mp4");
});

// POST /generate — AI text-only video generation
// Body: { prompt, targetDurationSec?, voice? }
// Returns: { jobId } — poll GET /jobs/:id for status + phase
app.post("/generate", (req: Request, res: Response) => {
  const { prompt, targetDurationSec, voice } = req.body as {
    prompt?: string;
    targetDurationSec?: number;
    voice?: VoiceId;
  };

  if (!prompt) {
    res.status(400).json({ error: "prompt is required" });
    return;
  }

  const job = createJob();

  runTextOnlyPipeline({
    jobId: job.jobId,
    prompt,
    targetDurationSec,
    voice,
  }).catch((err: unknown) => {
    console.error(`[orchestrator] job ${job.jobId} failed:`, err);
    updateJob(job.jobId, { status: "error", error: String(err) });
  });

  res.status(202).json({ jobId: job.jobId });
});

// POST /facecam — upload a recording → transcribe → Remotion render → MP4
// Form fields: video (file), playbackRate? (number)
// Returns: { jobId } — poll GET /jobs/:id for status + phase
app.post("/facecam", upload.single("video"), (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: "video file is required (field: video)" });
    return;
  }

  const playbackRate = req.body.playbackRate
    ? parseFloat(String(req.body.playbackRate))
    : 1.0;

  const job = createJob();

  // Move uploaded file into job assets dir
  const assetsDir = jobAssetsDir(job.jobId);
  fs.mkdirSync(assetsDir, { recursive: true });
  const ext = path.extname(req.file.originalname) || ".mp4";
  const videoPath = path.join(assetsDir, `input${ext}`);
  fs.renameSync(req.file.path, videoPath);

  runFacecamPipeline({
    jobId: job.jobId,
    videoPath,
    playbackRate,
  }).catch((err: unknown) => {
    console.error(`[facecam] job ${job.jobId} failed:`, err);
    updateJob(job.jobId, { status: "error", error: String(err) });
  });

  res.status(202).json({ jobId: job.jobId });
});

import { env } from "../env";

const PORT = env.PORT;
app.listen(PORT, () => {
  console.log(`OpenCut API listening on :${PORT}`);
});
