/**
 * Fixed-window rate limiting with an atomic, distributed-compatible backend.
 *
 * `rateLimitDistributed()` uses Upstash/Vercel KV REST credentials when
 * configured and fails closed in production if the shared backend is absent or
 * unavailable. The synchronous `rateLimit()` export remains as a compatibility
 * shim for existing local-only callers; new security boundaries must use the
 * async function.
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
  backend: "memory" | "redis" | "unavailable";
  reason?: "backend_unavailable";
}

interface Bucket {
  count: number;
  resetAt: number;
}

const store = new Map<string, Bucket>();

export interface RateLimitBackend {
  increment(key: string, windowMs: number): Promise<{ count: number; resetAt: number }>;
}

export interface DistributedRateLimitOptions {
  backend?: RateLimitBackend;
  /**
   * Defaults to `deny` in production and `memory` in development.
   * Production callers should not override this without a documented exception.
   */
  failureMode?: "deny" | "memory";
}

let redisBackendPromise: Promise<RateLimitBackend | null> | null = null;

function assertConfig(config: RateLimitConfig): void {
  if (!Number.isInteger(config.max) || config.max < 1) {
    throw new Error("Rate limit max must be a positive integer");
  }
  if (!Number.isFinite(config.windowMs) || config.windowMs < 1) {
    throw new Error("Rate limit windowMs must be positive");
  }
}

/** Occasionally purge expired buckets so the Map cannot grow unbounded. */
function sweep(now: number): void {
  if (store.size < 5000) return;
  for (const [k, b] of store) {
    if (now > b.resetAt) store.delete(k);
  }
}

function memoryRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  assertConfig(config);
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
      backend: "memory",
    };
  }

  if (bucket.count >= config.max) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: bucket.resetAt,
      retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
      backend: "memory",
    };
  }

  bucket.count += 1;
  return {
    allowed: true,
    remaining: Math.max(0, config.max - bucket.count),
    resetAt: bucket.resetAt,
    retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    backend: "memory",
  };
}

/**
 * Backward-compatible process-local limiter.
 * @deprecated Use `await rateLimitDistributed(...)` for production boundaries.
 */
export function rateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  return memoryRateLimit(key, config);
}

async function createRedisBackend(): Promise<RateLimitBackend | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;

  const { Redis } = await import("@upstash/redis");
  const redis = new Redis({ url, token });
  const script = `
    local count = redis.call("INCR", KEYS[1])
    if count == 1 then
      redis.call("PEXPIRE", KEYS[1], ARGV[1])
    end
    local ttl = redis.call("PTTL", KEYS[1])
    return { count, ttl }
  `;

  return {
    async increment(key, windowMs) {
      const redisKey = `nx:ratelimit:${key.slice(0, 500)}`;
      const result = (await redis.eval(script, [redisKey], [String(Math.ceil(windowMs))])) as [
        number,
        number,
      ];
      const count = Number(result[0]);
      const ttl = Number(result[1]);
      if (!Number.isFinite(count) || !Number.isFinite(ttl) || ttl < 0) {
        throw new Error("Rate-limit backend returned an invalid counter");
      }
      return { count, resetAt: Date.now() + ttl };
    },
  };
}

async function getRedisBackend(): Promise<RateLimitBackend | null> {
  if (!redisBackendPromise) {
    redisBackendPromise = createRedisBackend().catch((error) => {
      console.error("[RATE_LIMIT] Shared backend initialization failed:", error);
      return null;
    });
  }
  return redisBackendPromise;
}

export async function rateLimitDistributed(
  key: string,
  config: RateLimitConfig,
  options: DistributedRateLimitOptions = {}
): Promise<RateLimitResult> {
  assertConfig(config);
  const failureMode =
    options.failureMode ?? (process.env.NODE_ENV === "production" ? "deny" : "memory");
  const backend = options.backend ?? (await getRedisBackend());

  if (backend) {
    try {
      const { count, resetAt } = await backend.increment(key, config.windowMs);
      const now = Date.now();
      return {
        allowed: count <= config.max,
        remaining: Math.max(0, config.max - count),
        resetAt,
        retryAfter: Math.max(1, Math.ceil((resetAt - now) / 1000)),
        backend: "redis",
      };
    } catch (error) {
      console.error("[RATE_LIMIT] Shared backend request failed:", error);
    }
  }

  if (failureMode === "memory") return memoryRateLimit(key, config);

  const resetAt = Date.now() + config.windowMs;
  return {
    allowed: false,
    remaining: 0,
    resetAt,
    retryAfter: Math.max(1, Math.ceil(config.windowMs / 1000)),
    backend: "unavailable",
    reason: "backend_unavailable",
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
  redisBackendPromise = null;
}
