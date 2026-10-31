/**
 * Maps overall scroll progress (0–1) of the Pour Story onto each jar.
 * The section is split into one equal segment per jar; inside a segment the
 * stream travels, pours (fill 0→1), then the lid drops on.
 */
export const POUR_PHASES = {
  travelEnd: 0.12,
  pourEnd: 0.8,
  lidEnd: 0.94,
} as const;

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

function local(progress: number, index: number, count: number): number {
  const length = 1 / count;
  return (progress - index * length) / length;
}

export function jarFillAt(progress: number, index: number, count: number): number {
  const t = local(progress, index, count);
  return clamp01((t - POUR_PHASES.travelEnd) / (POUR_PHASES.pourEnd - POUR_PHASES.travelEnd));
}

export function jarLidAt(progress: number, index: number, count: number): number {
  const t = local(progress, index, count);
  return clamp01((t - POUR_PHASES.pourEnd) / (POUR_PHASES.lidEnd - POUR_PHASES.pourEnd));
}

/** The stream is only visible while a jar is actually filling. */
export function streamOpacityAt(progress: number, count: number): number {
  const index = activeStageAt(progress, count);
  const t = local(progress, index, count);
  const fadeIn = clamp01((t - (POUR_PHASES.travelEnd - 0.04)) / 0.04);
  const fadeOut = 1 - clamp01((t - POUR_PHASES.pourEnd) / 0.04);
  return Math.min(fadeIn, fadeOut);
}

/** Keyframes that hold the stream over each jar and glide between them. */
export function streamXKeyframes(positions: readonly number[]): { input: number[]; output: number[] } {
  const count = positions.length;
  const input: number[] = [0];
  const output: number[] = [positions[0]];

  for (let i = 1; i < count; i++) {
    const leave = (i - 1 + POUR_PHASES.lidEnd) / count;
    const arrive = (i + POUR_PHASES.travelEnd - 0.02) / count;
    input.push(leave, arrive);
    output.push(positions[i - 1], positions[i]);
  }
  input.push(1);
  output.push(positions[count - 1]);
  return { input, output };
}

export function activeStageAt(progress: number, count: number): number {
  return Math.min(count - 1, Math.max(0, Math.floor(progress * count)));
}
