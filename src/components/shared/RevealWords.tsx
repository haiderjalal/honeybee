import type { CSSProperties } from "react";

import { cn } from "@/utils/cn";

interface RevealWordsProps {
  text: string;
  /** Applied to every word, so clip-based effects such as `text-gold` stay on the glyphs. */
  className?: string;
  /** Index of the first word, so several phrases can share one stagger sequence. */
  startAt?: number;
}

/**
 * Splits a phrase into words that rise in one after another (see `.hero-word` in globals.css).
 * Non-breaking spaces keep each word on one line; the text stays readable to assistive technology.
 */
export function RevealWords({ text, className, startAt = 0 }: RevealWordsProps) {
  const words = text.split(" ");

  return (
    <span>
      {words.map((word, index) => (
        <span
          key={`${word}-${index}`}
          className={cn("hero-word", className)}
          style={{ "--w": startAt + index } as CSSProperties}
        >
          {word}
          {index < words.length - 1 ? " " : null}
        </span>
      ))}
    </span>
  );
}
