import { createHexGrid, hexCorners, type HexCell, type Point } from "@/utils/hex";
import type { RandomFn } from "@/utils/random";

export { mulberry32 } from "@/utils/random";

/**
 * Canvas simulation for the opening sequence:
 * bees fly in from all four edges → land on hex cells, filling a honeycomb →
 * the comb glows → it bursts into shards and the bees scatter.
 *
 * Everything is a pure function of elapsed time, so frames are deterministic
 * (easy to test) and there is no per-frame state to drift.
 */

export const SWARM_TIMELINE = {
  /** Every bee has landed by this point (ms). */
  arriveBy: 2100,
  burstAt: 2500,
  end: 3400,
} as const;

const RINGS = 3;
const BEES_PER_CELL = 2;
const MAX_FLIGHT_DELAY = 650;
const MIN_FLIGHT = 900;
const FLIGHT_SPREAD = 500;
const CELL_FADE_MS = 280;

interface Bee {
  start: Point;
  control: Point;
  target: Point;
  delay: number;
  duration: number;
  phase: number;
  cellIndex: number;
  scatterAngle: number;
  scatterSpeed: number;
}

interface Shard {
  points: [Point, Point, Point];
  centroid: Point;
  velocity: Point;
  spin: number;
}

export interface SwarmScene {
  width: number;
  height: number;
  radius: number;
  beeLength: number;
  center: Point;
  cells: HexCell[];
  bees: Bee[];
  shards: Shard[];
  combRadius: number;
}

export type Ctx2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));
const easeOutCubic = (t: number): number => 1 - (1 - t) ** 3;
const easeInOutSine = (t: number): number => -(Math.cos(Math.PI * t) - 1) / 2;

function edgePoint(side: number, width: number, height: number, random: RandomFn): Point {
  const margin = 60;
  switch (side) {
    case 0:
      return { x: random() * width, y: -margin };
    case 1:
      return { x: width + margin, y: random() * height };
    case 2:
      return { x: random() * width, y: height + margin };
    default:
      return { x: -margin, y: random() * height };
  }
}

export interface SwarmDensity {
  rings: number;
}

/** Phones get a smaller comb (19 cells / 38 bees) so the intro stays smooth on mid-range CPUs. */
export function chooseDensity(width: number, cores: number): SwarmDensity {
  return { rings: width < 768 || cores <= 4 ? 2 : RINGS };
}

export function createSwarmScene(
  width: number,
  height: number,
  random: RandomFn = Math.random,
  density: SwarmDensity = { rings: RINGS },
): SwarmScene {
  const { rings } = density;
  const radius = Math.max(16, Math.min(58, Math.min(width, height) * (rings === RINGS ? 0.058 : 0.075)));
  const center = { x: width / 2, y: height / 2 };
  const cells = createHexGrid(rings, radius, center);
  const combRadius = radius * (rings * 2 + 1) * 0.9;

  const bees: Bee[] = [];
  cells.forEach((cell, cellIndex) => {
    for (let i = 0; i < BEES_PER_CELL; i++) {
      const start = edgePoint((cellIndex * BEES_PER_CELL + i) % 4, width, height, random);
      const target = {
        x: cell.x + (random() - 0.5) * radius * 0.6,
        y: cell.y + (random() - 0.5) * radius * 0.6,
      };
      const dx = target.x - start.x;
      const dy = target.y - start.y;
      const bend = (random() - 0.5) * 0.9;
      bees.push({
        start,
        target,
        // Perpendicular offset gives each bee its own curved flight path.
        control: { x: start.x + dx * 0.5 - dy * bend, y: start.y + dy * 0.5 + dx * bend },
        delay: random() * MAX_FLIGHT_DELAY,
        duration: MIN_FLIGHT + random() * FLIGHT_SPREAD,
        phase: random() * Math.PI * 2,
        cellIndex,
        scatterAngle: Math.atan2(target.y - center.y, target.x - center.x) + (random() - 0.5) * 0.8,
        scatterSpeed: 700 + random() * 900,
      });
    }
  });

  const shards: Shard[] = cells.flatMap((cell) => {
    const corners = hexCorners(cell.x, cell.y, radius * 0.94);
    return corners.map((corner, k) => {
      const next = corners[(k + 1) % 6];
      const centroid = { x: (cell.x + corner.x + next.x) / 3, y: (cell.y + corner.y + next.y) / 3 };
      const fromCenter = Math.atan2(centroid.y - center.y, centroid.x - center.x);
      const fromCell = Math.atan2(centroid.y - cell.y, centroid.x - cell.x);
      const speed = 450 + random() * 750;
      return {
        points: [{ x: cell.x, y: cell.y }, corner, next] as [Point, Point, Point],
        centroid,
        velocity: {
          x: Math.cos(fromCenter) * speed + Math.cos(fromCell) * 140,
          y: Math.sin(fromCenter) * speed + Math.sin(fromCell) * 140,
        },
        spin: (random() - 0.5) * 9,
      };
    });
  });

  return {
    width,
    height,
    radius,
    beeLength: Math.max(14, radius * 0.62),
    center,
    cells,
    bees,
    shards,
    combRadius,
  };
}

/** Where a bee is and which way it faces at time `t` (ms). */
export function beePose(bee: Bee, t: number, scene: SwarmScene): { position: Point; angle: number; opacity: number } {
  const { burstAt, end } = SWARM_TIMELINE;

  if (t >= burstAt) {
    const elapsed = (t - burstAt) / 1000;
    const burstProgress = clamp01((t - burstAt) / (end - burstAt));
    const distance = bee.scatterSpeed * elapsed * (0.6 + elapsed);
    return {
      position: {
        x: bee.target.x + Math.cos(bee.scatterAngle) * distance,
        y: bee.target.y + Math.sin(bee.scatterAngle) * distance - 40 * elapsed,
      },
      angle: bee.scatterAngle,
      opacity: 1 - clamp01((burstProgress - 0.5) / 0.5),
    };
  }

  const raw = (t - bee.delay) / bee.duration;
  if (raw < 1) {
    const p = easeOutCubic(clamp01(raw));
    const inv = 1 - p;
    const position = {
      x: inv * inv * bee.start.x + 2 * inv * p * bee.control.x + p * p * bee.target.x,
      y: inv * inv * bee.start.y + 2 * inv * p * bee.control.y + p * p * bee.target.y,
    };
    // Tangent of the quadratic Bézier gives the heading.
    const tx = 2 * inv * (bee.control.x - bee.start.x) + 2 * p * (bee.target.x - bee.control.x);
    const ty = 2 * inv * (bee.control.y - bee.start.y) + 2 * p * (bee.target.y - bee.control.y);
    return { position, angle: Math.atan2(ty, tx), opacity: raw < 0 ? 0 : 1 };
  }

  // Landed: crawl gently around the cell.
  const wander = scene.radius * 0.14;
  const time = t * 0.004 + bee.phase;
  return {
    position: { x: bee.target.x + Math.sin(time) * wander, y: bee.target.y + Math.cos(time * 1.3) * wander },
    angle: bee.phase + Math.sin(time * 0.7) * 0.6,
    opacity: 1,
  };
}

/** 0–1 fill of each cell, derived from how many of its bees have landed. */
export function cellFill(scene: SwarmScene, cellIndex: number, t: number): number {
  let total = 0;
  for (let i = cellIndex * BEES_PER_CELL; i < (cellIndex + 1) * BEES_PER_CELL; i++) {
    const bee = scene.bees[i];
    total += clamp01((t - (bee.delay + bee.duration)) / CELL_FADE_MS);
  }
  return easeInOutSine(total / BEES_PER_CELL);
}

/** Pre-renders the bee body once; only the wings are drawn per frame. */
export function createBeeSprite(length: number, dpr: number): HTMLCanvasElement | OffscreenCanvas {
  const w = Math.ceil(length * dpr);
  const h = Math.ceil(length * 0.7 * dpr);
  const canvas = typeof OffscreenCanvas === "function" ? new OffscreenCanvas(w, h) : document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d") as Ctx2D | null;
  if (!ctx) return canvas;

  ctx.scale(dpr, dpr);
  const bodyW = length * 0.7;
  const bodyH = length * 0.46;
  const cy = (length * 0.7) / 2;

  ctx.save();
  ctx.beginPath();
  ctx.ellipse(bodyW / 2 + 1, cy, bodyW / 2, bodyH / 2, 0, 0, Math.PI * 2);
  const body = ctx.createRadialGradient(bodyW * 0.4, cy - bodyH * 0.2, 1, bodyW / 2, cy, bodyW / 2);
  body.addColorStop(0, "#ffe08a");
  body.addColorStop(0.6, "#f2b21c");
  body.addColorStop(1, "#a8670a");
  ctx.fillStyle = body;
  ctx.fill();
  ctx.clip();
  ctx.fillStyle = "#24160a";
  ctx.fillRect(bodyW * 0.3, 0, bodyW * 0.13, length);
  ctx.fillRect(bodyW * 0.58, 0, bodyW * 0.13, length);
  ctx.restore();

  ctx.beginPath();
  ctx.arc(bodyW + length * 0.1, cy, length * 0.17, 0, Math.PI * 2);
  ctx.fillStyle = "#24160a";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(bodyW + length * 0.15, cy - length * 0.05, length * 0.05, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  return canvas;
}

export interface SwarmRenderer {
  draw: (t: number) => void;
}

export function createSwarmRenderer(ctx: Ctx2D, scene: SwarmScene, dpr: number): SwarmRenderer {
  const sprite = createBeeSprite(scene.beeLength, dpr);
  const spriteW = sprite.width / dpr;
  const spriteH = sprite.height / dpr;
  const { center, radius, combRadius } = scene;

  const combGradient = ctx.createLinearGradient(
    center.x - combRadius,
    center.y - combRadius,
    center.x + combRadius,
    center.y + combRadius,
  );
  combGradient.addColorStop(0, "#ffd77a");
  combGradient.addColorStop(0.5, "#e09a12");
  combGradient.addColorStop(1, "#8a4b07");

  const hexPath = (cell: Point, r: number) => {
    const corners = hexCorners(cell.x, cell.y, r);
    ctx.beginPath();
    ctx.moveTo(corners[0].x, corners[0].y);
    for (let i = 1; i < 6; i++) ctx.lineTo(corners[i].x, corners[i].y);
    ctx.closePath();
  };

  const drawGlow = (t: number) => {
    const { burstAt } = SWARM_TIMELINE;
    const build = clamp01((t - 1100) / 1200);
    if (build <= 0 || t > burstAt + 200) return;
    const pulse = 0.85 + Math.sin(t * 0.012) * 0.15;
    const reach = combRadius * 1.7;
    const glow = ctx.createRadialGradient(center.x, center.y, radius, center.x, center.y, reach);
    glow.addColorStop(0, `rgba(255, 196, 70, ${0.38 * build * pulse})`);
    glow.addColorStop(1, "rgba(255, 196, 70, 0)");
    ctx.fillStyle = glow;
    // Fill only the glow's bounding box — full-screen fills dominate frame cost on phones.
    ctx.fillRect(center.x - reach, center.y - reach, reach * 2, reach * 2);
  };

  const drawComb = (t: number) => {
    ctx.lineJoin = "round";
    scene.cells.forEach((cell, index) => {
      const fill = cellFill(scene, index, t);
      hexPath(cell, radius * 0.94);
      ctx.globalAlpha = 0.08 + 0.92 * fill;
      ctx.fillStyle = combGradient;
      ctx.fill();
      ctx.globalAlpha = 0.18 + 0.82 * fill;
      ctx.strokeStyle = "#5a3606";
      ctx.lineWidth = Math.max(2, radius * 0.09);
      ctx.stroke();
      if (fill > 0.3) {
        ctx.globalAlpha = 0.25 * fill;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.ellipse(cell.x - radius * 0.2, cell.y - radius * 0.35, radius * 0.32, radius * 0.12, -0.3, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.globalAlpha = 1;
  };

  const drawBurst = (t: number) => {
    const { burstAt, end } = SWARM_TIMELINE;
    const progress = clamp01((t - burstAt) / (end - burstAt));
    const seconds = (t - burstAt) / 1000;
    const eased = easeOutCubic(progress);

    // Single flash + expanding shockwave (well under the three-flashes-per-second limit).
    if (progress < 0.35) {
      const flash = (1 - progress / 0.35) ** 2;
      const reach = combRadius * 2.2;
      const light = ctx.createRadialGradient(center.x, center.y, 0, center.x, center.y, reach);
      light.addColorStop(0, `rgba(255, 244, 214, ${0.85 * flash})`);
      light.addColorStop(0.4, `rgba(255, 196, 70, ${0.45 * flash})`);
      light.addColorStop(1, "rgba(255, 196, 70, 0)");
      ctx.fillStyle = light;
      ctx.fillRect(center.x - reach, center.y - reach, reach * 2, reach * 2);
    }
    ctx.globalAlpha = (1 - progress) * 0.7;
    ctx.strokeStyle = "#ffd77a";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(center.x, center.y, combRadius * (0.8 + eased * 2.6), 0, Math.PI * 2);
    ctx.stroke();

    ctx.globalAlpha = (1 - progress) ** 1.3;
    ctx.fillStyle = combGradient;
    ctx.strokeStyle = "#5a3606";
    ctx.lineWidth = 1.5;
    for (const shard of scene.shards) {
      const dx = shard.velocity.x * seconds;
      const dy = shard.velocity.y * seconds + 380 * seconds * seconds;
      const angle = shard.spin * eased;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const scale = 1 - 0.35 * eased;
      ctx.beginPath();
      shard.points.forEach((point, i) => {
        const lx = (point.x - shard.centroid.x) * scale;
        const ly = (point.y - shard.centroid.y) * scale;
        const x = shard.centroid.x + dx + lx * cos - ly * sin;
        const y = shard.centroid.y + dy + lx * sin + ly * cos;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  };

  const drawBees = (t: number) => {
    const wingLength = scene.beeLength * 0.42;
    for (const bee of scene.bees) {
      const pose = beePose(bee, t, scene);
      if (pose.opacity <= 0) continue;
      const flap = 0.3 + 0.7 * Math.abs(Math.sin(t * 0.09 + bee.phase));

      ctx.globalAlpha = pose.opacity;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.translate(pose.position.x, pose.position.y);
      ctx.rotate(pose.angle);

      ctx.fillStyle = "rgba(240, 248, 255, 0.6)";
      ctx.beginPath();
      ctx.ellipse(-spriteW * 0.05, -spriteH * 0.35, wingLength * 0.5, wingLength * flap * 0.55, -0.3, 0, Math.PI * 2);
      ctx.ellipse(spriteW * 0.12, -spriteH * 0.33, wingLength * 0.42, wingLength * flap * 0.45, 0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.drawImage(sprite, -spriteW / 2, -spriteH / 2, spriteW, spriteH);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalAlpha = 1;
  };

  return {
    draw: (t: number) => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawGlow(t);
      if (t < SWARM_TIMELINE.burstAt) drawComb(t);
      else drawBurst(t);
      drawBees(t);
    },
  };
}

export interface SwarmViewport {
  width: number;
  height: number;
  devicePixelRatio: number;
  cores: number;
}

export interface SwarmCallbacks {
  onBurst: () => void;
  onComplete: () => void;
}

/** Fewer pixels per frame on phones; the motion hides the softer edges. */
export function canvasPixelRatio({ width, devicePixelRatio }: SwarmViewport): number {
  return Math.min(devicePixelRatio || 1, width < 768 ? 1.5 : 2);
}

// Dedicated workers have requestAnimationFrame in Chromium and Firefox; fall back to a 60 Hz timer elsewhere.
const scheduleFrame = (callback: (now: number) => void): number =>
  typeof requestAnimationFrame === "function"
    ? requestAnimationFrame(callback)
    : (setTimeout(() => callback(performance.now()), 16) as unknown as number);

const cancelFrame = (handle: number): void => {
  if (typeof cancelAnimationFrame === "function") cancelAnimationFrame(handle);
  else clearTimeout(handle);
};

/**
 * Runs the full sequence on a 2D context (a DOM canvas or an OffscreenCanvas in a worker).
 * The caller sizes the canvas backing store. Returns a cancel function.
 */
export function startSwarmLoop(
  ctx: Ctx2D,
  viewport: SwarmViewport,
  { onBurst, onComplete }: SwarmCallbacks,
): () => void {
  const dpr = canvasPixelRatio(viewport);
  const scene = createSwarmScene(
    viewport.width,
    viewport.height,
    Math.random,
    chooseDensity(viewport.width, viewport.cores),
  );
  const renderer = createSwarmRenderer(ctx, scene, dpr);

  let frame = 0;
  let startTime: number | null = null;
  let burstFired = false;

  const tick = (now: number) => {
    startTime ??= now;
    const t = now - startTime;
    renderer.draw(t);

    if (!burstFired && t >= SWARM_TIMELINE.burstAt) {
      burstFired = true;
      onBurst();
    }
    if (t >= SWARM_TIMELINE.end) {
      onComplete();
      return;
    }
    frame = scheduleFrame(tick);
  };
  frame = scheduleFrame(tick);

  return () => cancelFrame(frame);
}
