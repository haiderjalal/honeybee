import type { CSSProperties } from "react";

import { Bee } from "@/components/art/Bee";
import { cn } from "@/utils/cn";
import { mulberry32 } from "@/utils/random";

import { createFlightPlan, type BeeFlight } from "./flightPlan";

const BEE_COUNT = 10;
/** Bees beyond this index are only shown on larger screens to keep phones light. */
const MOBILE_BEE_COUNT = 5;
const FLIGHTS = createFlightPlan(BEE_COUNT, mulberry32(20261031));

function flightStyle(flight: BeeFlight): CSSProperties {
  return {
    ...flight.cssVars,
    width: `${flight.size}rem`,
    animationDuration: `${flight.duration}s`,
    animationDelay: `${flight.delay}s`,
    opacity: flight.opacity,
    filter: flight.blur > 0 ? `blur(${flight.blur}px)` : undefined,
    // Mirrors left-flying bees; applied before rotation, which the heading maths assumes.
    scale: flight.direction === "left" ? "-1 1" : undefined,
  } as CSSProperties;
}

/**
 * Decorative bees that cross the page behind the content, in both directions.
 * Purely visual: hidden from assistive technology, ignores the pointer and disappears
 * for users who prefer reduced motion.
 */
export function AmbientBees() {
  return (
    <div aria-hidden="true" className="ambient-layer">
      {FLIGHTS.map((flight, index) => (
        <div
          key={flight.id}
          className={cn("ambient-bee", index >= MOBILE_BEE_COUNT && "hidden sm:block")}
          style={flightStyle(flight)}
        >
          <Bee className="w-full" />
        </div>
      ))}
    </div>
  );
}
