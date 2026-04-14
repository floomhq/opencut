import { GoogleAIFileManager } from "@google/generative-ai/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import { GEMINI_FLASH } from "../ai/gemini";

export interface TranscriptSegment {
  startSec: number;
  endSec: number;
  text: string;
}

export interface TranscriptResult {
  fullText: string;
  segments: TranscriptSegment[];
}

export async function transcribeVideo(videoPath: string): Promise<TranscriptResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  const fileManager = new GoogleAIFileManager(apiKey);

  const mimeType = videoPath.endsWith(".mov") ? "video/quicktime" : "video/mp4";
  const uploadResult = await fileManager.uploadFile(videoPath, {
    mimeType,
    displayName: `opencut-${Date.now()}`,
  });

  const fileUri = uploadResult.file.uri;

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: GEMINI_FLASH });

  const prompt = `Transcribe this video with precise timestamps. Return ONLY a JSON array, no markdown fences, no explanation. Format:
[{"startSec": 0.0, "endSec": 2.5, "text": "sentence one"}, ...]
Include every sentence spoken. Use decimal seconds for timestamps.`;

  const result = await model.generateContent([
    { fileData: { mimeType, fileUri } },
    { text: prompt },
  ]);

  const raw = result.response.text().trim();
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();

  const segments: TranscriptSegment[] = JSON.parse(cleaned) as TranscriptSegment[];

  const fullText = segments.map((s) => s.text).join(" ");

  // Clean up the uploaded file
  try {
    await fileManager.deleteFile(uploadResult.file.name);
  } catch {
    // Non-fatal: file will expire automatically
  }

  return { fullText, segments };
}
