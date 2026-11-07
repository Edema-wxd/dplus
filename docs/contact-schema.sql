-- Contact form and newsletter schema (Postgres)
-- Written to by /api/contact on every contact-form submission; read by the
-- admin dashboard and the Contacts page (/admin/contacts).

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

-- Written to by /api/newsletter from the footer sign-up form; the admin
-- Contacts page lists subscribers alongside enquiries and orders.
create table if not exists newsletter_subscribers (
  email          text        primary key,
  subscribed_at  timestamptz not null default now()
);
