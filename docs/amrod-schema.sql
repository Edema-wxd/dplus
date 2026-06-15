-- Amrod catalogue integration schema (Neon Postgres)
-- Hybrid design: extracted columns for querying/joins, raw JSONB for full fidelity.
-- Verified against live API samples (Products, Stock, Prices, Categories, Brands, BrandingPrices).

drop table if exists product_stock, product_prices, products, categories, brands,
  branding_departments, inclusive_brandings, branding_prices, colour_swatches cascade;

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

-- Category id is numeric in the API (e.g. 54686), stored as text for flexibility.
-- Categories endpoint returns a nested tree; product.categories[] entries reference these by id.
create table if not exists categories (
  id          text primary key,
  parent_id   text references categories(id) on delete set null,
  name        text not null,
  path        text,
  image_url   text,
  data        jsonb not null,
  updated_at  timestamptz not null default now()
);

-- Brands have no unique id, only a short code (e.g. "AC", "AL")
create table if not exists brands (
  code        text primary key,
  name        text not null,
  data        jsonb not null,
  updated_at  timestamptz not null default now()
);

-- Keyed on code (e.g. "BLB"), no separate id field
create table if not exists branding_departments (
  code        text primary key,
  name        text,
  data        jsonb not null,
  updated_at  timestamptz not null default now()
);

-- Keyed on inclusiveBrandingId
create table if not exists inclusive_brandings (
  id          text primary key,
  data        jsonb not null,
  updated_at  timestamptz not null default now()
);

-- Keyed on brandingCode (e.g. "EM-CLOTHING")
create table if not exists branding_prices (
  branding_code    text primary key,
  branding_method  text,
  data             jsonb not null,
  updated_at       timestamptz not null default now()
);

create table if not exists colour_swatches (
  id          text primary key,
  group_name  text,
  data        jsonb not null,
  updated_at  timestamptz not null default now()
);

-- Products are keyed on simpleCode. A product can belong to multiple categories
-- and have multiple variants (each with its own fullCode), so those stay in `data`.
create table if not exists products (
  simple_code   text primary key,
  type          text not null,            -- 'Product' | 'Giftset'
  product_name  text,
  brand_code    text,
  data          jsonb not null,           -- full product record incl. variants/branding/components
  is_active     boolean not null default true,
  last_synced_at timestamptz not null default now()
);

create index if not exists idx_products_brand on products(brand_code);
create index if not exists idx_products_data_gin on products using gin (data);
create index if not exists idx_products_categories_gin on products using gin ((data -> 'categories'));

-- Stock and prices match on a Product Variant "Full Code" (per Amrod docs)
create table if not exists product_stock (
  full_code     text primary key,
  simple_code   text,
  data          jsonb not null,           -- current + incoming stock records
  updated_at    timestamptz not null default now()
);

create table if not exists product_prices (
  full_code     text primary key,
  simple_code   text,
  data          jsonb not null,           -- price tiers
  updated_at    timestamptz not null default now()
);

create index if not exists idx_stock_simple_code on product_stock(simple_code);
create index if not exists idx_prices_simple_code on product_prices(simple_code);
