// ---------------------------------------------------------------------------
// Lightweight in-memory sliding-window rate limiter.
// Kept on globalThis so it survives HMR / route module reloads in dev and is
// shared across requests within a single server instance. This matches the
// app's existing in-process store architecture; swap for Upstash/Redis when a
// multi-instance deployment needs shared limits.
// ---------------------------------------------------------------------------

type Bucket = { hits: number[] }

type GlobalRL = { __mb_rl?: Map<string, Bucket> }
const g = globalThis as unknown as GlobalRL
const buckets: Map<string, Bucket> = g.__mb_rl ?? (g.__mb_rl = new Map())

export type RateResult = {
  ok: boolean
  remaining: number
  retryAfterMs: number
}

/**
 * Record a hit for `key` and report whether it is within `limit` per `windowMs`.
 * Does not throw; callers decide how to respond (typically HTTP 429).
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateResult {
  const now = Date.now()
  const bucket = buckets.get(key) ?? { hits: [] }
  // Drop timestamps outside the window.
  bucket.hits = bucket.hits.filter((t) => now - t < windowMs)

  if (bucket.hits.length >= limit) {
    const oldest = bucket.hits[0]
    buckets.set(key, bucket)
    return { ok: false, remaining: 0, retryAfterMs: Math.max(0, windowMs - (now - oldest)) }
  }

  bucket.hits.push(now)
  buckets.set(key, bucket)

  // Opportunistic cleanup so the map does not grow unbounded.
  if (buckets.size > 5000) {
    for (const [k, b] of buckets) {
      if (b.hits.every((t) => now - t >= windowMs)) buckets.delete(k)
    }
  }

  return { ok: true, remaining: limit - bucket.hits.length, retryAfterMs: 0 }
}

// Clear a key on success (e.g. successful login resets failed-attempt counter).
export function resetRateLimit(key: string) {
  buckets.delete(key)
}

// Best-effort client IP from proxy headers (Vercel sets x-forwarded-for).
export function clientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return req.headers.get('x-real-ip') || 'unknown'
}
