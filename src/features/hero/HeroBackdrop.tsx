import type { CSSProperties } from "react";

import { hexPointsAttr } from "@/utils/hex";

/** Deterministic pollen positions (no Math.random, so server and client markup match). */
const POLLEN = Array.from({ length: 18 }, (_, i) => ({
  left: `${(i * 37) % 100}%`,
  top: `${60 + ((i * 53) % 40)}%`,
  size: 2 + (i % 3),
  duration: `${10 + (i % 6) * 2}s`,
  delay: `${-(i * 1.3)}s`,
  drift: `${((i % 5) - 2) * 18}px`,
}));

export function HeroBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="aurora aurora-sage -top-40 -left-32 size-[32rem] sm:size-[44rem]" />
      {/* The gold bloom is skipped on phones: a second large blur is the costliest layer on low-end GPUs. */}
      <div className="aurora aurora-gold top-1/3 -right-40 hidden size-[36rem] sm:block" />
      <svg className="parallax-slow absolute inset-0 size-full opacity-[0.07]" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id="hero-hex" width="60" height="104" patternUnits="userSpaceOnUse">
            <polygon points={hexPointsAttr(30, 26, 28)} fill="none" stroke="#f6bd3c" strokeWidth="1.2" />
            <polygon points={hexPointsAttr(0, 78, 28)} fill="none" stroke="#f6bd3c" strokeWidth="1.2" />
            <polygon points={hexPointsAttr(60, 78, 28)} fill="none" stroke="#f6bd3c" strokeWidth="1.2" />
          </pattern>
          <radialGradient id="hero-hex-fade" cx="70%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <mask id="hero-hex-mask">
            <rect width="100%" height="100%" fill="url(#hero-hex-fade)" />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="url(#hero-hex)" mask="url(#hero-hex-mask)" />
      </svg>

      {POLLEN.map((p) => (
        <span
          key={`${p.left}-${p.top}`}
          className="pollen absolute rounded-full bg-gold-300 shadow-[0_0_8px_#ffd77a]"
          style={
            {
              left: p.left,
              top: p.top,
              width: p.size,
              height: p.size,
              "--pollen-duration": p.duration,
              "--pollen-delay": p.delay,
              "--pollen-drift": p.drift,
            } as CSSProperties
          }
        />
      ))}

      <div className="absolute inset-x-0 bottom-0 h-40 bg-linear-to-b from-transparent to-forest-950" />
    </div>
  );
}
