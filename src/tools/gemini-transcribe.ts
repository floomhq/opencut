import { GoogleAIFileManager } from "@google/generative-ai/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
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

import { requireEnv } from "../env";

export async function transcribeVideo(videoPath: string): Promise<TranscriptResult> {
  const apiKey = requireEnv("GEMINI_API_KEY");

  const fileManager = new GoogleAIFileManager(apiKey);

  const mimeType = videoPath.endsWith(".mov") ? "video/quicktime" : "video/mp4";
  const uploadResult = await fileManager.uploadFile(videoPath, {
    mimeType,
    displayName: `opencut-${Date.now()}`,
  });

  // Wait for file to reach ACTIVE state before using it
  const fileName = uploadResult.file.name;
  let fileState = uploadResult.file.state;
  const pollDeadline = Date.now() + 120_000; // 2 min max
  while (fileState !== "ACTIVE") {
    if (fileState === "FAILED") {
      throw new Error(`Gemini file processing failed: ${fileName}`);
    }
    if (Date.now() > pollDeadline) {
      throw new Error(`Timed out waiting for Gemini file ${fileName} to become ACTIVE`);
    }
    await new Promise((r) => setTimeout(r, 3000));
    const fileInfo = await fileManager.getFile(fileName);
    fileState = fileInfo.state;
  }

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
