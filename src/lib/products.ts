import { pool } from "@/lib/db";

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

export async function getProducts({
  q,
  brand,
  category,
  offset = 0,
  limit = PAGE_SIZE,
}: {
  q?: string;
  brand?: string;
  category?: string;
  offset?: number;
  limit?: number;
}): Promise<{ items: ProductListItem[]; hasMore: boolean }> {
  const search = q?.trim();

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
      and (
        $1::text is null
        or p.product_name ilike '%' || $1 || '%'
        or p.brand_code ilike '%' || $1 || '%'
        or b.name ilike '%' || $1 || '%'
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
    order by p.product_name asc, p.simple_code asc
    limit $2 offset $3
    `,
    [search || null, limit + 1, offset, brand || null, category || null]
  );

  const hasMore = rows.length > limit;
  const items: ProductListItem[] = rows.slice(0, limit).map((row) => ({
    simpleCode: row.simple_code,
    productName: row.product_name ?? "",
    brandCode: row.brand_code,
    brandName: row.brand_name,
    image: pickImage(row.images),
    price: row.price ? Number(row.price) : null,
  }));

  return { items, hasMore };
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
