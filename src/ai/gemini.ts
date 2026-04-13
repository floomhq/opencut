import { GoogleGenerativeAI } from "@google/generative-ai";

export const GEMINI_FLASH = "gemini-2.0-flash";
export const GEMINI_PRO = "gemini-1.5-pro";

export function getGeminiModel(modelId: string = GEMINI_FLASH) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: modelId });
}
