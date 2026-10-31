export type RandomFn = () => number;

/**
 * Small seeded PRNG (mulberry32). The same seed always yields the same sequence, so scenes and
 * ambient motion render identically on the server and in the browser, and tests stay deterministic.
 */
export function mulberry32(seed: number): RandomFn {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
