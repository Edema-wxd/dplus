import { Pool } from "pg";

declare global {
  var _pgPool: Pool | undefined;
}

function createPool() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Shared hosting caps connections per database user; keep this small.
    max: Number(process.env.PG_POOL_MAX) || 5,
    idleTimeoutMillis: 30_000,
  });
  // An idle client losing its connection (e.g. Postgres restarting) emits
  // `error` on the pool; unhandled, that would crash the whole server.
  pool.on("error", (err) => {
    console.error("[db] idle client error:", err);
  });
  return pool;
}

export const pool = global._pgPool ?? createPool();

if (process.env.NODE_ENV !== "production") {
  global._pgPool = pool;
}
