// Upstash Redis cache helpers with graceful fallback if Redis is not configured
import { Redis } from '@upstash/redis'

let redis: Redis | null = null

function getRedis(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null
  }
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  }
  return redis
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const r = getRedis()
    if (!r) return null
    return await r.get<T>(key)
  } catch {
    return null
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  try {
    const r = getRedis()
    if (!r) return
    await r.set(key, value, { ex: ttlSeconds })
  } catch {
    // silent — cache is best-effort
  }
}

export async function cacheDel(key: string): Promise<void> {
  try {
    const r = getRedis()
    if (!r) return
    await r.del(key)
  } catch {
    // silent
  }
}

export async function cacheDelPattern(pattern: string): Promise<void> {
  try {
    const r = getRedis()
    if (!r) return
    // Scan + delete matching keys
    let cursor = 0
    do {
      const [nextCursor, keys] = await r.scan(cursor, { match: pattern, count: 100 })
      cursor = nextCursor as unknown as number
      if (keys.length > 0) {
        await r.del(...keys)
      }
    } while (cursor !== 0)
  } catch {
    // silent
  }
}

// Cache key builders
export const CacheKeys = {
  clientList: (caregiverId: string) => `caregiver:${caregiverId}:clients`,
  complianceScore: (agencyId: string) => `agency:${agencyId}:compliance`,
  aiThemes: (agencyId: string) => `agency:${agencyId}:ai-themes`,
  familySummary: (reportId: string) => `report:${reportId}:family-summary`,
} as const
