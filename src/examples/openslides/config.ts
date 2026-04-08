/**
 * OpenSlides demo video configuration.
 *
 * This defines the video-level settings: resolution, playback speed,
 * facecam asset path, background music, etc.
 */
import type { VideoConfig } from "../../engine";

export const OPENSLIDES_CONFIG: VideoConfig = {
  playbackRate: 1.3,
  fps: 30,
  width: 1920,
  height: 1080,
  crossfadeFrames: 10,
  facecamAsset: "facecam.mov",
  bgMusicAsset: "bg-music.mp3",
  bgMusicVolume: 0.08,
};

/** Audio offset correction in seconds (Whisper timestamps vs. actual audio). */
export const AUDIO_OFFSET_SEC = 0.124;
