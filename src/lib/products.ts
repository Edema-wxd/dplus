import { pool } from "@/lib/db";
import { cached, invalidateCachePrefix, PRODUCT_CACHE_PREFIX } from "@/lib/cache";
import { calcPrice, getPricingConfig } from "@/lib/pricing";
import type { BrandingPriceBreak } from "@/lib/branding-pricing";

export type ProductListItem = {
  simpleCode: string;
  productName: string;
  brandCode: string | null;
  brandName: string | null;
  image: string | null;
  price: number | null;
};

export type BrandOption = { code: string; name: string };
export type CategoryOption = { id: string; name: string };

type ProductRow = {
  simple_code: string;
  product_name: string | null;
  brand_code: string | null;
  brand_name: string | null;
  images: { urls?: { url: string }[]; isDefault?: boolean }[] | null;
  price: string | null;
};

const PAGE_SIZE = 24;

/**
 * The catalogue only changes when the Amrod sync runs or pricing is edited, and
 * both invalidate this cache, so the TTL is just a backstop.
 */
const CACHE_TTL_SECONDS = 24 * 60 * 60;

/** Clears cached catalogue reads; call after a sync or a pricing change. */
export async function invalidateProductCache() {
  await invalidateCachePrefix(PRODUCT_CACHE_PREFIX);
}

function pickImage(images: ProductRow["images"]): string | null {
  if (!images || !images.length) return null;
  const defaultImg = images.find((img) => img.isDefault) ?? images[0];
  return defaultImg?.urls?.[0]?.url ?? null;
}

export type SortOption = "name_asc" | "price_asc" | "price_desc" | "relevance";

type ProductRowFull = ProductRow & { total_count: string; rank: string };

type ProductPage = { items: ProductListItem[]; hasMore: boolean; total: number };

export async function getProducts({
  q,
  brand,
  category,
  sort = "name_asc",
  offset = 0,
  limit = PAGE_SIZE,
}: {
  q?: string;
  brand?: string;
  category?: string;
  sort?: SortOption;
  offset?: number;
  limit?: number;
}): Promise<ProductPage> {
  const search = q?.trim().toLowerCase() || null;
  const effectiveSort: SortOption = search && sort === "name_asc" ? "relevance" : sort;
  const key = `${PRODUCT_CACHE_PREFIX}list:${JSON.stringify([
    search,
    brand || null,
    category || null,
    effectiveSort,
    offset,
    limit,
  ])}`;

  return cached(key, CACHE_TTL_SECONDS, () =>
    queryProducts(search, brand || null, category || null, effectiveSort, offset, limit)
  );
}

async function queryProducts(
  search: string | null,
  brand: string | null,
  category: string | null,
  effectiveSort: SortOption,
  offset: number,
  limit: number
): Promise<ProductPage> {
  const { rows } = await pool.query<ProductRowFull>(
    `
    with prices as (
      select simple_code, min((data->>'price')::numeric) as min_price
      from product_prices
      group by simple_code
    ),
    deduped as (
      select distinct on (p.simple_code)
        p.simple_code,
        p.product_name,
        p.brand_code,
        b.name as brand_name,
        p.data -> 'images' as images,
        pr.min_price as price
      from products p
      left join brands b on b.code = p.brand_code
      left join prices pr on pr.simple_code = p.simple_code
      where p.is_active = true
        and (
          $1::text is null
          or to_tsvector('english',
              coalesce(p.product_name, '') || ' ' ||
              coalesce(p.brand_code, '') || ' ' ||
              coalesce(b.name, '') || ' ' ||
              coalesce(p.simple_code, '')
             ) @@ plainto_tsquery('english', $1)
          or p.product_name ilike '%' || $1 || '%'
          or b.name ilike '%' || $1 || '%'
          or p.simple_code ilike '%' || $1 || '%'
        )
        and ($4::text is null or p.brand_code = $4)
        and (
          $5::text is null
          or exists (
            select 1
            from jsonb_array_elements(p.data -> 'categories') as pc
            where (pc ->> 'id') in (
              select c.id from categories c, categories root
              where root.id = $5
                and (c.id = root.id or lower(c.path) like lower(root.path) || '/%')
            )
          )
        )
      order by p.simple_code
    )
    select
      d.*,
      count(*) over() as total_count,
      case when $1::text is not null
        then ts_rank(
          to_tsvector('english',
            coalesce(d.product_name, '') || ' ' ||
            coalesce(d.brand_code, '') || ' ' ||
            coalesce(d.simple_code, '')
          ),
          plainto_tsquery('english', $1)
        )
        else 0
      end as rank
    from deduped d
    order by
      case when $6 = 'relevance' then
        ts_rank(
          to_tsvector('english',
            coalesce(d.product_name, '') || ' ' ||
            coalesce(d.brand_code, '') || ' ' ||
            coalesce(d.simple_code, '')
          ),
          case when $1::text is not null then plainto_tsquery('english', $1)
               else to_tsquery('english', 'a') end
        )
      end desc nulls last,
      case when $6 = 'price_asc' then d.price end asc nulls last,
      case when $6 = 'price_desc' then d.price end desc nulls last,
      d.product_name asc,
      d.simple_code asc
    limit $2 offset $3
    `,
    [search, limit + 1, offset, brand, category, effectiveSort]
  );

  const hasMore = rows.length > limit;
  const total = rows.length ? Number(rows[0].total_count) : 0;
  const cfg = await getPricingConfig();
  const items: ProductListItem[] = rows.slice(0, limit).map((row) => ({
    simpleCode: row.simple_code,
    productName: row.product_name ?? "",
    brandCode: row.brand_code,
    brandName: row.brand_name,
    image: pickImage(row.images),
    price: row.price ? calcPrice(Number(row.price), cfg).priceNgn : null,
  }));

  return { items, hasMore, total };
}

export type ProductImage = {
  name: string;
  type: string;
  urls: { url: string; width: number; height: number }[];
  hasLogo: boolean;
  isDefault: boolean;
};

export type ProductVariant = {
  fullCode: string;
  codeColour: string | null;
  codeColourName: string | null;
  codeSize: string | null;
  codeSizeName: string | null;
};

export type ProductBrandingMethod = {
  brandingCode: string;
  brandingName: string;
  numberOfColours?: string;
};

export type ProductBranding = {
  positionCode: string;
  positionName: string;
  method: ProductBrandingMethod[];
};

export type ProductCategory = { id: string; name: string };

export type ProductDetail = {
  simpleCode: string;
  productName: string;
  description: string;
  brandCode: string | null;
  brandName: string | null;
  images: ProductImage[];
  variants: ProductVariant[];
  brandings: ProductBranding[];
  prices: Record<string, number>;
  /** Units in stock per variant full code. */
  stock: Record<string, number>;
  /** Hex colour per variant colour code, from Amrod's colour swatches. */
  swatches: Record<string, string>;
  /** NGN price breaks per branding code used by this product. */
  brandingPrices: Record<string, BrandingPriceBreak[]>;
  inStock: boolean;
  categories: ProductCategory[];
};

type ProductDetailRow = {
  simple_code: string;
  product_name: string | null;
  brand_code: string | null;
  brand_name: string | null;
  data: {
    description?: string;
    images?: ProductImage[];
    variants?: ProductVariant[];
    brandings?: ProductBranding[];
    categories?: ProductCategory[];
  };
};

export async function getProductDetail(simpleCode: string): Promise<ProductDetail | null> {
  // v2: added stock, swatches and branding prices to the cached shape.
  return cached(`${PRODUCT_CACHE_PREFIX}detail:v2:${simpleCode}`, CACHE_TTL_SECONDS, () =>
    queryProductDetail(simpleCode)
  );
}

async function queryProductDetail(simpleCode: string): Promise<ProductDetail | null> {
  const { rows } = await pool.query<ProductDetailRow>(
    `
    select p.simple_code, p.product_name, p.brand_code, b.name as brand_name, p.data
    from products p
    left join brands b on b.code = p.brand_code
    where p.simple_code = $1 and p.is_active = true
    `,
    [simpleCode]
  );

  if (!rows.length) return null;
  const row = rows[0];

  const variants = row.data.variants ?? [];
  const brandings = row.data.brandings ?? [];
  const brandingCodes = [
    ...new Set(brandings.flatMap((b) => (b.method ?? []).map((m) => m.brandingCode))),
  ];

  const [{ rows: priceRows }, { rows: stockRows }, { rows: brandingRows }, swatchIndex] =
    await Promise.all([
      pool.query<{ full_code: string; price: string }>(
        `select full_code, data->>'price' as price from product_prices where simple_code = $1`,
        [simpleCode]
      ),
      pool.query<{ full_code: string; stock: string | null }>(
        `select full_code, data->>'stock' as stock from product_stock where simple_code = $1`,
        [simpleCode]
      ),
      brandingCodes.length
        ? pool.query<{ branding_code: string; data: { data?: BrandingPriceBreak[] } }>(
            `select branding_code, data from branding_prices where branding_code = any($1::text[])`,
            [brandingCodes]
          )
        : Promise.resolve({ rows: [] }),
      getSwatchIndex(),
    ]);

  const cfg = await getPricingConfig();
  const ngn = (zar: number) => calcPrice(zar, cfg).priceNgn;

  const prices: Record<string, number> = {};
  for (const r of priceRows) prices[r.full_code] = ngn(Number(r.price));

  const stock: Record<string, number> = {};
  for (const r of stockRows) stock[r.full_code] = Math.max(0, Number(r.stock) || 0);

  const brandingPrices: Record<string, BrandingPriceBreak[]> = {};
  for (const r of brandingRows) {
    brandingPrices[r.branding_code] = (r.data.data ?? []).map((b) => ({
      minQuantity: Number(b.minQuantity) || 1,
      maxQuantity: Number(b.maxQuantity) || -1,
      numberOfColours: Number(b.numberOfColours) || -1,
      setup: ngn(Number(b.setup) || 0),
      price: ngn(Number(b.price) || 0),
    }));
  }

  const swatches: Record<string, string> = {};
  for (const v of variants) {
    if (!v.codeColour || swatches[v.codeColour]) continue;
    const hex =
      swatchIndex[v.codeColour.toUpperCase()] ??
      (v.codeColourName ? swatchIndex[v.codeColourName.toUpperCase()] : undefined);
    if (hex) swatches[v.codeColour] = hex;
  }

  return {
    simpleCode: row.simple_code,
    productName: row.product_name ?? "",
    description: row.data.description ?? "",
    brandCode: row.brand_code,
    brandName: row.brand_name,
    images: row.data.images ?? [],
    variants,
    brandings,
    prices,
    stock,
    swatches,
    brandingPrices,
    inStock: Object.values(stock).some((n) => n > 0),
    categories: row.data.categories ?? [],
  };
}

const HEX_RE = /^#?[0-9a-f]{6}$/i;

/** First hex colour found in a swatch record, whatever Amrod names the field. */
function findHex(value: unknown, depth = 0): string | null {
  if (typeof value === "string") {
    return HEX_RE.test(value.trim()) ? `#${value.trim().replace(/^#/, "")}` : null;
  }
  if (depth > 3 || value === null || typeof value !== "object") return null;
  for (const v of Object.values(value)) {
    const hex = findHex(v, depth + 1);
    if (hex) return hex;
  }
  return null;
}

/** Colour code and colour name (upper-cased) -> hex, across all Amrod swatches. */
async function getSwatchIndex(): Promise<Record<string, string>> {
  return cached(`${PRODUCT_CACHE_PREFIX}swatches`, CACHE_TTL_SECONDS, async () => {
    const { rows } = await pool.query<{ id: string; data: Record<string, unknown> }>(
      `select id, data from colour_swatches`
    );
    const index: Record<string, string> = {};
    for (const r of rows) {
      const hex = findHex(r.data);
      if (!hex) continue;
      for (const key of [r.id, r.data.code, r.data.name]) {
        if (typeof key === "string" && key) index[key.toUpperCase()] = hex;
      }
    }
    return index;
  });
}

export async function getRelatedProducts(
  simpleCode: string,
  categoryIds: string[],
  limit = 8
): Promise<ProductListItem[]> {
  if (!categoryIds.length) return [];

  return cached(`${PRODUCT_CACHE_PREFIX}related:${simpleCode}:${limit}`, CACHE_TTL_SECONDS, () =>
    queryRelatedProducts(simpleCode, categoryIds, limit)
  );
}

async function queryRelatedProducts(
  simpleCode: string,
  categoryIds: string[],
  limit: number
): Promise<ProductListItem[]> {
  const { rows } = await pool.query<ProductRow>(
    `
    select
      p.simple_code,
      p.product_name,
      p.brand_code,
      b.name as brand_name,
      p.data -> 'images' as images,
      (select min((pp.data->>'price')::numeric) from product_prices pp where pp.simple_code = p.simple_code) as price
    from products p
    left join brands b on b.code = p.brand_code
    where p.is_active = true
      and p.simple_code <> $1
      and exists (
        select 1 from jsonb_array_elements(p.data -> 'categories') as pc
        where (pc ->> 'id') = any($2::text[])
      )
    order by p.product_name asc
    limit $3
    `,
    [simpleCode, categoryIds, limit]
  );

  const cfg = await getPricingConfig();
  return rows.map((row) => ({
    simpleCode: row.simple_code,
    productName: row.product_name ?? "",
    brandCode: row.brand_code,
    brandName: row.brand_name,
    image: pickImage(row.images),
    price: row.price ? calcPrice(Number(row.price), cfg).priceNgn : null,
  }));
}

export async function getBrandOptions(): Promise<BrandOption[]> {
  return cached(`${PRODUCT_CACHE_PREFIX}brands`, CACHE_TTL_SECONDS, async () => {
    const { rows } = await pool.query<BrandOption>(
      `select code, name from brands order by name asc`
    );
    return rows;
  });
}

export async function getTopCategoryOptions(): Promise<CategoryOption[]> {
  return cached(`${PRODUCT_CACHE_PREFIX}categories`, CACHE_TTL_SECONDS, async () => {
    const { rows } = await pool.query<CategoryOption>(
      `select id, name from categories where parent_id is null order by name asc`
    );
    return rows;
  });
}

export { PAGE_SIZE };
