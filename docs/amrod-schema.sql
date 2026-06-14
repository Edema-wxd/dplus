-- Amrod catalogue integration schema (Neon Postgres)
-- Hybrid design: extracted columns for querying/joins, raw JSONB for full fidelity.
-- Refine extracted columns once a real Products/Stock/Prices sample is available.

create table if not exists amrod_sync_log (
  id            bigserial primary key,
  resource      text not null,            -- e.g. 'products', 'stock', 'prices', 'categories'
  sync_type     text not null,            -- 'full' | 'updated'
  started_at    timestamptz not null default now(),
  finished_at   timestamptz,
  record_count  integer,
  status        text not null default 'running', -- 'running' | 'success' | 'failed'
  error         text
);

create table if not exists categories (
  id          text primary key,           -- Amrod category Id
  parent_id   text references categories(id) on delete set null,
  name        text not null,
  image_url   text,
  data        jsonb not null,             -- full raw record
  updated_at  timestamptz not null default now()
);

create table if not exists brands (
  id          text primary key,
  name        text not null,
  data        jsonb not null,
  updated_at  timestamptz not null default now()
);

create table if not exists branding_departments (
  id          text primary key,
  name        text,
  data        jsonb not null,
  updated_at  timestamptz not null default now()
);

create table if not exists inclusive_brandings (
  id          text primary key,
  data        jsonb not null,
  updated_at  timestamptz not null default now()
);

create table if not exists branding_prices (
  branding_code    text primary key,
  branding_method  text,
  data             jsonb not null,        -- full record incl. pricing tiers array
  updated_at       timestamptz not null default now()
);

create table if not exists colour_swatches (
  id          text primary key,
  group_name  text,
  data        jsonb not null,
  updated_at  timestamptz not null default now()
);

create table if not exists products (
  id            text primary key,         -- Amrod product Id
  type          text not null,            -- 'Product' | 'Giftset'
  code          text,                     -- simple code, if applicable
  name          text,
  category_id   text references categories(id) on delete set null,
  brand_id      text references brands(id) on delete set null,
  data          jsonb not null,           -- full product record incl. branding/components
  is_active     boolean not null default true,
  last_synced_at timestamptz not null default now()
);

create index if not exists idx_products_category on products(category_id);
create index if not exists idx_products_brand on products(brand_id);
create index if not exists idx_products_data_gin on products using gin (data);

-- Stock and prices match on a Product Variant "Full Code" (per Amrod docs)
create table if not exists product_stock (
  full_code     text primary key,
  product_id    text references products(id) on delete cascade,
  data          jsonb not null,           -- current + incoming stock records
  updated_at    timestamptz not null default now()
);

create table if not exists product_prices (
  full_code     text primary key,
  product_id    text references products(id) on delete cascade,
  data          jsonb not null,           -- price tiers
  updated_at    timestamptz not null default now()
);

create index if not exists idx_stock_product on product_stock(product_id);
create index if not exists idx_prices_product on product_prices(product_id);
