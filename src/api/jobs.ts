import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const JOBS_DIR = path.resolve(process.cwd(), "jobs");

export interface Job {
  jobId: string;
  status: "queued" | "running" | "done" | "error";
  /** Current pipeline phase (e.g. "planning", "tts", "footage", "rendering"). */
  phase?: string;
  createdAt: string;
  updatedAt: string;
  error?: string;
}

function jobDir(jobId: string): string {
  return path.join(JOBS_DIR, jobId);
}

function statusFile(jobId: string): string {
  return path.join(jobDir(jobId), "status.json");
}

export function outputFile(jobId: string): string {
  return path.join(jobDir(jobId), "output.mp4");
}

/** Returns the assets directory for a job (created on first use by the orchestrator). */
export function jobAssetsDir(jobId: string): string {
  return path.join(jobDir(jobId), "assets");
}

export function createJob(): Job {
  const jobId = uuidv4();
  const now = new Date().toISOString();
  const job: Job = { jobId, status: "queued", createdAt: now, updatedAt: now };
  fs.mkdirSync(jobDir(jobId), { recursive: true });
  fs.writeFileSync(statusFile(jobId), JSON.stringify(job, null, 2));
  return job;
}

export function getJob(jobId: string): Job | null {
  const file = statusFile(jobId);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8")) as Job;
}

export function updateJob(
  jobId: string,
  patch: Partial<Omit<Job, "jobId" | "createdAt">>,
): Job {
  const job = getJob(jobId);
  if (!job) throw new Error(`Job not found: ${jobId}`);
  const updated: Job = { ...job, ...patch, updatedAt: new Date().toISOString() };
  fs.writeFileSync(statusFile(jobId), JSON.stringify(updated, null, 2));
  return updated;
}
