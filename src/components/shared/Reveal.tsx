import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/utils/cn";

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Stagger in seconds; applied as a later start within the view timeline. */
  delay?: number;
}

/**
 * Fades and lifts its children in as they scroll into view, using CSS
 * scroll-driven animations — no JavaScript or hydration. Browsers without
 * support simply show the content.
 */
export function Reveal({ children, className, delay = 0 }: RevealProps) {
  return (
    <div className={cn("reveal", className)} style={{ "--reveal-delay": `${delay * 100}px` } as CSSProperties}>
      {children}
    </div>
  );
}
