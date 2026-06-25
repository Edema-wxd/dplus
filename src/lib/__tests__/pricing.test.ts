/**
 * Tests for src/lib/pricing.ts
 *
 * Strategy: every describe block calls jest.resetModules() + jest.doMock()
 * before requiring the module under test. This gives each group a fresh
 * module instance with its own memCache, pool mock, and redis mock.
 */

import type { PricingConfig } from "../pricing";

// ─── helpers ─────────────────────────────────────────────────────────────────

function makeDbRow(
  overrides: Partial<{
    vat_rate: string;
    markup_percent: string;
    exchange_rate: string;
    exchange_note: string | null;
    updated_at: string;
    updated_by: string | null;
  }> = {}
) {
  return {
    vat_rate: "0.15",
    markup_percent: "30",
    exchange_rate: "22.5",
    exchange_note: null,
    updated_at: "2026-06-14T10:00:00.000Z",
    updated_by: null,
    ...overrides,
  };
}

function freshPricingMods(redisValue: unknown = null) {
  jest.resetModules();
  const mockQuery = jest.fn().mockResolvedValue({ rows: [makeDbRow()] });
  jest.doMock("@/lib/db", () => ({ pool: { query: mockQuery } }));
  jest.doMock("@/lib/redis", () => ({ redis: redisValue }));
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require("../pricing");
  return { mod, mockQuery };
}

// ─── calcPrice ───────────────────────────────────────────────────────────────

describe("calcPrice", () => {
  type CalcFn = (
    raw: number,
    cfg: { vatRate: number; markupPercent: number; exchangeRate: number }
  ) => { rawZar: number; zarIncVat: number; zarFinal: number; priceNgn: number };

  let calcPrice: CalcFn;

  beforeAll(() => {
    ({ mod: { calcPrice } } = freshPricingMods());
  });

  test("happy path: 100 ZAR → 15% VAT → 30% markup → 22.5 rate = ₦3 363.75", () => {
    const r = calcPrice(100, { vatRate: 0.15, markupPercent: 30, exchangeRate: 22.5 });
    expect(r.rawZar).toBe(100);
    expect(r.zarIncVat).toBe(115);
    expect(r.zarFinal).toBe(149.5);
    expect(r.priceNgn).toBe(3363.75);
  });

  test("zero VAT: zarIncVat equals rawZar", () => {
    const r = calcPrice(200, { vatRate: 0, markupPercent: 25, exchangeRate: 20 });
    expect(r.zarIncVat).toBe(r.rawZar);
    expect(r.zarIncVat).toBe(200);
  });

  test("zero markup: zarFinal equals zarIncVat", () => {
    const r = calcPrice(100, { vatRate: 0.15, markupPercent: 0, exchangeRate: 22.5 });
    expect(r.zarFinal).toBe(r.zarIncVat);
    expect(r.zarFinal).toBe(115);
  });

  test("rawZarExVat with more than 2 dp is rounded first", () => {
    // 99.999 → rawZar = 100 (not 99.999)
    const r = calcPrice(99.999, { vatRate: 0.15, markupPercent: 30, exchangeRate: 22.5 });
    expect(r.rawZar).toBe(100);
    // chain continues from the rounded value
    expect(r.zarIncVat).toBe(115);
    expect(r.priceNgn).toBe(3363.75);
  });

  test("input 100.005 rounds rawZar to 100.01 (mid-point rounds up)", () => {
    // Math.round(100.005 * 100) / 100 = Math.round(10000.5) / 100 = 10001 / 100 = 100.01
    const r = calcPrice(100.005, { vatRate: 0, markupPercent: 0, exchangeRate: 1 });
    expect(r.rawZar).toBe(100.01);
  });

  test("all four output values have at most 2 decimal places", () => {
    // Use inputs that would produce long decimals if rounding were skipped
    const inputs = [
      { raw: 1.005, cfg: { vatRate: 0.155, markupPercent: 33.3, exchangeRate: 22.456 } },
      { raw: 514.99, cfg: { vatRate: 0.15, markupPercent: 30, exchangeRate: 22.5 } },
      { raw: 0.01, cfg: { vatRate: 0.15, markupPercent: 30, exchangeRate: 22.5 } },
    ];
    for (const { raw, cfg } of inputs) {
      const r = calcPrice(raw, cfg);
      for (const v of Object.values(r)) {
        const decimals = v.toString().split(".")[1]?.length ?? 0;
        expect(decimals).toBeLessThanOrEqual(2);
        expect(Number.isFinite(v)).toBe(true);
      }
    }
  });

  test("large numbers: 5 000 ZAR at standard rates → ₦168 187.50", () => {
    // 5000 → ×1.15 = 5750 → ×1.30 = 7475 → ×22.5 = 168 187.5
    const r = calcPrice(5000, { vatRate: 0.15, markupPercent: 30, exchangeRate: 22.5 });
    expect(r.rawZar).toBe(5000);
    expect(r.zarIncVat).toBe(5750);
    expect(r.zarFinal).toBe(7475);
    expect(r.priceNgn).toBe(168187.5);
    // confirm 2dp
    expect(Math.round(r.priceNgn * 100) / 100).toBe(r.priceNgn);
  });

  test("very high exchange rate: still produces a rounded result", () => {
    // 100 ZAR, 0% VAT, 0% markup, rate 1500 → 150 000.00
    const r = calcPrice(100, { vatRate: 0, markupPercent: 0, exchangeRate: 1500 });
    expect(r.priceNgn).toBe(150000);
    expect(Math.round(r.priceNgn * 100) / 100).toBe(r.priceNgn);
  });
});

// ─── getPricingConfig — memCache path (redis: null) ──────────────────────────

describe("getPricingConfig — memCache path", () => {
  let getPricingConfig: () => Promise<PricingConfig>;
  let mockQuery: jest.Mock;

  beforeEach(() => {
    ({ mod: { getPricingConfig }, mockQuery } = freshPricingMods(null));
  });

  test("calls pool.query and returns mapped config on first call", async () => {
    const cfg = await getPricingConfig();

    expect(mockQuery).toHaveBeenCalledTimes(1);
    expect(cfg.vatRate).toBe(0.15);
    expect(cfg.markupPercent).toBe(30);
    expect(cfg.exchangeRate).toBe(22.5);
    expect(cfg.exchangeNote).toBeNull();
    expect(cfg.updatedAt).toBe("2026-06-14T10:00:00.000Z");
  });

  test("returns cached value on second call — pool.query NOT called again", async () => {
    await getPricingConfig();
    const cfg2 = await getPricingConfig();

    expect(mockQuery).toHaveBeenCalledTimes(1); // still just one hit
    expect(cfg2.vatRate).toBe(0.15);
  });

  test("stores all mapped fields correctly in cache", async () => {
    mockQuery.mockResolvedValue({
      rows: [
        makeDbRow({
          vat_rate: "0.10",
          markup_percent: "25.5",
          exchange_rate: "21.0",
          exchange_note: "June rate",
          updated_by: "abc-123",
        }),
      ],
    });

    const cfg = await getPricingConfig();
    expect(cfg.vatRate).toBe(0.1);
    expect(cfg.markupPercent).toBe(25.5);
    expect(cfg.exchangeRate).toBe(21.0);
    expect(cfg.exchangeNote).toBe("June rate");
    expect(cfg.updatedBy).toBe("abc-123");
  });

  test("calls pool.query again after TTL of 5 minutes has elapsed", async () => {
    const BASE_MS = 1_000_000;
    const TTL_MS = 5 * 60 * 1_000; // 300 000

    const nowSpy = jest.spyOn(Date, "now").mockReturnValue(BASE_MS);

    await getPricingConfig(); // populates cache; expiresAt = BASE_MS + TTL_MS
    expect(mockQuery).toHaveBeenCalledTimes(1);

    // Advance one millisecond past the TTL window
    nowSpy.mockReturnValue(BASE_MS + TTL_MS + 1);

    await getPricingConfig(); // expiresAt (BASE+TTL) is NOT > Date.now() → cache miss
    expect(mockQuery).toHaveBeenCalledTimes(2);

    nowSpy.mockRestore();
  });

  test("a call within TTL window still uses cache", async () => {
    const BASE_MS = 1_000_000;
    const TTL_MS = 5 * 60 * 1_000;

    const nowSpy = jest.spyOn(Date, "now").mockReturnValue(BASE_MS);
    await getPricingConfig();

    // One millisecond BEFORE expiry — still valid
    nowSpy.mockReturnValue(BASE_MS + TTL_MS - 1);
    await getPricingConfig();

    expect(mockQuery).toHaveBeenCalledTimes(1); // served from cache
    nowSpy.mockRestore();
  });
});

// ─── invalidatePricingCache — no redis ───────────────────────────────────────

describe("invalidatePricingCache — no redis", () => {
  let getPricingConfig: () => Promise<PricingConfig>;
  let invalidatePricingCache: () => Promise<void>;
  let mockQuery: jest.Mock;

  beforeEach(() => {
    ({ mod: { getPricingConfig, invalidatePricingCache }, mockQuery } = freshPricingMods(null));
  });

  test("clears memCache so the next getPricingConfig hits pool.query again", async () => {
    await getPricingConfig(); // #1 — DB hit, cache populated
    await getPricingConfig(); // #2 — cache hit
    expect(mockQuery).toHaveBeenCalledTimes(1);

    await invalidatePricingCache(); // wipes memCache

    await getPricingConfig(); // #3 — must hit DB again
    expect(mockQuery).toHaveBeenCalledTimes(2);
  });
});

// ─── invalidatePricingCache — with redis ─────────────────────────────────────

describe("invalidatePricingCache — with redis", () => {
  let invalidatePricingCache: () => Promise<void>;
  let mockRedis: { get: jest.Mock; set: jest.Mock; keys: jest.Mock; del: jest.Mock };

  beforeEach(() => {
    mockRedis = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue("OK"),
      keys: jest.fn().mockResolvedValue([]),
      del: jest.fn().mockResolvedValue(1),
    };
    ({ mod: { invalidatePricingCache } } = freshPricingMods(mockRedis));
  });

  test("calls redis.keys with the products: prefix", async () => {
    await invalidatePricingCache();
    expect(mockRedis.keys).toHaveBeenCalledWith("products:*");
  });

  test("calls redis.del with pricing:config when no product keys exist", async () => {
    mockRedis.keys.mockResolvedValue([]);
    await invalidatePricingCache();
    expect(mockRedis.del).toHaveBeenCalledWith("pricing:config");
  });

  test("calls redis.del with pricing:config AND all stale product cache keys", async () => {
    mockRedis.keys.mockResolvedValue(["products:list", "products:search:q=cap"]);
    await invalidatePricingCache();
    expect(mockRedis.del).toHaveBeenCalledWith(
      "pricing:config",
      "products:list",
      "products:search:q=cap"
    );
  });
});

// ─── updatePricingConfig ─────────────────────────────────────────────────────

describe("updatePricingConfig", () => {
  let getPricingConfig: () => Promise<PricingConfig>;
  let updatePricingConfig: (
    patch: {
      vatRate?: number;
      markupPercent?: number;
      exchangeRate?: number;
      exchangeNote?: string;
    },
    updatedBy: string | null
  ) => Promise<PricingConfig>;
  let mockQuery: jest.Mock;

  beforeEach(() => {
    ({ mod: { getPricingConfig, updatePricingConfig }, mockQuery } = freshPricingMods(null));
  });

  // Pull the SQL string and params from the most recent mockQuery call.
  // setClause is everything before "where id = 1" so assertions don't
  // accidentally match column names in the RETURNING clause.
  const lastCall = () => {
    const call = mockQuery.mock.calls[mockQuery.mock.calls.length - 1];
    const sql = call[0] as string;
    return {
      sql,
      setClause: sql.substring(0, sql.indexOf("where id = 1")),
      params: call[1] as unknown[],
    };
  };

  test("single-field patch (vatRate): SET clause contains only vat_rate + updated_by + updated_at", async () => {
    await updatePricingConfig({ vatRate: 0.2 }, "user-uuid");

    const { setClause, sql, params } = lastCall();
    expect(setClause).toContain("vat_rate = $1");
    expect(setClause).not.toContain("markup_percent");
    expect(setClause).not.toContain("exchange_rate");
    expect(setClause).not.toContain("exchange_note");
    expect(setClause).toContain("updated_by = $2");
    expect(setClause).toContain("updated_at = now()");
    expect(sql).toContain("where id = 1");
    expect(params).toEqual([0.2, "user-uuid"]);
  });

  test("single-field patch (markupPercent): correct positional parameter", async () => {
    await updatePricingConfig({ markupPercent: 35 }, null);

    const { setClause, params } = lastCall();
    expect(setClause).toContain("markup_percent = $1");
    expect(setClause).not.toContain("vat_rate");
    expect(setClause).toContain("updated_by = $2");
    expect(params).toEqual([35, null]);
  });

  test("full patch (all four fields): correct SET clause and parameter order", async () => {
    await updatePricingConfig(
      { vatRate: 0.2, markupPercent: 35, exchangeRate: 23.1, exchangeNote: "Rate updated" },
      "admin-uuid"
    );

    const { sql, params } = lastCall();
    expect(sql).toContain("vat_rate = $1");
    expect(sql).toContain("markup_percent = $2");
    expect(sql).toContain("exchange_rate = $3");
    expect(sql).toContain("exchange_note = $4");
    expect(sql).toContain("updated_by = $5");
    expect(sql).toContain("updated_at = now()");
    expect(params).toEqual([0.2, 35, 23.1, "Rate updated", "admin-uuid"]);
  });

  test("exchangeNote patch without other fields: only note + updated_by in SET clause", async () => {
    await updatePricingConfig({ exchangeNote: "Manual update" }, "admin-uuid");

    const { setClause, params } = lastCall();
    expect(setClause).toContain("exchange_note = $1");
    expect(setClause).not.toContain("vat_rate =");
    expect(setClause).not.toContain("markup_percent =");
    expect(setClause).not.toContain("exchange_rate =");
    expect(params[0]).toBe("Manual update");
  });

  test("returns the mapped config from the UPDATE RETURNING row", async () => {
    mockQuery.mockResolvedValue({
      rows: [makeDbRow({ vat_rate: "0.20", markup_percent: "35", exchange_rate: "23.1" })],
    });

    const result = await updatePricingConfig({ vatRate: 0.2 }, null);
    expect(result.vatRate).toBe(0.2);
    expect(result.markupPercent).toBe(35);
    expect(result.exchangeRate).toBe(23.1);
  });

  test("invalidates memCache: next getPricingConfig hits pool.query again", async () => {
    // Populate the cache via getPricingConfig (call #1 = SELECT)
    await getPricingConfig();
    await getPricingConfig(); // cache hit — still just 1 DB call
    expect(mockQuery).toHaveBeenCalledTimes(1);

    // Update (call #2 = UPDATE, which also invalidates cache)
    await updatePricingConfig({ vatRate: 0.18 }, null);
    expect(mockQuery).toHaveBeenCalledTimes(2);

    // getPricingConfig must re-query now that cache was cleared
    await getPricingConfig(); // call #3 = SELECT
    expect(mockQuery).toHaveBeenCalledTimes(3);
  });

  test("SQL targets WHERE id = 1", async () => {
    await updatePricingConfig({ vatRate: 0.15 }, null);

    const { sql } = lastCall();
    expect(sql).toContain("where id = 1");
  });

  test("SQL includes RETURNING clause", async () => {
    await updatePricingConfig({ exchangeRate: 22.5 }, null);

    const { sql } = lastCall();
    expect(sql.toLowerCase()).toContain("returning");
  });
});
