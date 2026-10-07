-- Contact form schema (Neon Postgres)
-- Written to by /api/contact on every contact-form submission; read by the
-- admin dashboard's "Recent enquiries" card.

create table if not exists contact_submissions (
  id         serial primary key,
  name       text not null,
  email      text not null,
  phone      text,
  company    text,
  message    text not null,
  details    jsonb,                             -- extra fields the form collects
  created_at timestamptz not null default now()
);

-- The dashboard reads the newest submissions first.
create index if not exists contact_submissions_created_at_idx
  on contact_submissions (created_at desc);
