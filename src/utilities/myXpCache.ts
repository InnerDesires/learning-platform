import type { MyXp } from '@/actions/xp'

/**
 * Session-scoped cache for the header XP pill so it doesn't cost a server
 * round trip on every full page load. Mutations that award XP (step
 * completion, quiz pass) clear it explicitly.
 */

const KEY = 'myXp:v1'
const TTL_MS = 5 * 60 * 1000

type CacheEntry = { userId: string; at: number; xp: MyXp }

export function readMyXpCache(userId: string): MyXp | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null
    const entry = JSON.parse(raw) as CacheEntry
    if (entry.userId !== userId || Date.now() - entry.at > TTL_MS) return null
    return entry.xp
  } catch {
    return null
  }
}

export function writeMyXpCache(userId: string, xp: MyXp): void {
  try {
    const entry: CacheEntry = { userId, at: Date.now(), xp }
    sessionStorage.setItem(KEY, JSON.stringify(entry))
  } catch {
    // storage unavailable (private mode, quota) — caching is best-effort
  }
}

export function clearMyXpCache(): void {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}
