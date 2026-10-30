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
 *
 * Entries outlive their TTL by STALE_SECONDS: once the TTL has passed the
 * next read reloads, but if that load fails (e.g. Neon is down or over its
 * quota) the stale value is served instead of an error page.
 */

/** Prefix for cached catalogue reads, which embed NGN prices. */
export const PRODUCT_CACHE_PREFIX = "products:";

/** How long an expired entry is kept as a fallback for a failed reload. */
const STALE_SECONDS = 7 * 24 * 60 * 60;

/** `exp` is when the value goes stale; entries written before it existed lack it. */
type Wrapped<T> = { v: T; exp?: number };
type MemEntry = { value: unknown; expiresAt: number };

const MEM_MAX_ENTRIES = 500;
const MEM_MAX_TTL_SECONDS = 5 * 60;
const mem = new Map<string, MemEntry>();

export async function cached<T>(
  key: string,
  ttlSeconds: number,
  load: () => Promise<T>
): Promise<T> {
  let stale: Wrapped<T> | null = null;

  if (redis) {
    try {
      const hit = await redis.get<Wrapped<T>>(key);
      if (hit && (hit.exp === undefined || hit.exp > Date.now())) return hit.v;
      stale = hit;
    } catch (err) {
      console.error(`[cache] read failed for ${key}:`, err);
    }
  } else {
    const hit = mem.get(key);
    if (hit && hit.expiresAt > Date.now()) return hit.value as T;
    if (hit) stale = { v: hit.value as T };
  }

  let value: T;
  try {
    value = await load();
  } catch (err) {
    if (!stale) throw err;
    console.error(`[cache] load failed for ${key}, serving stale value:`, err);
    return stale.v;
  }

  if (redis) {
    try {
      await redis.set<Wrapped<T>>(
        key,
        { v: value, exp: Date.now() + ttlSeconds * 1000 },
        { ex: ttlSeconds + STALE_SECONDS }
      );
    } catch (err) {
      console.error(`[cache] write failed for ${key}:`, err);
    }
  } else {
    // Oldest entries go first once the map is full.
    mem.delete(key);
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
