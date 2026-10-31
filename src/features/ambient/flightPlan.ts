import type { RandomFn } from "@/utils/random";

export type FlightDirection = "right" | "left";

/** Aspect ratio used to turn vw/vh waypoints into real angles (16:9 suits most desktop screens). */
const REF_WIDTH_PX = 1600;
const REF_HEIGHT_PX = 900;

/** Start and end x positions (vw). Both sit fully outside the viewport so loops restart unseen. */
const OFF_START = -18;
const OFF_END = 118;

export interface FlightPoint {
  /** Horizontal position in vw. */
  x: number;
  /** Vertical position in vh. */
  y: number;
}

export interface BeeFlight {
  id: number;
  direction: FlightDirection;
  /** Width in rem. */
  size: number;
  /** Seconds for one crossing. */
  duration: number;
  /** Seconds; negative values start the bee part-way across so the sky is full from the first frame. */
  delay: number;
  opacity: number;
  /** Blur in px; smaller bees are blurred slightly to suggest depth. */
  blur: number;
  /** CSS custom properties read by the `bee-cross` keyframes (--x0…--x3, --y0…--y3, --a0…--a3). */
  cssVars: Record<`--${string}`, string>;
}

/** Wraps an angle into [-180, 180). */
export function normalizeDegrees(degrees: number): number {
  return (((degrees % 360) + 540) % 360) - 180;
}

/**
 * Rotation that makes a bee point along the path from `from` to `to`.
 * Left-flying bees are mirrored with `scale: -1 1` (applied before rotation), so their
 * rotation is offset by 180°.
 */
export function headingDegrees(from: FlightPoint, to: FlightPoint, direction: FlightDirection): number {
  const dx = ((to.x - from.x) * REF_WIDTH_PX) / 100;
  const dy = ((to.y - from.y) * REF_HEIGHT_PX) / 100;
  const screen = (Math.atan2(dy, dx) * 180) / Math.PI;
  return normalizeDegrees(direction === "right" ? screen : screen - 180);
}

function buildCssVars(points: FlightPoint[], direction: FlightDirection): Record<`--${string}`, string> {
  const vars: Record<`--${string}`, string> = {};
  points.forEach((point, index) => {
    const next = points[Math.min(index + 1, points.length - 1)];
    const from = index === points.length - 1 ? points[points.length - 2] : point;
    const heading = headingDegrees(from, next, direction);
    vars[`--x${index}`] = `${point.x}vw`;
    vars[`--y${index}`] = `${point.y.toFixed(1)}vh`;
    vars[`--a${index}`] = `${heading.toFixed(2)}deg`;
  });
  return vars;
}

/**
 * Plans every bee's crossing. Bees alternate direction so traffic flows both ways.
 * Each bee follows a gently wandering lane across the page, then starts again off-screen.
 */
export function createFlightPlan(count: number, random: RandomFn): BeeFlight[] {
  return Array.from({ length: count }, (_, id) => {
    const direction: FlightDirection = id % 2 === 0 ? "right" : "left";
    const lane = 12 + random() * 70;
    const wander = (spread: number) => {
      const y = lane + (random() - 0.5) * spread;
      return Math.min(92, Math.max(4, y));
    };
    const xs = direction === "right" ? [OFF_START, 30, 66, OFF_END] : [OFF_END, 66, 30, OFF_START];
    const points = [lane, wander(28), wander(28), wander(16)].map((y, index) => ({ x: xs[index], y }));

    const duration = 20 + random() * 18;
    const size = 1.6 + random() * 1.6;

    return {
      id,
      direction,
      size,
      duration,
      delay: -(random() * duration),
      opacity: 0.45 + random() * 0.4,
      blur: size < 2.4 ? 1.2 : 0,
      cssVars: buildCssVars(points, direction),
    };
  });
}
