import { sql } from '@payloadcms/db-postgres'
import type { BasePayload } from 'payload'

/**
 * Fixed-window limiter backed by the Better Auth `rate_limit` table — Better Auth uses it
 * for /api/auth/*, this helper for everything else; key prefixes keep the two disjoint.
 * One atomic upsert both counts the request and resets expired windows, so concurrent
 * lambdas can't double-count. `last_request` stores the window start (epoch ms).
 */

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfter: number }

/**
 * Single policy switch for BOTH limiters (Better Auth reads it too). Production-on by
 * default; RATE_LIMIT=true opts a dev session in, RATE_LIMIT=false opts out even of a
 * production build — E2E runs `next start` from one runner IP. Read at call time so tests
 * can toggle it per process.
 */
export function isRateLimitEnabled(): boolean {
  if (process.env.RATE_LIMIT === 'false') return false
  if (process.env.RATE_LIMIT === 'true') return true
  return process.env.NODE_ENV === 'production'
}

type RateLimitRow = { count: string | number; last_request: string | number }

const STALE_ROW_AGE_MS = 1000 * 60 * 60 * 24 * 30

export async function checkRateLimit(
  payload: BasePayload,
  { key, windowSeconds, max }: { key: string; windowSeconds: number; max: number },
): Promise<RateLimitResult> {
  if (!isRateLimitEnabled()) return { ok: true }

  const windowMs = windowSeconds * 1000
  const now = Date.now()
  const windowStartCutoff = now - windowMs

  try {
    const db = payload.db.drizzle as unknown as {
      execute: (q: ReturnType<typeof sql>) => Promise<RateLimitRow[] | { rows?: RateLimitRow[] }>
    }
    const result = await db.execute(sql`
      INSERT INTO rate_limit ("key", "count", "last_request", "updated_at", "created_at")
      VALUES (${key}, 1, ${now}, now(), now())
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE WHEN rate_limit."last_request" <= ${windowStartCutoff} THEN 1 ELSE rate_limit."count" + 1 END,
        "last_request" = CASE WHEN rate_limit."last_request" <= ${windowStartCutoff} THEN ${now} ELSE rate_limit."last_request" END,
        "updated_at" = now()
      RETURNING "count", "last_request"
    `)
    const rows = Array.isArray(result) ? result : (result.rows ?? [])
    const row = rows[0]
    if (!row) return { ok: true }

    const count = Number(row.count)
    const windowStart = Number(row.last_request)

    if (count > max) {
      return { ok: false, retryAfter: Math.max(1, Math.ceil((windowStart + windowMs - now) / 1000)) }
    }

    // Opportunistic GC — IP-keyed rows accumulate forever otherwise. Rare and
    // cheap (indexed scan over a small table), so inline is fine.
    if (Math.random() < 0.01) {
      await db.execute(sql`DELETE FROM rate_limit WHERE "last_request" <= ${now - STALE_ROW_AGE_MS}`)
    }

    return { ok: true }
  } catch (err) {
    // Fail open: the limiter protects endpoints, it must never take them down.
    payload.logger.error({ err, key }, 'rate-limit: check failed, allowing request')
    return { ok: true }
  }
}

/**
 * Client IP for rate-limit keys. On Vercel the proxy sets x-forwarded-for;
 * `null` (no trusted header, e.g. direct local connections) means the caller
 * should skip IP-keyed limiting rather than pool everyone into one bucket.
 */
export function getClientIp(request: Request): string | null {
  const forwarded = request.headers.get('x-forwarded-for')
  const first = forwarded?.split(',')[0]?.trim()
  if (first) return first
  return request.headers.get('x-real-ip')
}
