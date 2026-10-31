import { describe, expect, it } from "vitest";

import { beePose, cellFill, createSwarmScene, mulberry32, SWARM_TIMELINE } from "@/features/intro/swarmEngine";
import {
  activeStageAt,
  jarFillAt,
  jarLidAt,
  streamOpacityAt,
  streamXKeyframes,
} from "@/features/pour-story/pourTimeline";
import { createHexGrid, hexCellCount } from "@/utils/hex";

describe("hex grid", () => {
  it.each([
    [0, 1],
    [1, 7],
    [3, 37],
  ])("a %i-ring comb has %i cells", (rings, cells) => {
    expect(createHexGrid(rings, 10, { x: 0, y: 0 })).toHaveLength(cells);
    expect(hexCellCount(rings)).toBe(cells);
  });

  it("is centred on the origin", () => {
    const cells = createHexGrid(2, 10, { x: 50, y: 80 });
    const avgX = cells.reduce((s, c) => s + c.x, 0) / cells.length;
    const avgY = cells.reduce((s, c) => s + c.y, 0) / cells.length;
    expect(avgX).toBeCloseTo(50);
    expect(avgY).toBeCloseTo(80);
  });
});

describe("swarm intro", () => {
  const scene = createSwarmScene(1280, 800, mulberry32(42));

  it("sends two bees to every cell", () => {
    expect(scene.cells).toHaveLength(37);
    expect(scene.bees).toHaveLength(74);
  });

  it("starts every bee off-screen and lands it on its cell before the burst", () => {
    for (const bee of scene.bees) {
      const { x, y } = bee.start;
      expect(x < 0 || x > scene.width || y < 0 || y > scene.height).toBe(true);
      expect(bee.delay + bee.duration).toBeLessThanOrEqual(SWARM_TIMELINE.arriveBy);
    }
  });

  it("fills the comb from empty to full", () => {
    expect(cellFill(scene, 0, 0)).toBeCloseTo(0);
    expect(cellFill(scene, 0, SWARM_TIMELINE.burstAt)).toBeCloseTo(1);
  });

  it("scatters bees outward and fades them out by the end", () => {
    const bee = scene.bees[0];
    const landed = beePose(bee, SWARM_TIMELINE.burstAt - 1, scene).position;
    const flying = beePose(bee, SWARM_TIMELINE.burstAt + 400, scene).position;
    const distLanded = Math.hypot(landed.x - scene.center.x, landed.y - scene.center.y);
    const distFlying = Math.hypot(flying.x - scene.center.x, flying.y - scene.center.y);
    expect(distFlying).toBeGreaterThan(distLanded);
    expect(beePose(bee, SWARM_TIMELINE.end, scene).opacity).toBe(0);
  });

  it("is deterministic for a given seed", () => {
    const again = createSwarmScene(1280, 800, mulberry32(42));
    expect(again.bees[5].start).toEqual(scene.bees[5].start);
  });
});

describe("pour timeline", () => {
  it("fills jars one after another", () => {
    expect(jarFillAt(0, 0, 3)).toBe(0);
    expect(jarFillAt(1 / 3, 0, 3)).toBe(1);
    expect(jarFillAt(1 / 3, 1, 3)).toBe(0);
    expect(jarFillAt(1, 2, 3)).toBe(1);
  });

  it("closes each lid only after its jar is full", () => {
    expect(jarLidAt(0.2, 0, 3)).toBe(0);
    expect(jarFillAt(0.3, 0, 3)).toBe(1);
    expect(jarLidAt(1 / 3, 0, 3)).toBe(1);
  });

  it("hides the stream while it travels between jars", () => {
    expect(streamOpacityAt(1 / 3 + 0.01, 3)).toBe(0);
    expect(streamOpacityAt(0.5, 3)).toBe(1);
  });

  it("produces monotonic keyframes ending over the last jar", () => {
    const { input, output } = streamXKeyframes([250, 600, 950]);
    expect(input).toEqual([...input].sort((a, b) => a - b));
    expect(output.at(-1)).toBe(950);
    expect(input).toHaveLength(output.length);
  });

  it("maps progress to the active stage", () => {
    expect([0, 0.34, 0.67, 1].map((p) => activeStageAt(p, 3))).toEqual([0, 1, 2, 2]);
  });
});
