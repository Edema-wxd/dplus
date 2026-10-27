/**
 * @jest-environment node
 */

function freshCache(redisValue: unknown = null) {
  jest.resetModules();
  jest.doMock("@/lib/redis", () => ({ redis: redisValue }));
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("../cache") as typeof import("../cache");
}

describe("cached — no redis", () => {
  test("loads once, then serves from memory", async () => {
    const { cached } = freshCache();
    const load = jest.fn().mockResolvedValue({ a: 1 });

    expect(await cached("products:x", 60, load)).toEqual({ a: 1 });
    expect(await cached("products:x", 60, load)).toEqual({ a: 1 });
    expect(load).toHaveBeenCalledTimes(1);
  });

  test("caches null results", async () => {
    const { cached } = freshCache();
    const load = jest.fn().mockResolvedValue(null);

    await cached("products:missing", 60, load);
    expect(await cached("products:missing", 60, load)).toBeNull();
    expect(load).toHaveBeenCalledTimes(1);
  });

  test("invalidateCachePrefix forces a reload", async () => {
    const { cached, invalidateCachePrefix } = freshCache();
    const load = jest.fn().mockResolvedValue(1);

    await cached("products:x", 60, load);
    await invalidateCachePrefix("products:");
    await cached("products:x", 60, load);
    expect(load).toHaveBeenCalledTimes(2);
  });
});

describe("cached — with redis", () => {
  let redis: { get: jest.Mock; set: jest.Mock; keys: jest.Mock; del: jest.Mock };

  beforeEach(() => {
    redis = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue("OK"),
      keys: jest.fn().mockResolvedValue([]),
      del: jest.fn().mockResolvedValue(1),
    };
  });

  test("returns a hit without loading", async () => {
    redis.get.mockResolvedValue({ v: "cached" });
    const { cached } = freshCache(redis);
    const load = jest.fn();

    expect(await cached("products:x", 60, load)).toBe("cached");
    expect(load).not.toHaveBeenCalled();
  });

  test("stores a miss with its TTL", async () => {
    const { cached } = freshCache(redis);

    expect(await cached("products:x", 60, async () => "fresh")).toBe("fresh");
    expect(redis.set).toHaveBeenCalledWith("products:x", { v: "fresh" }, { ex: 60 });
  });

  test("falls back to the loader when redis errors", async () => {
    redis.get.mockRejectedValue(new Error("down"));
    redis.set.mockRejectedValue(new Error("down"));
    jest.spyOn(console, "error").mockImplementation(() => {});
    const { cached } = freshCache(redis);

    expect(await cached("products:x", 60, async () => "fresh")).toBe("fresh");
  });

  test("invalidateCachePrefix deletes matching and extra keys in one call", async () => {
    redis.keys.mockResolvedValue(["products:a", "products:b"]);
    const { invalidateCachePrefix } = freshCache(redis);

    await invalidateCachePrefix("products:", "pricing:config");
    expect(redis.keys).toHaveBeenCalledWith("products:*");
    expect(redis.del).toHaveBeenCalledWith("pricing:config", "products:a", "products:b");
  });
});
