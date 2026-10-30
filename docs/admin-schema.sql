-- Admin auth schema

create table if not exists admin_users (
  -- gen_random_uuid() is only built in from Postgres 13; the shared server
  -- runs 10 and can't install pgcrypto, so build a random UUID by hand.
  id            uuid primary key default md5(random()::text || clock_timestamp()::text)::uuid,
  email         text not null unique,
  password_hash text not null,
  name          text,
  created_at    timestamptz not null default now()
);
