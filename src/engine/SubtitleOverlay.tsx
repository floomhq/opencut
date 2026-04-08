/**
 * Word-level subtitle overlay with active-word highlighting.
 *
 * Groups words into short phrases (3-7 words) and displays them
 * at the bottom of the frame. The currently spoken word is highlighted
 * in a distinct color while the rest stay white.
 *
 * Feed it Whisper word-level timestamps via the `segments` prop.
 */
import React, { useMemo } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import type { SubtitleSegment, SubtitleStyle, Word } from "./types";

// ---------------------------------------------------------------------------
// Phrase grouping
// ---------------------------------------------------------------------------

interface Phrase {
  words: Word[];
  start: number;
  end: number;
}

const DEFAULT_OUTLINE = [
  "-3px -3px 0 #000",
  "3px -3px 0 #000",
  "-3px 3px 0 #000",
  "3px 3px 0 #000",
  "-2px 0 0 #000",
  "2px 0 0 #000",
  "0 -2px 0 #000",
  "0 2px 0 #000",
  "0 0 8px rgba(0,0,0,0.9)",
];

function buildPhrases(segments: SubtitleSegment[]): Phrase[] {
  const MIN_PHRASE = 3;
  const MAX_PHRASE = 7;
  const raw: Phrase[] = [];

  for (const seg of segments) {
    let current: Word[] = [];

    for (let i = 0; i < seg.words.length; i++) {
      const word = seg.words[i];
      current.push(word);

      const trimmed = word.word.trim();
      const isSentenceEnd = /[.?!]$/.test(trimmed);
      const isComma = /,$/.test(trimmed);
      const isLastWord = i === seg.words.length - 1;

      let shouldBreak = false;
      if (isLastWord) shouldBreak = true;
      else if (isSentenceEnd && current.length >= MIN_PHRASE) shouldBreak = true;
      else if (isComma && current.length >= 4) shouldBreak = true;
      else if (current.length >= MAX_PHRASE) shouldBreak = true;

      if (shouldBreak && current.length > 0) {
        raw.push({
          words: [...current],
          start: current[0].start,
          end: current[current.length - 1].end,
        });
        current = [];
      }
    }

    if (current.length > 0) {
      if (current.length <= 2 && raw.length > 0) {
        const prev = raw[raw.length - 1];
        prev.words.push(...current);
        prev.end = current[current.length - 1].end;
      } else {
        raw.push({
          words: current,
          start: current[0].start,
          end: current[current.length - 1].end,
        });
      }
    }
  }

  // Merge short orphan phrases into the previous one
  const merged: Phrase[] = [];
  for (const phrase of raw) {
    if (phrase.words.length <= 2 && merged.length > 0) {
      const prev = merged[merged.length - 1];
      prev.words.push(...phrase.words);
      prev.end = phrase.end;
    } else {
      merged.push(phrase);
    }
  }
  return merged;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export interface SubtitleOverlayProps {
  /** Whisper subtitle segments with word-level timestamps. */
  segments: SubtitleSegment[];
  /** Raw start time of the current timeline segment (seconds). */
  segmentRawStartSec: number;
  /** Current face bubble position (used to shift subtitles up when bubble is at bottom). */
  faceBubblePosition: string;
  /** Playback rate multiplier. */
  playbackRate: number;
  /**
   * Audio offset correction in seconds.
   * Positive values mean the audio plays that much later than the video.
   * Defaults to 0.
   */
  audioOffsetSec?: number;
  /** Visual style overrides. */
  style?: SubtitleStyle;
}

export const SubtitleOverlay: React.FC<SubtitleOverlayProps> = ({
  segments,
  segmentRawStartSec,
  faceBubblePosition,
  playbackRate,
  audioOffsetSec = 0,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const allPhrases = useMemo(() => buildPhrases(segments), [segments]);

  const outputTimeSec = frame / fps;
  const rawTimeSec =
    segmentRawStartSec + outputTimeSec * playbackRate + audioOffsetSec;

  const activePhrase = allPhrases.find(
    (p) => rawTimeSec >= p.start && rawTimeSec <= p.end,
  );

  if (!activePhrase) return null;

  const bottomOffset =
    faceBubblePosition === "bottom-left" || faceBubblePosition === "bottom-right"
      ? (style?.bottomOffsetWithBubble ?? 100)
      : (style?.bottomOffset ?? 50);

  const outline = (style?.outline ?? DEFAULT_OUTLINE).join(", ");
  const fontFamily =
    style?.fontFamily ?? "Montserrat, Liberation Sans, Arial Black, sans-serif";
  const fontSize = style?.fontSize ?? 48;
  const fontWeight = style?.fontWeight ?? 900;
  const activeColor = style?.activeColor ?? "#F5C518";
  const inactiveColor = style?.inactiveColor ?? "#ffffff";

  return (
    <div
      style={{
        position: "absolute",
        bottom: bottomOffset,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        zIndex: 20,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          display: "inline-flex",
          flexWrap: "nowrap",
          justifyContent: "center",
          gap: 10,
        }}
      >
        {activePhrase.words.map((word, idx) => {
          const isActive = rawTimeSec >= word.start && rawTimeSec <= word.end;
          return (
            <span
              key={idx}
              style={{
                fontFamily,
                fontSize,
                fontWeight,
                fontStyle: "italic",
                color: isActive ? activeColor : inactiveColor,
                WebkitTextStroke: "2px #000",
                textShadow: outline,
                lineHeight: 1.4,
                whiteSpace: "nowrap",
              }}
            >
              {word.word.trim()}
            </span>
          );
        })}
      </div>
    </div>
  );
};
