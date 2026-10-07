/** Creates the contact_submissions table. Safe to re-run — everything is `if not exists`. */
import { config } from "dotenv";
config({ path: ".env.local" });

import fs from "fs/promises";
import path from "path";

async function main() {
  const { pool } = await import("../src/lib/db");
  const sql = await fs.readFile(
    path.join(process.cwd(), "docs/contact-schema.sql"),
    "utf8"
  );
  await pool.query(sql);
  const { rows } = await pool.query<{ column_name: string }>(
    `select column_name from information_schema.columns
     where table_name = 'contact_submissions' order by ordinal_position`
  );
  console.log("contact_submissions:", rows.map((r) => r.column_name).join(", "));
  process.exit(0);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
