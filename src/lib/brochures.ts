import { pool } from "@/lib/db";

export type BrochurePage = {
  url: string;
  /** UploadThing file key, kept so the file can be deleted with the row. */
  key: string;
  alt: string;
};

export type Brochure = {
  id: number;
  slug: string;
  name: string;
  edition: string | null;
  description: string | null;
  pageRatio: number;
  pages: BrochurePage[];
  pdfUrl: string | null;
  pdfKey: string | null;
  pdfSizeBytes: number | null;
  pdfPageCount: number | null;
  isPublished: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

type BrochureRow = {
  id: string;
  slug: string;
  name: string;
  edition: string | null;
  description: string | null;
  page_ratio: string;
  pages: BrochurePage[];
  pdf_url: string | null;
  pdf_key: string | null;
  pdf_size_bytes: string | null;
  pdf_page_count: number | null;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

const COLUMNS = `id, slug, name, edition, description, page_ratio, pages,
  pdf_url, pdf_key, pdf_size_bytes, pdf_page_count, is_published, sort_order,
  created_at, updated_at`;

function rowToBrochure(row: BrochureRow): Brochure {
  return {
    id: Number(row.id),
    slug: row.slug,
    name: row.name,
    edition: row.edition,
    description: row.description,
    pageRatio: Number(row.page_ratio),
    pages: row.pages ?? [],
    pdfUrl: row.pdf_url,
    pdfKey: row.pdf_key,
    pdfSizeBytes: row.pdf_size_bytes === null ? null : Number(row.pdf_size_bytes),
    pdfPageCount: row.pdf_page_count,
    isPublished: row.is_published,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Turns a name into a URL address. Shared by create and update. */
export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatBytes(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export async function getBrochures({
  includeUnpublished = false,
}: { includeUnpublished?: boolean } = {}): Promise<Brochure[]> {
  const { rows } = await pool.query<BrochureRow>(
    `select ${COLUMNS} from brochures
     ${includeUnpublished ? "" : "where is_published = true"}
     order by sort_order asc, created_at desc`
  );
  return rows.map(rowToBrochure);
}

export async function getPublishedBrochures(): Promise<Brochure[]> {
  return getBrochures({ includeUnpublished: false });
}

export type CreateBrochureInput = {
  slug: string;
  name: string;
  edition?: string | null;
  description?: string | null;
  pageRatio?: number;
  pages?: BrochurePage[];
  pdfUrl?: string | null;
  pdfKey?: string | null;
  pdfSizeBytes?: number | null;
  pdfPageCount?: number | null;
  isPublished?: boolean;
  sortOrder?: number;
};

export async function createBrochure(
  input: CreateBrochureInput
): Promise<Brochure> {
  const { rows } = await pool.query<BrochureRow>(
    `insert into brochures
       (slug, name, edition, description, page_ratio, pages, pdf_url, pdf_key,
        pdf_size_bytes, pdf_page_count, is_published, sort_order)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     returning ${COLUMNS}`,
    [
      input.slug,
      input.name,
      input.edition ?? null,
      input.description ?? null,
      input.pageRatio ?? 1.414,
      JSON.stringify(input.pages ?? []),
      input.pdfUrl ?? null,
      input.pdfKey ?? null,
      input.pdfSizeBytes ?? null,
      input.pdfPageCount ?? null,
      input.isPublished ?? false,
      input.sortOrder ?? 0,
    ]
  );
  return rowToBrochure(rows[0]);
}

export type UpdateBrochureInput = Partial<CreateBrochureInput>;

const PATCHABLE: Array<[keyof UpdateBrochureInput, string, (v: never) => unknown]> = [
  ["slug", "slug", (v) => v],
  ["name", "name", (v) => v],
  ["edition", "edition", (v) => v],
  ["description", "description", (v) => v],
  ["pageRatio", "page_ratio", (v) => v],
  ["pages", "pages", (v) => JSON.stringify(v)],
  ["pdfUrl", "pdf_url", (v) => v],
  ["pdfKey", "pdf_key", (v) => v],
  ["pdfSizeBytes", "pdf_size_bytes", (v) => v],
  ["pdfPageCount", "pdf_page_count", (v) => v],
  ["isPublished", "is_published", (v) => v],
  ["sortOrder", "sort_order", (v) => v],
];

export async function updateBrochure(
  id: number,
  patch: UpdateBrochureInput
): Promise<Brochure> {
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
    const found = await getBrochureById(id);
    if (!found) throw new Error("Not found");
    return found;
  }

  sets.push("updated_at = now()");
  values.push(id);

  const { rows } = await pool.query<BrochureRow>(
    `update brochures set ${sets.join(", ")} where id = $${idx} returning ${COLUMNS}`,
    values
  );
  if (!rows.length) throw new Error("Not found");
  return rowToBrochure(rows[0]);
}

export async function getBrochureById(id: number): Promise<Brochure | null> {
  const { rows } = await pool.query<BrochureRow>(
    `select ${COLUMNS} from brochures where id = $1`,
    [id]
  );
  return rows.length ? rowToBrochure(rows[0]) : null;
}

export async function deleteBrochure(id: number): Promise<Brochure | null> {
  const { rows } = await pool.query<BrochureRow>(
    `delete from brochures where id = $1 returning ${COLUMNS}`,
    [id]
  );
  return rows.length ? rowToBrochure(rows[0]) : null;
}

/**
 * Rewrites sort_order to match the given id order, lowest first. Ids that do
 * not exist are ignored. Returns the brochures in their new order.
 */
export async function reorderBrochures(ids: number[]): Promise<Brochure[]> {
  if (ids.length) {
    await pool.query(
      `update brochures as b
         set sort_order = v.ord, updated_at = now()
       from (select * from unnest($1::bigint[], $2::int[]) as t(id, ord)) as v
       where b.id = v.id`,
      [ids, ids.map((_, i) => i)]
    );
  }
  return getBrochures({ includeUnpublished: true });
}
