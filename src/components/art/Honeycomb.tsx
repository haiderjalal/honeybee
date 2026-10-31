import { useId } from "react";

import { cn } from "@/utils/cn";
import { createHexGrid, hexPointsAttr } from "@/utils/hex";

interface HoneycombProps {
  className?: string;
  /** Show animated drips falling from the lowest cells. */
  dripping?: boolean;
}

const CELL_RADIUS = 30;
const CELLS = createHexGrid(1, CELL_RADIUS, { x: 100, y: 90 });
const DRIP_CELLS = CELLS.filter((cell) => cell.r === 1 && cell.ring === 1);

/** A seven-cell honeycomb tinted by the inherited `--honey-*` variables. */
export function Honeycomb({ className, dripping = false }: HoneycombProps) {
  const id = useId();
  const fillId = `${id}-fill`;
  const shineId = `${id}-shine`;

  return (
    <svg viewBox="0 0 200 200" className={cn("overflow-visible", className)} aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={fillId} cx="35%" cy="30%" r="75%">
          <stop offset="0%" style={{ stopColor: "var(--honey-light)", transition: "stop-color 600ms" }} />
          <stop offset="60%" style={{ stopColor: "var(--honey-base)", transition: "stop-color 600ms" }} />
          <stop offset="100%" style={{ stopColor: "var(--honey-deep)", transition: "stop-color 600ms" }} />
        </radialGradient>
        <linearGradient id={shineId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {CELLS.map((cell) => (
        <g key={`${cell.q}:${cell.r}`}>
          <polygon
            points={hexPointsAttr(cell.x, cell.y, CELL_RADIUS - 1.5)}
            fill={`url(#${fillId})`}
            stroke="#3b2507"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <polygon
            points={hexPointsAttr(cell.x, cell.y, CELL_RADIUS - 8)}
            fill="none"
            stroke="#ffffff"
            strokeOpacity="0.12"
            strokeWidth="2"
          />
          <ellipse cx={cell.x - 6} cy={cell.y - 10} rx="9" ry="4" fill={`url(#${shineId})`} />
        </g>
      ))}

      {dripping
        ? DRIP_CELLS.map((cell, index) => (
            <path
              key={`drip-${cell.q}`}
              className="honey-drip"
              style={{ animationDelay: `${index * 0.8}s` }}
              d={`M${cell.x} ${cell.y + CELL_RADIUS - 2} c-5 8 -6 13 0 16 c6 -3 5 -8 0 -16 z`}
              fill="var(--honey-base)"
            />
          ))
        : null}
    </svg>
  );
}
