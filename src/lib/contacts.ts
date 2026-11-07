import { pool } from "@/lib/db";

// Reads for the admin Contacts page. Enquiries come from the contact form
// (contact_submissions); people are everyone who has reached us through any
// form, one row per email address.

export type Enquiry = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  message: string;
  details: Record<string, unknown> | null;
  createdAt: Date;
};

export type Person = {
  email: string;
  name: string | null;
  phone: string | null;
  company: string | null;
  enquiries: number;
  orders: number;
  subscribed: boolean;
  firstSeen: Date;
  lastSeen: Date;
};

type Page<T> = { rows: T[]; total: number };

type ListOptions = { search?: string; limit: number; offset: number };

/** `%term%` for ILIKE, with the user's own % and _ matched literally. */
function likePattern(search: string): string {
  return `%${search.replace(/[\\%_]/g, "\\$&")}%`;
}

export async function listEnquiries({ search = "", limit, offset }: ListOptions): Promise<Page<Enquiry>> {
  const { rows } = await pool.query<Enquiry & { total: string }>(
    `select id, name, email, phone, company, message, details,
            created_at as "createdAt", count(*) over () as total
     from contact_submissions
     where $1 = '' or name ilike $2 or email ilike $2 or company ilike $2
        or phone ilike $2 or message ilike $2
     order by created_at desc
     limit $3 offset $4`,
    [search, likePattern(search), limit, offset]
  );
  return { rows, total: rows.length ? Number(rows[0].total) : 0 };
}

export async function listPeople({ search = "", limit, offset }: ListOptions): Promise<Page<Person>> {
  // The newest name, phone and company win: people correct their details.
  const { rows } = await pool.query<Person & { total: string }>(
    `with touches as (
       select lower(email) as email, name, phone, company, created_at, 'enquiry' as kind
       from contact_submissions
       union all
       select lower(customer_email), customer_name, customer_phone, null, created_at, 'order'
       from orders
       union all
       select lower(email), null, null, null, subscribed_at, 'newsletter'
       from newsletter_subscribers
     ), people as (
       select email,
              (array_agg(name order by created_at desc) filter (where name <> ''))[1] as name,
              (array_agg(phone order by created_at desc) filter (where phone <> ''))[1] as phone,
              (array_agg(company order by created_at desc) filter (where company <> ''))[1] as company,
              count(*) filter (where kind = 'enquiry')::int as enquiries,
              count(*) filter (where kind = 'order')::int as orders,
              bool_or(kind = 'newsletter') as subscribed,
              min(created_at) as "firstSeen",
              max(created_at) as "lastSeen"
       from touches
       group by email
     )
     select *, count(*) over () as total
     from people
     where $1 = '' or email ilike $2 or name ilike $2 or company ilike $2 or phone ilike $2
     order by "lastSeen" desc
     limit $3 offset $4`,
    [search, likePattern(search), limit, offset]
  );
  return { rows, total: rows.length ? Number(rows[0].total) : 0 };
}
