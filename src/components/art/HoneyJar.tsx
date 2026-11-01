import { useId, type CSSProperties } from "react";

import { cn } from "@/utils/cn";

/** Jar geometry in its 200×300 viewBox. Honey travels this many units between empty and full. */
const HONEY_TRAVEL = 222;
const JAR_BODY_PATH =
  "M60 50 H140 Q140 68 162 80 Q184 92 184 120 V260 Q184 286 158 286 H42 Q16 286 16 260 V120 Q16 92 38 80 Q60 68 60 50 Z";
const WAVE_PATH = (() => {
  let d = "M-200 64";
  for (let x = -200; x < 400; x += 50) {
    d += ` Q${x + 12.5} 58 ${x + 25} 64 T${x + 50} 64`;
  }
  return `${d} V300 H-200 Z`;
})();

export interface HoneyJarProps {
  className?: string;
  /** 0–1. When omitted the jar inherits `--fill` from an ancestor (for animated fills). */
  fill?: number;
  /** 0–1 lid placement. When omitted the jar inherits `--lid` (defaults to closed). */
  lid?: number;
  label?: { title: string; subtitle: string };
  /** Positioning attributes when nested inside another <svg>. */
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  title?: string;
}

/**
 * A glass honey jar drawn in SVG. Honey colour comes from the inherited
 * `--honey-light | --honey-base | --honey-deep` CSS variables.
 */
export function HoneyJar({ className, fill, lid, label, x, y, width, height, title }: HoneyJarProps) {
  const id = useId();
  const clipId = `${id}-clip`;
  const honeyId = `${id}-honey`;
  const glassId = `${id}-glass`;
  const lidId = `${id}-lid`;

  const style: CSSProperties & Record<string, number> = {};
  if (fill !== undefined) style["--fill"] = fill;
  if (lid !== undefined) style["--lid"] = lid;

  return (
    <svg
      viewBox="0 0 200 300"
      x={x}
      y={y}
      width={width}
      height={height}
      className={cn("overflow-visible", className)}
      style={style}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      focusable="false"
    >
      <defs>
        <clipPath id={clipId}>
          <path d={JAR_BODY_PATH} />
        </clipPath>
        <linearGradient id={honeyId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" style={{ stopColor: "var(--honey-light)", transition: "stop-color 600ms" }} />
          <stop offset="55%" style={{ stopColor: "var(--honey-base)", transition: "stop-color 600ms" }} />
          <stop offset="100%" style={{ stopColor: "var(--honey-deep)", transition: "stop-color 600ms" }} />
        </linearGradient>
        <linearGradient id={glassId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.16" />
          <stop offset="40%" stopColor="#ffffff" stopOpacity="0.03" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient id={lidId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffe6a6" />
          <stop offset="45%" stopColor="#e09a12" />
          <stop offset="100%" stopColor="#7a4a06" />
        </linearGradient>
      </defs>

      <ellipse cx="100" cy="292" rx="86" ry="8" fill="#000000" opacity="0.35" />
      <path d={JAR_BODY_PATH} fill={`url(#${glassId})`} />

      <g clipPath={`url(#${clipId})`}>
        <g style={{ transform: `translateY(calc((1 - var(--fill, 1)) * ${HONEY_TRAVEL}px))` }}>
          <g className="honey-wave">
            <path d={WAVE_PATH} fill={`url(#${honeyId})`} />
          </g>
          <ellipse cx="62" cy="150" rx="14" ry="60" fill="#ffffff" opacity="0.14" />
        </g>
      </g>

      <path d={JAR_BODY_PATH} fill="none" stroke="#fff6df" strokeOpacity="0.45" strokeWidth="3" />
      <path
        d="M34 126 Q30 190 36 250"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.45"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M168 136 Q171 170 168 200"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.2"
        strokeWidth="4"
        strokeLinecap="round"
      />

      {label ? (
        <g>
          <rect x="44" y="158" width="112" height="78" rx="8" fill="#fbf3e1" stroke="#b8770a" strokeWidth="1.5" />
          <rect x="50" y="164" width="100" height="66" rx="5" fill="none" stroke="#b8770a" strokeOpacity="0.45" />
          <text
            x="100"
            y="182"
            textAnchor="middle"
            fontSize="9"
            letterSpacing="3"
            fill="#7a4a06"
            fontFamily="var(--font-sans)"
          >
            HONYB
          </text>
          <text x="100" y="206" textAnchor="middle" fontSize="19" fill="#2a1a08" fontFamily="var(--font-display)">
            {label.title}
          </text>
          <text x="100" y="223" textAnchor="middle" fontSize="10" fill="#7a4a06" fontFamily="var(--font-sans)">
            {label.subtitle}
          </text>
        </g>
      ) : null}

      <g
        style={{
          transform: "translateY(calc((1 - var(--lid, 1)) * -70px))",
          opacity: "var(--lid, 1)",
        }}
      >
        <rect x="52" y="10" width="96" height="40" rx="9" fill={`url(#${lidId})`} />
        {[22, 30, 38].map((lineY) => (
          <line
            key={lineY}
            x1="56"
            x2="144"
            y1={lineY}
            y2={lineY}
            stroke="#7a4a06"
            strokeOpacity="0.35"
            strokeWidth="1.5"
          />
        ))}
        <rect x="58" y="13" width="30" height="5" rx="2.5" fill="#ffffff" opacity="0.45" />
      </g>
    </svg>
  );
}
