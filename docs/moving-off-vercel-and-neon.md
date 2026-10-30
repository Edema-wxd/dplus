# Moving off Vercel and Neon to the shared server

The app and its Postgres database both move to the shared cPanel server
(`162.0.229.137`, SSH on port 21098). The app talks to Postgres on `localhost`,
because shared hosts don't accept outside database connections and Vercel has
no fixed IPs to allow through.

Upstash Redis, UploadThing, email and the Amrod API stay as they are.

The code already supports this: the database driver is plain `pg`, which works
with both Neon and a normal Postgres server, so the Vercel site keeps running on
Neon until the cutover below.

## Before you start

- **Neon has to be reachable** to copy the data out. While it is over its quota,
  either wait for the billing period to reset or upgrade for a day and
  downgrade after the move.
- **Check cPanel has "PostgreSQL Databases".** MySQL won't do: the code uses
  JSONB, full-text search and array operators.
- **The server runs PostgreSQL 10.23** (shown at the top of phpPgAdmin). The
  schema files in `docs/` are tested against 10, but Neon runs a newer version,
  so step 2 builds the tables from those files and copies only the data.
- **Node.js 20.9 or newer** must be available in cPanel's "Setup Node.js App"
  (Next.js 16 requires it).

## 1. Create the database

In cPanel, open **PostgreSQL Databases**:

1. Create a database, for example `dplus`. cPanel prefixes it with the account
   name, giving `desimrwr_dplus`.
2. Create a user with a strong password, for example `desimrwr_app`.
3. Add the user to the database with all privileges.

The connection string will be:

```
postgres://desimrwr_app:PASSWORD@localhost:5432/desimrwr_dplus
```

URL-encode any special characters in the password.

## 2. Copy the data

A full `pg_dump` from Neon would carry table definitions written for a newer
Postgres than the server's 10.23, so build the tables from the repository's
schema files and copy only the rows.

**Create the tables.** Upload the schema files and run them, in this order
(later files refer to tables made by earlier ones):

```bash
scp -P 21098 docs/*-schema.sql desimrwr@162.0.229.137:~/
ssh -p 21098 desimrwr@162.0.229.137
export DB='postgres://desimrwr_app:PASSWORD@localhost:5432/desimrwr_dplus'
for f in admin amrod pricing orders portfolio contact brochures hampers; do
  psql "$DB" -v ON_ERROR_STOP=1 -f ~/$f-schema.sql || break
done
```

**Copy the rows.** On your own machine, dump Neon's data only. Use the
**direct** connection string from the Neon dashboard, not the `-pooler` one:

```bash
pg_dump --data-only --no-owner --no-acl "$NEON_DATABASE_URL" -f dplus-data.sql
# A pg_dump from Postgres 17 adds a setting Postgres 10 doesn't know:
sed -i.bak '/^SET transaction_timeout/d' dplus-data.sql
scp -P 21098 dplus-data.sql desimrwr@162.0.229.137:~/
```

On the server:

```bash
psql "$DB" -v ON_ERROR_STOP=1 --single-transaction -f ~/dplus-data.sql
```

`--single-transaction` means a failure leaves the tables empty rather than half
filled. If it stops with `column "..." does not exist`, the Neon database has a
column the schema files don't: add it with `alter table`, empty the tables and
run it again.

Check the row counts match Neon:

```sql
select 'products', count(*) from products
union all select 'orders', count(*) from orders
union all select 'admin_users', count(*) from admin_users
union all select 'brochures', count(*) from brochures
union all select 'hampers', count(*) from hampers
union all select 'portfolio_items', count(*) from portfolio_items;
```

If Neon can't be reached at all, the tables can stay empty and the catalogue
can be reloaded with `npm run seed:amrod`, but orders, admin users, brochures,
hampers, portfolio items and pricing settings would be lost.

## 3. Create the Node.js app

In cPanel, open **Setup Node.js App** and create an application:

- **Node.js version:** 20 or newer
- **Application mode:** Production
- **Application root:** `dplus`
- **Application URL:** the site's domain
- **Application startup file:** `server.js`

Add the environment variables. Copy every one from Vercel (Project, Settings,
Environment Variables, Production), then change or add these:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | the `localhost` connection string from step 1 |
| `PG_POOL_MAX` | `5` (optional; raise only if the host allows more connections) |
| `NODE_ENV` | `production` |
| `NEXTAUTH_URL` | `https://www.de-signplus.com` |

Make sure the auth secret (`AUTH_SECRET` or `NEXTAUTH_SECRET`), `CRON_SECRET`,
the Upstash, UploadThing, Amrod, storage and email variables all come across.

The page shows a command to "enter to the virtual environment". Copy it; the
deploy script needs it.

## 4. Deploy

In `.env.local` on your machine, set `NEXT_PUBLIC_SITE_URL` to the live domain:
`NEXT_PUBLIC_*` values are baked in at build time. Then:

```bash
export DEPLOY_NODEENV='source /home/desimrwr/nodevenv/dplus/20/bin/activate && cd /home/desimrwr/dplus'
npm run remotedeploy
```

Use the command cPanel showed you for `DEPLOY_NODEENV`. The script builds
locally, uploads the build, installs production dependencies on the server and
restarts the app. Without `DEPLOY_NODEENV` it stops after uploading and prints
the remaining steps.

To test before switching DNS, point the domain at the server in your computer's
hosts file (`162.0.229.137 www.de-signplus.com`) and browse the site, including
`/admin`, a product page and the basket.

## 5. Scheduled jobs

Vercel ran the Amrod sync from `vercel.json`. Add these in cPanel's **Cron
Jobs**, using the `CRON_SECRET` value. Vercel's times were UTC; adjust for the
server's timezone if it differs.

```
0 2 * * *  curl -fsS --max-time 900 -H "Authorization: Bearer CRON_SECRET" https://www.de-signplus.com/api/cron/amrod-daily > /dev/null
0 3 * * 1  curl -fsS --max-time 900 -H "Authorization: Bearer CRON_SECRET" https://www.de-signplus.com/api/cron/amrod-weekly > /dev/null
```

Neon handled backups; now the server has to. Add a nightly dump, which keeps
14 days in `~/backups/dplus`:

```
15 1 * * *  DATABASE_URL='postgres://desimrwr_app:PASSWORD@localhost:5432/desimrwr_dplus' bash ~/dplus/scripts/backup-db.sh
```

`scripts/` isn't part of the deploy upload, so copy `scripts/backup-db.sh` to
`~/dplus/scripts/` once. Download a backup now and then: copies on the same
server don't help if the server is lost.

Watch the first Amrod sync. Shared hosting limits memory per account, and the
sync is the heaviest thing the app does.

## 6. Cutover

1. Stop making admin changes. Orders placed on the Vercel site after the copy
   in step 2 would be lost, so do the final copy as close to the switch as
   possible.
2. Repeat step 2 to pick up anything that changed since the first copy: empty
   the tables first (`psql "$DB" -c 'drop schema public cascade; create schema public;'`
   then recreate them), or use a fresh database.
3. Point the domain's DNS at the server: `A` records for `de-signplus.com` and
   `www` to `162.0.229.137`. Remove any Vercel `CNAME`.
4. Once DNS has moved, issue the SSL certificate with cPanel's **SSL/TLS
   Status** (AutoSSL).

## 7. Shut down Vercel and Neon

1. In Vercel, remove the domain from the project, then disconnect the Git
   repository or delete the project. Otherwise every push to `main` still
   deploys there, and its cron jobs keep running the Amrod sync against Neon.
2. Delete `vercel.json` from the repository.
3. Keep Neon for a week in case something was missed, then delete the project.
   Keep the last dump.
