-- Hampers schema (Neon Postgres)
-- Each row is one indexable page at /hampers/<slug>. Images live in UploadThing.
-- Hampers are an enquiry product: no prices, no basket. Every page routes to
-- the contact form.

create table if not exists hampers (
  id               bigserial primary key,
  slug             text not null unique,          -- the URL; changing it breaks links
  name             text not null,
  tagline          text,                          -- one line under the name
  description      text,                          -- the body copy search engines read
  lead_time_days   integer,
  page_ratio       numeric not null default 1.414, -- printed trim, width / height
  contents         jsonb not null default '[]',   -- [{ item, note }]
  pages            jsonb not null default '[]',   -- [{ url, key, alt }] in reading order
  pdf_url          text,                          -- the version people download
  pdf_key          text,
  pdf_size_bytes   bigint,
  pdf_page_count   integer,                       -- read from the PDF itself
  faqs             jsonb not null default '[]',   -- [{ question, answer }] → FAQ rich result
  occasions        text[] not null default '{}',  -- christmas, onboarding, appreciation…
  meta_title       text,                          -- overrides the generated <title>
  meta_description text,
  is_published     boolean not null default false,
  sort_order       integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists hampers_is_published_idx on hampers (is_published);
create index if not exists hampers_sort_order_idx on hampers (sort_order, created_at desc);
create index if not exists hampers_occasions_idx on hampers using gin (occasions);
