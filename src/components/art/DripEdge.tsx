import type { CSSProperties } from "react";

import { cn } from "@/utils/cn";

/** Drip lengths and stagger offsets in viewBox units (1200 × 40). */
const DRIPS = [
  { x: 40, length: 26, delay: 0 },
  { x: 150, length: 14, delay: 1.2 },
  { x: 260, length: 34, delay: 0.5 },
  { x: 420, length: 18, delay: 2.1 },
  { x: 560, length: 30, delay: 0.9 },
  { x: 720, length: 12, delay: 1.7 },
  { x: 860, length: 36, delay: 2.6 },
  { x: 1010, length: 20, delay: 0.3 },
  { x: 1150, length: 28, delay: 1.5 },
] as const;

const dripPath = (x: number, length: number): string => {
  const half = 3;
  const bottom = length - half;
  return `M${x - half} 4 V${bottom} A${half} ${half} 0 0 0 ${x + half} ${bottom} V4 Z`;
};

/** Gold honey band with animated drips, used as a decorative edge between sections. */
export function DripEdge({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1200 40"
      preserveAspectRatio="none"
      className={cn("pointer-events-none absolute inset-x-0 top-0 h-10 w-full", className)}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="drip-edge-band" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#b8770a" />
          <stop offset="50%" stopColor="#ffd77a" />
          <stop offset="100%" stopColor="#b8770a" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="1200" height="4" fill="url(#drip-edge-band)" />
      {DRIPS.map((drip) => (
        <path
          key={drip.x}
          d={dripPath(drip.x, drip.length)}
          fill="url(#drip-edge-band)"
          className="edge-drip"
          style={{ "--drip-delay": `-${drip.delay}s` } as CSSProperties}
        />
      ))}
    </svg>
  );
}
