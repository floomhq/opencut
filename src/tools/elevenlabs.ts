import axios from "axios";
import fs from "fs";

export type VoiceId = "rachel" | "adam" | "josh" | "elli" | "bella";

const VOICE_IDS: Record<VoiceId, string> = {
  rachel: "21m00Tcm4TlvDq8ikWAM",
  adam: "pNInz6obpgDQGcFmaJgB",
  josh: "TxGEqnHWrfWFTfGW9XjX",
  elli: "MF3mGyEYCl7XYWbV9V6O",
  bella: "EXAVITQu4vr4xnSDxMaL",
};

export interface TtsOptions {
  text: string;
  voice?: VoiceId; // default: "rachel"
  outputPath: string; // absolute path where .mp3 is saved
  modelId?: string; // default: "eleven_multilingual_v2"
}

export async function textToSpeech(opts: TtsOptions): Promise<string> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY environment variable is not set");
  }

  const voice = opts.voice ?? "rachel";
  const modelId = opts.modelId ?? "eleven_multilingual_v2";
  const voiceId = VOICE_IDS[voice];

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`;

  const response = await axios.post(
    url,
    {
      text: opts.text,
      model_id: modelId,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
      },
    },
    {
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      responseType: "stream",
    },
  );

  await new Promise<void>((resolve, reject) => {
    const writer = fs.createWriteStream(opts.outputPath);
    (response.data as NodeJS.ReadableStream).pipe(writer);
    writer.on("finish", resolve);
    writer.on("error", reject);
  });

  return opts.outputPath;
}
