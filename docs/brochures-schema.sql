-- Brochures schema (Neon Postgres)
-- Page images and the PDF live in UploadThing; this table holds the ordering,
-- the copy, and the UploadThing keys so files can be deleted when a row is.

create table if not exists brochures (
  id             bigserial primary key,
  slug           text not null unique,
  name           text not null,                 -- "Corporate Christmas"
  edition        text,                          -- "Two thousand and twenty-six"
  description    text,
  page_ratio     numeric not null default 1.414, -- printed trim, width / height
  pages          jsonb not null default '[]',   -- [{ url, key, alt }] in reading order
  pdf_url        text,
  pdf_key        text,
  pdf_size_bytes bigint,
  pdf_page_count integer,                       -- read from the PDF, not from pages
  is_published   boolean not null default false,
  sort_order     integer not null default 0,    -- lower sorts first
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists brochures_is_published_idx on brochures (is_published);
create index if not exists brochures_sort_order_idx on brochures (sort_order, created_at desc);
