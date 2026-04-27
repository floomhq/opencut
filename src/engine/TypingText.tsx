/**
 * Reusable typing animation component with cursor.
 *
 * Renders text character-by-character with an optional blinking cursor.
 * Supports customizable speed, cursor style, and accent color.
 *
 * Usage:
 *   <TypingText text="Hello world" speed={2.5} cursor />
 */

import React from "react";
import { useCurrentFrame } from "remotion";

export interface TypingTextProps {
  /** Full text to type out. */
  text: string;
  /** Characters revealed per frame (higher = faster). Default 2.5. */
  speed?: number;
  /** Whether to show a blinking cursor. Default true. */
  cursor?: boolean;
  /** Cursor blink speed in frames. Default 16. */
  cursorBlinkFrames?: number;
  /** Cursor width in pixels. Default 2. */
  cursorWidth?: number;
  /** Cursor height in pixels. Default 22. */
  cursorHeight?: number;
  /** Cursor color. Default "rgba(255,255,255,0.82)". */
  cursorColor?: string;
  /** Start delay in frames before typing begins. Default 0. */
  startDelay?: number;
  /** Accent color for glow effects. Optional. */
  accentColor?: string;
  /** Inline styles for the text container. */
  style?: React.CSSProperties;
  /** ClassName for Tailwind or CSS. */
  className?: string;
}

export const TypingText: React.FC<TypingTextProps> = ({
  text,
  speed = 2.5,
  cursor = true,
  cursorBlinkFrames = 16,
  cursorWidth = 2,
  cursorHeight = 22,
  cursorColor = "rgba(255,255,255,0.82)",
  startDelay = 0,
  accentColor,
  style,
  className,
}) => {
  const frame = useCurrentFrame();
  const effectiveFrame = Math.max(0, frame - startDelay);

  const visibleChars = Math.min(
    text.length,
    Math.floor(effectiveFrame * speed)
  );
  const displayed = text.slice(0, visibleChars);
  const isDone = visibleChars >= text.length;
  const showCursor =
    cursor &&
    frame >= startDelay &&
    !isDone &&
    frame % Math.max(1, cursorBlinkFrames) <
      Math.max(1, cursorBlinkFrames) * 0.6;

  return (
    <span className={className} style={style}>
      {displayed}
      {showCursor && (
        <span
          style={{
            display: "inline-block",
            width: cursorWidth,
            height: cursorHeight,
            backgroundColor: accentColor ?? cursorColor,
            marginLeft: 2,
            verticalAlign: "middle",
            borderRadius: 1,
            boxShadow: accentColor
              ? `0 0 8px ${accentColor}80`
              : undefined,
          }}
        />
      )}
    </span>
  );
};
