-- Portfolio schema (Neon Postgres)

create table if not exists portfolio_items (
  id           bigserial primary key,
  title        text not null,
  client       text,
  description  text,
  tags         text[] not null default '{}',
  images       jsonb not null default '[]',  -- [{ url, alt, isMain }]
  is_published boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists portfolio_items_is_published_idx on portfolio_items (is_published);
