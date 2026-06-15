import { pool } from "@/lib/db";

export async function withSyncLog(
  resource: string,
  syncType: "full" | "updated",
  fn: () => Promise<number>
): Promise<number> {
  const { rows } = await pool.query(
    `insert into amrod_sync_log (resource, sync_type) values ($1, $2) returning id`,
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
