/**
 * Lightweight, dependency-free rate limiter.
 *
 * Fixed-window counter kept in-process (Map). This is PER SERVER INSTANCE — on a
 * multi-instance / serverless deployment each instance has its own window, so
 * treat it as a first line of defense, not a hard global quota. A distributed
 * limiter (Upstash Redis / Vercel KV — both already available as deps) can be
 * swapped in behind this same interface later.
 *
 * Server-only.
 */

export interface RateLimitConfig {
  /** Window length in milliseconds. */
  windowMs: number;
  /** Max requests allowed per key per window. */
  max: number;
}

export interface RateLimitResult {
  allowed: boolean;
  /** Remaining requests in the current window (never negative). */
  remaining: number;
  /** Epoch ms when the window resets. */
  resetAt: number;
  /** Seconds until reset (for Retry-After). */
  retryAfter: number;
}

interface Bucket {
  count: number;
  resetAt: number;
}

const store = new Map<string, Bucket>();

/** Occasionally purge expired buckets so the Map cannot grow unbounded. */
function sweep(now: number): void {
  if (store.size < 5000) return;
  for (const [k, b] of store) {
    if (now > b.resetAt) store.delete(k);
  }
}

export function rateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const bucket = store.get(key);
  if (!bucket || now > bucket.resetAt) {
    const resetAt = now + config.windowMs;
    store.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: Math.max(0, config.max - 1),
      resetAt,
      retryAfter: Math.ceil(config.windowMs / 1000),
    };
  }

  if (bucket.count >= config.max) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: bucket.resetAt,
      retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count += 1;
  return {
    allowed: true,
    remaining: Math.max(0, config.max - bucket.count),
    resetAt: bucket.resetAt,
    retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
  };
}

/** Derive a stable rate-limit key from request headers (best-effort client IP). */
export function clientIpFromHeaders(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip")?.trim() || "unknown";
}

/** Namespaced key: `${scope}:${ip}`. */
export function rateLimitKey(scope: string, headers: Headers): string {
  return `${scope}:${clientIpFromHeaders(headers)}`;
}

/** Test/maintenance helper. */
export function __resetRateLimitStore(): void {
  store.clear();
}
