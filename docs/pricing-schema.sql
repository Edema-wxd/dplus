-- Pricing pipeline config (Neon Postgres)
-- Single-row config table controlling VAT, markup, and ZAR->NGN exchange rate.

create table if not exists pricing_config (
  id               integer primary key default 1,
  vat_rate         numeric(5,4)  not null default 0.15,
  markup_percent   numeric(8,4)  not null default 30.0,
  exchange_rate    numeric(12,6) not null,
  exchange_note    text,
  updated_at       timestamptz   not null default now(),
  updated_by       uuid references admin_users(id),
  constraint single_row check (id = 1)
);

insert into pricing_config (id, vat_rate, markup_percent, exchange_rate)
values (1, 0.15, 30.0, 22.5)
on conflict (id) do nothing;
