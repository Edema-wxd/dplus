import { pool } from "@/lib/db";

export type HamperPage = { url: string; key: string; alt: string };
export type HamperContent = { item: string; note?: string };
export type HamperFaq = { question: string; answer: string };

export type Hamper = {
  id: number;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  leadTimeDays: number | null;
  pageRatio: number;
  contents: HamperContent[];
  pages: HamperPage[];
  pdfUrl: string | null;
  pdfKey: string | null;
  pdfSizeBytes: number | null;
  pdfPageCount: number | null;
  faqs: HamperFaq[];
  occasions: string[];
  metaTitle: string | null;
  metaDescription: string | null;
  isPublished: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

type HamperRow = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  lead_time_days: number | null;
  page_ratio: string;
  contents: HamperContent[];
  pages: HamperPage[];
  pdf_url: string | null;
  pdf_key: string | null;
  pdf_size_bytes: string | null;
  pdf_page_count: number | null;
  faqs: HamperFaq[];
  occasions: string[];
  meta_title: string | null;
  meta_description: string | null;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

const COLUMNS = `id, slug, name, tagline, description, lead_time_days,
  page_ratio, contents, pages, pdf_url, pdf_key, pdf_size_bytes,
  pdf_page_count, faqs, occasions, meta_title, meta_description,
  is_published, sort_order, created_at, updated_at`;

function rowToHamper(row: HamperRow): Hamper {
  return {
    id: Number(row.id),
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    description: row.description,
    leadTimeDays: row.lead_time_days,
    pageRatio: Number(row.page_ratio),
    contents: row.contents ?? [],
    pages: row.pages ?? [],
    pdfUrl: row.pdf_url,
    pdfKey: row.pdf_key,
    pdfSizeBytes:
      row.pdf_size_bytes === null ? null : Number(row.pdf_size_bytes),
    pdfPageCount: row.pdf_page_count,
    faqs: row.faqs ?? [],
    occasions: row.occasions ?? [],
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    isPublished: row.is_published,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function formatBytes(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function slugifyHamper(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function getHampers({
  includeUnpublished = false,
}: { includeUnpublished?: boolean } = {}): Promise<Hamper[]> {
  const { rows } = await pool.query<HamperRow>(
    `select ${COLUMNS} from hampers
     ${includeUnpublished ? "" : "where is_published = true"}
     order by sort_order asc, created_at desc`
  );
  return rows.map(rowToHamper);
}

export async function getPublishedHampers(): Promise<Hamper[]> {
  return getHampers({ includeUnpublished: false });
}

export async function getHamperBySlug(slug: string): Promise<Hamper | null> {
  const { rows } = await pool.query<HamperRow>(
    `select ${COLUMNS} from hampers where slug = $1 and is_published = true`,
    [slug]
  );
  return rows.length ? rowToHamper(rows[0]) : null;
}

export async function getHamperById(id: number): Promise<Hamper | null> {
  const { rows } = await pool.query<HamperRow>(
    `select ${COLUMNS} from hampers where id = $1`,
    [id]
  );
  return rows.length ? rowToHamper(rows[0]) : null;
}

/** Other hampers to link to from a hamper page, nearest occasion first. */
export async function getRelatedHampers(
  slug: string,
  occasions: string[],
  limit = 3
): Promise<Hamper[]> {
  const { rows } = await pool.query<HamperRow>(
    `select ${COLUMNS} from hampers
     where is_published = true and slug <> $1
     order by (occasions && $2::text[]) desc, sort_order asc, created_at desc
     limit $3`,
    [slug, occasions, limit]
  );
  return rows.map(rowToHamper);
}

export type CreateHamperInput = {
  slug: string;
  name: string;
  tagline?: string | null;
  description?: string | null;
  leadTimeDays?: number | null;
  pageRatio?: number;
  contents?: HamperContent[];
  pages?: HamperPage[];
  pdfUrl?: string | null;
  pdfKey?: string | null;
  pdfSizeBytes?: number | null;
  pdfPageCount?: number | null;
  faqs?: HamperFaq[];
  occasions?: string[];
  metaTitle?: string | null;
  metaDescription?: string | null;
  isPublished?: boolean;
  sortOrder?: number;
};

export async function createHamper(input: CreateHamperInput): Promise<Hamper> {
  const { rows } = await pool.query<HamperRow>(
    `insert into hampers
       (slug, name, tagline, description, lead_time_days, page_ratio, contents,
        pages, pdf_url, pdf_key, pdf_size_bytes, pdf_page_count, faqs,
        occasions, meta_title, meta_description, is_published, sort_order)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
     returning ${COLUMNS}`,
    [
      input.slug,
      input.name,
      input.tagline ?? null,
      input.description ?? null,
      input.leadTimeDays ?? null,
      input.pageRatio ?? 1.414,
      JSON.stringify(input.contents ?? []),
      JSON.stringify(input.pages ?? []),
      input.pdfUrl ?? null,
      input.pdfKey ?? null,
      input.pdfSizeBytes ?? null,
      input.pdfPageCount ?? null,
      JSON.stringify(input.faqs ?? []),
      input.occasions ?? [],
      input.metaTitle ?? null,
      input.metaDescription ?? null,
      input.isPublished ?? false,
      input.sortOrder ?? 0,
    ]
  );
  return rowToHamper(rows[0]);
}

export type UpdateHamperInput = Partial<CreateHamperInput>;

const PATCHABLE: Array<[keyof UpdateHamperInput, string, (v: never) => unknown]> = [
  ["slug", "slug", (v) => v],
  ["name", "name", (v) => v],
  ["tagline", "tagline", (v) => v],
  ["description", "description", (v) => v],
  ["leadTimeDays", "lead_time_days", (v) => v],
  ["pageRatio", "page_ratio", (v) => v],
  ["contents", "contents", (v) => JSON.stringify(v)],
  ["pages", "pages", (v) => JSON.stringify(v)],
  ["pdfUrl", "pdf_url", (v) => v],
  ["pdfKey", "pdf_key", (v) => v],
  ["pdfSizeBytes", "pdf_size_bytes", (v) => v],
  ["pdfPageCount", "pdf_page_count", (v) => v],
  ["faqs", "faqs", (v) => JSON.stringify(v)],
  ["occasions", "occasions", (v) => v],
  ["metaTitle", "meta_title", (v) => v],
  ["metaDescription", "meta_description", (v) => v],
  ["isPublished", "is_published", (v) => v],
  ["sortOrder", "sort_order", (v) => v],
];

export async function updateHamper(
  id: number,
  patch: UpdateHamperInput
): Promise<Hamper> {
  const sets: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  for (const [key, column, encode] of PATCHABLE) {
    const value = patch[key];
    if (value === undefined) continue;
    sets.push(`${column} = $${idx++}`);
    values.push(encode(value as never));
  }

  if (!sets.length) {
    const found = await getHamperById(id);
    if (!found) throw new Error("Not found");
    return found;
  }

  sets.push("updated_at = now()");
  values.push(id);

  const { rows } = await pool.query<HamperRow>(
    `update hampers set ${sets.join(", ")} where id = $${idx} returning ${COLUMNS}`,
    values
  );
  if (!rows.length) throw new Error("Not found");
  return rowToHamper(rows[0]);
}

export async function deleteHamper(id: number): Promise<Hamper | null> {
  const { rows } = await pool.query<HamperRow>(
    `delete from hampers where id = $1 returning ${COLUMNS}`,
    [id]
  );
  return rows.length ? rowToHamper(rows[0]) : null;
}

