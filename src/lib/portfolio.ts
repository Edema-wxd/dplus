import { pool } from "@/lib/db";

export type PortfolioImage = {
  url: string;
  alt: string;
  isMain: boolean;
};

export type PortfolioItem = {
  id: number;
  title: string;
  client: string | null;
  description: string | null;
  tags: string[];
  images: PortfolioImage[];
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
};

type PortfolioRow = {
  id: string;
  title: string;
  client: string | null;
  description: string | null;
  tags: string[];
  images: PortfolioImage[];
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

function rowToItem(row: PortfolioRow): PortfolioItem {
  return {
    id: Number(row.id),
    title: row.title,
    client: row.client,
    description: row.description,
    tags: row.tags ?? [],
    images: row.images ?? [],
    isPublished: row.is_published,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getPortfolioItems({
  includeUnpublished = false,
}: { includeUnpublished?: boolean } = {}): Promise<PortfolioItem[]> {
  const { rows } = await pool.query<PortfolioRow>(
    `select id, title, client, description, tags, images, is_published, created_at, updated_at
     from portfolio_items
     ${includeUnpublished ? "" : "where is_published = true"}
     order by created_at desc`
  );
  return rows.map(rowToItem);
}

export type CreatePortfolioInput = {
  title: string;
  client?: string;
  description?: string;
  tags?: string[];
  images?: PortfolioImage[];
  isPublished?: boolean;
};

export async function createPortfolioItem(
  input: CreatePortfolioInput
): Promise<PortfolioItem> {
  const { rows } = await pool.query<PortfolioRow>(
    `insert into portfolio_items (title, client, description, tags, images, is_published)
     values ($1, $2, $3, $4, $5, $6)
     returning id, title, client, description, tags, images, is_published, created_at, updated_at`,
    [
      input.title,
      input.client ?? null,
      input.description ?? null,
      input.tags ?? [],
      JSON.stringify(input.images ?? []),
      input.isPublished ?? false,
    ]
  );
  return rowToItem(rows[0]);
}

export type UpdatePortfolioInput = Partial<CreatePortfolioInput>;

export async function updatePortfolioItem(
  id: number,
  patch: UpdatePortfolioInput
): Promise<PortfolioItem> {
  const sets: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (patch.title !== undefined) { sets.push(`title = $${idx++}`); values.push(patch.title); }
  if (patch.client !== undefined) { sets.push(`client = $${idx++}`); values.push(patch.client); }
  if (patch.description !== undefined) { sets.push(`description = $${idx++}`); values.push(patch.description); }
  if (patch.tags !== undefined) { sets.push(`tags = $${idx++}`); values.push(patch.tags); }
  if (patch.images !== undefined) { sets.push(`images = $${idx++}`); values.push(JSON.stringify(patch.images)); }
  if (patch.isPublished !== undefined) { sets.push(`is_published = $${idx++}`); values.push(patch.isPublished); }

  if (!sets.length) {
    const item = await getPortfolioItems({ includeUnpublished: true });
    const found = item.find((i) => i.id === id);
    if (!found) throw new Error("Not found");
    return found;
  }

  sets.push(`updated_at = now()`);
  values.push(id);

  const { rows } = await pool.query<PortfolioRow>(
    `update portfolio_items set ${sets.join(", ")} where id = $${idx}
     returning id, title, client, description, tags, images, is_published, created_at, updated_at`,
    values
  );

  if (!rows.length) throw new Error("Not found");
  return rowToItem(rows[0]);
}

export async function deletePortfolioItem(id: number): Promise<void> {
  await pool.query(`delete from portfolio_items where id = $1`, [id]);
}

export async function togglePublished(
  id: number,
  published: boolean
): Promise<PortfolioItem> {
  return updatePortfolioItem(id, { isPublished: published });
}
