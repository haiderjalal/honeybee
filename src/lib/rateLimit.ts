interface RateLimiterOptions {
  limit: number;
  windowMs: number;
  /** Safety valve so the map cannot grow without bound. */
  maxKeys?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

/**
 * In-memory sliding-window limiter. On serverless platforms each instance keeps
 * its own window, so this is a first line of defence; swap in a shared store
 * (e.g. Upstash Redis) if abuse becomes significant.
 */
export function createRateLimiter({ limit, windowMs, maxKeys = 5000 }: RateLimiterOptions) {
  const hits = new Map<string, number[]>();

  return {
    check(key: string, now = Date.now()): RateLimitResult {
      const recent = (hits.get(key) ?? []).filter((time) => now - time < windowMs);

      if (recent.length >= limit) {
        hits.set(key, recent);
        return { allowed: false, remaining: 0, retryAfterMs: windowMs - (now - recent[0]) };
      }

      if (!hits.has(key) && hits.size >= maxKeys) {
        const oldestKey = hits.keys().next().value;
        if (oldestKey !== undefined) hits.delete(oldestKey);
      }
      recent.push(now);
      hits.set(key, recent);
      return { allowed: true, remaining: limit - recent.length, retryAfterMs: 0 };
    },
  };
}
