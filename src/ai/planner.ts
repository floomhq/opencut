import { getGeminiModel, GEMINI_FLASH } from "./gemini";

export interface Scene {
  id: string;
  durationSec: number;
  narrationText: string;
  pexelsQuery: string;
  caption?: string;
}

export interface ScenePlan {
  title: string;
  fullNarration: string;
  scenes: Scene[];
}

export interface PlannerOptions {
  prompt: string;
  targetDurationSec: number;
  voiceStyle?: string;
  model?: string;
}

function buildSystemPrompt(
  prompt: string,
  targetDurationSec: number,
  voiceStyle: string,
): string {
  const wordsPerMinute = 155;
  const wordTarget = Math.round((targetDurationSec / 60) * wordsPerMinute);
  const sceneCount = Math.max(2, Math.round(targetDurationSec / 15));
  const wordsPerScene = wordTarget / sceneCount;

  return `You are a video script writer and B-roll director. Given a topic and target duration, generate a complete video production plan with professional stock footage selection.

Respond with ONLY a valid JSON object (no markdown, no explanation) matching this exact TypeScript interface:
{
  "title": string,          // ≤8 words, punchy and specific
  "fullNarration": string,  // Complete voiceover script, ~${wordTarget} words, conversational and direct
  "scenes": [
    {
      "id": "scene-01",
      "durationSec": number,    // seconds for this scene
      "narrationText": string,  // exact words spoken during this scene
      "pexelsQuery": string,    // 3-5 word Pexels B-roll search query (see rules below)
      "caption": string | null  // impactful on-screen text max 4 words, or null (see rules)
    }
  ]
}

Rules:
- scenes must sum to exactly ${targetDurationSec} seconds
- fullNarration is the concatenation of all narrationText fields
- narrationText per scene: ~${Math.round(wordsPerScene)} words per scene

PEXELS QUERY RULES (critical for video quality):
- Describe what is VISUALLY ON SCREEN, not the abstract concept
- Use concrete, camera-ready descriptions: objects, actions, settings
- Good: "programmer typing code dark office", "team whiteboard meeting startup", "laptop screen code review"
- Bad: "technology", "innovation", "software development" (too abstract, returns generic stock)
- Think like a cinematographer: what shot would a cameraman frame for this moment?
- Prefer human activity shots over pure abstract/tech shots
- Match the emotional tone: energetic topic → active footage, reflective topic → slower shots

CAPTION RULES:
- Use null for most scenes — captions should punctuate key moments, not repeat narration
- Only use caption for the single most impactful stat, claim, or term in the video
- Max once or twice per full video — overuse kills impact
- Examples of good captions: "10x faster", "Type-safe", "Ship faster"

- Tone: ${voiceStyle}
- Topic: ${prompt}`;
}

function validateScenePlan(obj: unknown): obj is ScenePlan {
  if (typeof obj !== "object" || obj === null) return false;
  const plan = obj as Record<string, unknown>;

  if (typeof plan["title"] !== "string") return false;
  if (typeof plan["fullNarration"] !== "string") return false;
  if (!Array.isArray(plan["scenes"])) return false;

  for (const scene of plan["scenes"] as unknown[]) {
    if (typeof scene !== "object" || scene === null) return false;
    const s = scene as Record<string, unknown>;
    if (typeof s["id"] !== "string") return false;
    if (typeof s["durationSec"] !== "number") return false;
    if (typeof s["narrationText"] !== "string") return false;
    if (typeof s["pexelsQuery"] !== "string") return false;
  }

  return true;
}

function stripJsonFences(text: string): string {
  // Remove ```json ... ``` or ``` ... ``` wrappers if Gemini includes them
  return text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();
}

function normalizeScenes(scenes: Scene[]): Scene[] {
  return scenes.map((scene) => {
    const normalized: Scene = {
      id: scene.id,
      durationSec: scene.durationSec,
      narrationText: scene.narrationText,
      pexelsQuery: scene.pexelsQuery,
    };
    // Only include caption if it's a non-null string
    if (typeof scene.caption === "string" && scene.caption.length > 0) {
      normalized.caption = scene.caption;
    }
    return normalized;
  });
}

async function parseResponse(text: string): Promise<ScenePlan> {
  const cleaned = stripJsonFences(text);
  const parsed: unknown = JSON.parse(cleaned);

  if (!validateScenePlan(parsed)) {
    throw new Error(
      "Gemini response does not match ScenePlan schema: missing or invalid fields (title, fullNarration, scenes[].id/durationSec/narrationText/pexelsQuery)",
    );
  }

  return {
    title: parsed.title,
    fullNarration: parsed.fullNarration,
    scenes: normalizeScenes(parsed.scenes),
  };
}

export async function generateScenePlan(
  opts: PlannerOptions,
): Promise<ScenePlan> {
  const {
    prompt,
    targetDurationSec,
    voiceStyle = "professional",
    model = GEMINI_FLASH,
  } = opts;

  const systemPrompt = buildSystemPrompt(prompt, targetDurationSec, voiceStyle);
  const geminiModel = getGeminiModel(model);

  // First attempt
  const firstResult = await geminiModel.generateContent(systemPrompt);
  const firstText = firstResult.response.text();

  try {
    return await parseResponse(firstText);
  } catch {
    // Retry once with a stricter prompt
    const retryPrompt = `${systemPrompt}

IMPORTANT: Your previous response was not valid JSON. Respond with ONLY the JSON object — no markdown fences, no explanation, no extra text. Start your response with { and end with }.`;

    const retryResult = await geminiModel.generateContent(retryPrompt);
    const retryText = retryResult.response.text();

    try {
      return await parseResponse(retryText);
    } catch (retryErr) {
      throw new Error(
        `Failed to parse Gemini scene plan after retry: ${retryErr instanceof Error ? retryErr.message : String(retryErr)}`,
      );
    }
  }
}
