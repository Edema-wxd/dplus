import { pool } from "@/lib/db";
import { redis } from "@/lib/redis";

const CACHE_KEY = "pricing:config";
const PRODUCT_CACHE_PREFIX = "products:";

export type PricingConfig = {
  vatRate: number;
  markupPercent: number;
  exchangeRate: number;
  exchangeNote: string | null;
  updatedAt: string;
  updatedBy: string | null;
};

export type PriceBreakdown = {
  rawZar: number;
  zarIncVat: number;
  zarFinal: number;
  priceNgn: number;
};

type PricingConfigRow = {
  vat_rate: string;
  markup_percent: string;
  exchange_rate: string;
  exchange_note: string | null;
  updated_at: string;
  updated_by: string | null;
};

function mapConfig(row: PricingConfigRow): PricingConfig {
  return {
    vatRate: Number(row.vat_rate),
    markupPercent: Number(row.markup_percent),
    exchangeRate: Number(row.exchange_rate),
    exchangeNote: row.exchange_note,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
  };
}

const CACHE_TTL_SECONDS = 5 * 60;

// Fallback used when Redis isn't configured (e.g. local dev).
let memCache: { config: PricingConfig; expiresAt: number } | null = null;

export async function getPricingConfig(): Promise<PricingConfig> {
  if (redis) {
    const cached = await redis.get<PricingConfig>(CACHE_KEY);
    if (cached) return cached;
  } else if (memCache && memCache.expiresAt > Date.now()) {
    return memCache.config;
  }

  const { rows } = await pool.query<PricingConfigRow>(
    `select vat_rate, markup_percent, exchange_rate, exchange_note, updated_at, updated_by
     from pricing_config where id = 1`
  );

  const config = mapConfig(rows[0]);

  if (redis) {
    await redis.set(CACHE_KEY, config, { ex: CACHE_TTL_SECONDS });
  } else {
    memCache = { config, expiresAt: Date.now() + CACHE_TTL_SECONDS * 1000 };
  }

  return config;
}

export async function invalidatePricingCache() {
  memCache = null;
  if (!redis) return;

  const keys = await redis.keys(`${PRODUCT_CACHE_PREFIX}*`);
  await redis.del(CACHE_KEY, ...keys);
}

export async function updatePricingConfig(
  patch: { vatRate?: number; markupPercent?: number; exchangeRate?: number; exchangeNote?: string },
  updatedBy: string | null
): Promise<PricingConfig> {
  const sets: string[] = [];
  const values: unknown[] = [];

  if (patch.vatRate !== undefined) {
    values.push(patch.vatRate);
    sets.push(`vat_rate = $${values.length}`);
  }
  if (patch.markupPercent !== undefined) {
    values.push(patch.markupPercent);
    sets.push(`markup_percent = $${values.length}`);
  }
  if (patch.exchangeRate !== undefined) {
    values.push(patch.exchangeRate);
    sets.push(`exchange_rate = $${values.length}`);
  }
  if (patch.exchangeNote !== undefined) {
    values.push(patch.exchangeNote);
    sets.push(`exchange_note = $${values.length}`);
  }

  values.push(updatedBy);
  sets.push(`updated_by = $${values.length}`);
  sets.push(`updated_at = now()`);

  const { rows } = await pool.query<PricingConfigRow>(
    `update pricing_config set ${sets.join(", ")} where id = 1
     returning vat_rate, markup_percent, exchange_rate, exchange_note, updated_at, updated_by`,
    values
  );

  await invalidatePricingCache();
  return mapConfig(rows[0]);
}

export function calcPrice(
  rawZarExVat: number,
  cfg: { vatRate: number; markupPercent: number; exchangeRate: number }
): PriceBreakdown {
  const rawZar = Math.round(rawZarExVat * 100) / 100;
  const zarIncVat = Math.round(rawZar * (1 + cfg.vatRate) * 100) / 100;
  const zarFinal = Math.round(zarIncVat * (1 + cfg.markupPercent / 100) * 100) / 100;
  const priceNgn = Math.round(zarFinal * cfg.exchangeRate * 100) / 100;
  return { rawZar, zarIncVat, zarFinal, priceNgn };
}

export type PricingPreview = {
  inputs: { vatRate: number; markupPercent: number; exchangeRate: number };
  impact: {
    totalVariants: number;
    minPriceNgn: number;
    maxPriceNgn: number;
    avgPriceNgn: number;
    sampleProducts: { fullCode: string; currentNgn: number; newNgn: number; changePct: number }[];
  };
};

export async function getPricingPreview(overrides: {
  vatRate?: number;
  markupPercent?: number;
  exchangeRate?: number;
}): Promise<PricingPreview> {
  const current = await getPricingConfig();
  const inputs = {
    vatRate: overrides.vatRate ?? current.vatRate,
    markupPercent: overrides.markupPercent ?? current.markupPercent,
    exchangeRate: overrides.exchangeRate ?? current.exchangeRate,
  };

  const { rows: statsRows } = await pool.query<{
    total: string;
    min_ngn: string | null;
    max_ngn: string | null;
    avg_ngn: string | null;
  }>(
    `
    with calc as (
      select
        round(
          round(round((pp.data->>'price')::numeric, 2) * (1 + $1), 2)
          * (1 + $2 / 100)
          * $3,
        2) as new_ngn
      from product_prices pp
      where (pp.data->>'price') is not null
    )
    select count(*) as total, min(new_ngn) as min_ngn, max(new_ngn) as max_ngn, avg(new_ngn) as avg_ngn
    from calc
    `,
    [inputs.vatRate, inputs.markupPercent, inputs.exchangeRate]
  );

  const { rows: sampleRows } = await pool.query<{
    full_code: string;
    raw_zar: string;
  }>(
    `
    select pp.full_code, (pp.data->>'price')::numeric as raw_zar
    from product_prices pp
    where (pp.data->>'price') is not null
    order by pp.full_code asc
    limit 5
    `
  );

  const sampleProducts = sampleRows.map((row) => {
    const rawZar = Number(row.raw_zar);
    const currentNgn = calcPrice(rawZar, current).priceNgn;
    const newNgn = calcPrice(rawZar, inputs).priceNgn;
    const changePct = currentNgn !== 0 ? Math.round(((newNgn - currentNgn) / currentNgn) * 10000) / 100 : 0;
    return { fullCode: row.full_code, currentNgn, newNgn, changePct };
  });

  const stats = statsRows[0];

  return {
    inputs,
    impact: {
      totalVariants: Number(stats.total),
      minPriceNgn: stats.min_ngn ? Number(stats.min_ngn) : 0,
      maxPriceNgn: stats.max_ngn ? Number(stats.max_ngn) : 0,
      avgPriceNgn: stats.avg_ngn ? Math.round(Number(stats.avg_ngn) * 100) / 100 : 0,
      sampleProducts,
    },
  };
}
