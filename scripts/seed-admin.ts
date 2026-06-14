import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {
  const bcrypt = (await import("bcryptjs")).default;
  const { pool } = await import("../src/lib/db");

  const email = process.argv[2];
  const password = process.argv[3];
  const name = process.argv[4] ?? null;

  if (!email || !password) {
    console.error("Usage: tsx scripts/seed-admin.ts <email> <password> [name]");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await pool.query(
    `insert into admin_users (email, password_hash, name)
     values ($1, $2, $3)
     on conflict (email) do update set password_hash = excluded.password_hash, name = excluded.name`,
    [email.toLowerCase(), passwordHash, name]
  );

  console.log(`Admin user upserted: ${email}`);
  await pool.end();
}

main();
