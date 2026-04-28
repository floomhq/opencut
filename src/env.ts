/**
 * Central environment variable validation.
 *
 * Import this module early in your application to ensure all required
 * environment variables are present before execution continues.
 *
 * Usage:
 *   import "./env"; // Validates env vars on import
 *   import { env } from "./env";
 *   const apiKey = env.GEMINI_API_KEY;
 */

const requiredVars = [
  // Add required env vars here when the app truly cannot run without them
  // Currently all API keys have runtime fallbacks or are optional
] as const;

function validate(): void {
  const missing: string[] = [];

  for (const key of requiredVars) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}\n` +
        `Copy .env.example to .env and fill in your values.`
    );
  }
}

validate();

/**
 * Typed accessor for environment variables.
 * Returns the value or undefined if not set.
 */
export function getEnv(key: string): string | undefined {
  return process.env[key];
}

/**
 * Strict accessor — throws if the variable is not set.
 */
export function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) {
    throw new Error(
      `Environment variable ${key} is required.\n` +
        `Copy .env.example to .env and fill in your values.`
    );
  }
  return val;
}

/** Convenience export for commonly used variables. */
export const env = {
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY,
  PEXELS_API_KEY: process.env.PEXELS_API_KEY,
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  CI: process.env.CI === "true",
};
