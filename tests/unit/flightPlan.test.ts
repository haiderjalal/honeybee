import { describe, expect, it } from "vitest";

import { createFlightPlan, headingDegrees, normalizeDegrees } from "@/features/ambient/flightPlan";
import { mulberry32 } from "@/utils/random";

const plan = createFlightPlan(10, mulberry32(20261031));
const xOf = (vars: Record<string, string>, index: number) => Number.parseFloat(vars[`--x${index}`]);

describe("normalizeDegrees", () => {
  it.each([
    [0, 0],
    [180, -180],
    [-180, -180],
    [270, -90],
    [-355, 5],
    [725, 5],
  ])("wraps %d to %d", (input, expected) => {
    expect(normalizeDegrees(input)).toBeCloseTo(expected);
  });
});

describe("headingDegrees", () => {
  it("points a right-flying bee along its path", () => {
    expect(headingDegrees({ x: 0, y: 50 }, { x: 10, y: 50 }, "right")).toBeCloseTo(0);
    expect(headingDegrees({ x: 0, y: 50 }, { x: 10, y: 60 }, "right")).toBeGreaterThan(0);
  });

  it("offsets a left-flying bee by 180° because it is mirrored", () => {
    expect(headingDegrees({ x: 10, y: 50 }, { x: 0, y: 50 }, "left")).toBeCloseTo(0);
    expect(headingDegrees({ x: 10, y: 50 }, { x: 0, y: 60 }, "left")).toBeLessThan(0);
  });
});

describe("createFlightPlan", () => {
  it("creates one flight per requested bee with unique ids", () => {
    expect(plan).toHaveLength(10);
    expect(new Set(plan.map((flight) => flight.id)).size).toBe(10);
  });

  it("alternates direction so traffic flows both ways", () => {
    expect(plan.filter((flight) => flight.direction === "right")).toHaveLength(5);
    expect(plan.filter((flight) => flight.direction === "left")).toHaveLength(5);
  });

  it("starts and ends every crossing fully off-screen", () => {
    for (const flight of plan) {
      const first = xOf(flight.cssVars, 0);
      const last = xOf(flight.cssVars, 3);
      if (flight.direction === "right") {
        expect(first).toBeLessThan(0);
        expect(last).toBeGreaterThan(100);
      } else {
        expect(first).toBeGreaterThan(100);
        expect(last).toBeLessThan(0);
      }
    }
  });

  it("keeps every heading inside [-180, 180) and close to level so bees never flip upside down", () => {
    for (const flight of plan) {
      for (let index = 0; index < 4; index++) {
        const heading = Number.parseFloat(flight.cssVars[`--a${index}`]);
        expect(heading).toBeGreaterThanOrEqual(-180);
        expect(heading).toBeLessThan(180);
        expect(Math.abs(heading)).toBeLessThan(60);
      }
    }
  });

  it("keeps vertical positions on screen", () => {
    for (const flight of plan) {
      for (let index = 0; index < 4; index++) {
        const y = Number.parseFloat(flight.cssVars[`--y${index}`]);
        expect(y).toBeGreaterThanOrEqual(4);
        expect(y).toBeLessThanOrEqual(92);
      }
    }
  });

  it("is deterministic for a given seed, so server and browser agree", () => {
    expect(createFlightPlan(10, mulberry32(7))).toEqual(createFlightPlan(10, mulberry32(7)));
  });

  it("starts bees part-way through their crossing so the sky is never empty", () => {
    for (const flight of plan) {
      expect(flight.delay).toBeLessThanOrEqual(0);
      expect(Math.abs(flight.delay)).toBeLessThan(flight.duration);
    }
  });
});
