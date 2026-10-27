import { redis } from "@/lib/redis";

/**
 * Read-through cache for database results, so repeat reads don't wake Neon.
 *
 * Uses Redis when configured, so every server instance shares one cache and an
 * invalidation reaches all of them. Without Redis (e.g. local dev) it falls back
 * to a small per-process map with a short TTL, because other instances can't
 * see an invalidation made here.
 *
 * Values are wrapped so a cached `null` (e.g. "product not found") is a hit.
 */

/** Prefix for cached catalogue reads, which embed NGN prices. */
export const PRODUCT_CACHE_PREFIX = "products:";

type Wrapped<T> = { v: T };
type MemEntry = { value: unknown; expiresAt: number };

const MEM_MAX_ENTRIES = 500;
const MEM_MAX_TTL_SECONDS = 5 * 60;
const mem = new Map<string, MemEntry>();

export async function cached<T>(
  key: string,
  ttlSeconds: number,
  load: () => Promise<T>
): Promise<T> {
  if (redis) {
    try {
      const hit = await redis.get<Wrapped<T>>(key);
      if (hit) return hit.v;
    } catch (err) {
      console.error(`[cache] read failed for ${key}:`, err);
    }
  } else {
    const hit = mem.get(key);
    if (hit && hit.expiresAt > Date.now()) return hit.value as T;
    if (hit) mem.delete(key);
  }

  const value = await load();

  if (redis) {
    try {
      await redis.set<Wrapped<T>>(key, { v: value }, { ex: ttlSeconds });
    } catch (err) {
      console.error(`[cache] write failed for ${key}:`, err);
    }
  } else {
    // Oldest entries go first once the map is full.
    if (mem.size >= MEM_MAX_ENTRIES) mem.delete(mem.keys().next().value!);
    mem.set(key, {
      value,
      expiresAt: Date.now() + Math.min(ttlSeconds, MEM_MAX_TTL_SECONDS) * 1000,
    });
  }

  return value;
}

/**
 * Drops every cached entry whose key starts with `prefix`, plus any
 * `extraKeys`, in a single Redis delete.
 */
export async function invalidateCachePrefix(prefix: string, ...extraKeys: string[]) {
  for (const key of mem.keys()) {
    if (key.startsWith(prefix)) mem.delete(key);
  }
  if (!redis) return;

  const keys = [...extraKeys, ...(await redis.keys(`${prefix}*`))];
  if (keys.length) await redis.del(...keys);
}
