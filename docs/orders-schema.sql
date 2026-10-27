-- Customer orders placed via the product catalogue / basket.

create table if not exists orders (
  id            bigserial primary key,
  customer_name  text not null,
  customer_email text not null,
  customer_phone text,
  notes          text,
  items          jsonb not null,   -- array of { simpleCode, fullCode, productName, image, variantLabel, brandingLabel, quantity, price, brandings?, artwork?, note? }
  total          numeric not null default 0,
  status         text not null default 'new', -- 'new' | 'reviewing' | 'confirmed' | 'ordered' (placed with Amrod) | 'cancelled'
  created_at     timestamptz not null default now()
);

create index if not exists idx_orders_created_at on orders(created_at desc);
