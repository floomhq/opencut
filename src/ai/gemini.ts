import { GoogleGenerativeAI } from "@google/generative-ai";

export const GEMINI_FLASH = "gemini-3-flash-preview";
export const GEMINI_PRO = "gemini-3.1-pro-preview";

import { requireEnv } from "../env";

export function getGeminiModel(modelId: string = GEMINI_FLASH) {
  const apiKey = requireEnv("GEMINI_API_KEY");
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: modelId });
}
