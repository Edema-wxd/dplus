import { pool } from "@/lib/db";
import { calcPrice, getPricingConfig } from "@/lib/pricing";

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

function pickImage(images: ProductRow["images"]): string | null {
  if (!images || !images.length) return null;
  const defaultImg = images.find((img) => img.isDefault) ?? images[0];
  return defaultImg?.urls?.[0]?.url ?? null;
}

export type SortOption = "name_asc" | "price_asc" | "price_desc" | "relevance";

type ProductRowFull = ProductRow & { total_count: string; rank: string };

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
}): Promise<{ items: ProductListItem[]; hasMore: boolean; total: number }> {
  const search = q?.trim() || null;
  const effectiveSort: SortOption = search && sort === "name_asc" ? "relevance" : sort;

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
    [search, limit + 1, offset, brand || null, category || null, effectiveSort]
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

  const [{ rows: priceRows }, { rows: stockRows }] = await Promise.all([
    pool.query<{ full_code: string; price: string }>(
      `select full_code, data->>'price' as price from product_prices where simple_code = $1`,
      [simpleCode]
    ),
    pool.query<{ in_stock: boolean }>(
      `select coalesce(bool_or((data->>'stock')::numeric > 0), false) as in_stock from product_stock where simple_code = $1`,
      [simpleCode]
    ),
  ]);

  const cfg = await getPricingConfig();
  const prices: Record<string, number> = {};
  for (const r of priceRows) prices[r.full_code] = calcPrice(Number(r.price), cfg).priceNgn;

  return {
    simpleCode: row.simple_code,
    productName: row.product_name ?? "",
    description: row.data.description ?? "",
    brandCode: row.brand_code,
    brandName: row.brand_name,
    images: row.data.images ?? [],
    variants: row.data.variants ?? [],
    brandings: row.data.brandings ?? [],
    prices,
    inStock: stockRows[0]?.in_stock ?? false,
    categories: row.data.categories ?? [],
  };
}

export async function getRelatedProducts(
  simpleCode: string,
  categoryIds: string[],
  limit = 8
): Promise<ProductListItem[]> {
  if (!categoryIds.length) return [];

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
  const { rows } = await pool.query<BrandOption>(
    `select code, name from brands order by name asc`
  );
  return rows;
}

export async function getTopCategoryOptions(): Promise<CategoryOption[]> {
  const { rows } = await pool.query<CategoryOption>(
    `select id, name from categories where parent_id is null order by name asc`
  );
  return rows;
}

export { PAGE_SIZE };
