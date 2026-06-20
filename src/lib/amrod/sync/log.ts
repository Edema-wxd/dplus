import { pool } from "@/lib/db";

export interface SyncResourceStatus {
  resource: string;
  sync_type: string;
  status: string;
  record_count: number | null;
  error: string | null;
  started_at: Date;
  finished_at: Date | null;
}

export interface SyncLogEntry {
  id: number;
  resource: string;
  sync_type: string;
  status: string;
  record_count: number | null;
  error: string | null;
  started_at: Date;
  finished_at: Date | null;
}

export async function getSyncStatus(): Promise<SyncResourceStatus[]> {
  const { rows } = await pool.query<SyncResourceStatus>(
    `SELECT DISTINCT ON (resource) resource, sync_type, status, record_count,
            error, started_at, finished_at
     FROM amrod_sync_log
     ORDER BY resource, started_at DESC`
  );
  return rows;
}

export async function getRecentSyncLog(limit = 20): Promise<SyncLogEntry[]> {
  const { rows } = await pool.query<SyncLogEntry>(
    `SELECT * FROM amrod_sync_log ORDER BY started_at DESC LIMIT $1`,
    [limit]
  );
  return rows;
}

export async function getLastSyncTime(): Promise<Date | null> {
  const { rows } = await pool.query<{ finished_at: Date }>(
    `select finished_at from amrod_sync_log where status = 'success' order by finished_at desc limit 1`
  );
  return rows[0]?.finished_at ?? null;
}

export async function withSyncLog(
  resource: string,
  syncType: "full" | "updated",
  fn: () => Promise<number>
): Promise<number> {
  const { rows } = await pool.query(
    `insert into amrod_sync_log (resource, sync_type, status) values ($1, $2, 'running') returning id`,
    [resource, syncType]
  );
  const logId = rows[0].id;

  try {
    const count = await fn();
    await pool.query(
      `update amrod_sync_log set finished_at = now(), record_count = $1, status = 'success' where id = $2`,
      [count, logId]
    );
    return count;
  } catch (err) {
    await pool.query(
      `update amrod_sync_log set finished_at = now(), status = 'failed', error = $1 where id = $2`,
      [err instanceof Error ? err.message : String(err), logId]
    );
    throw err;
  }
}
