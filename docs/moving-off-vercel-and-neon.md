# Moving off Vercel, Neon and UploadThing

Everything ends up on the shared cPanel server (`162.0.229.137`, SSH on port
21098, user `desimrwr`): the app, its Postgres database and uploaded files.
Upstash Redis, email and the Amrod API stay as they are.

## Where things stand

- **The live site already runs on the server.** `www.de-signplus.com` points at
  Namecheap's CDN (`159.198.67.212`), which forwards to the cPanel Node.js app
  `dplus24` (Node 24, app root `~/dplus24`, wired up in
  `~/public_html/.htaccess`). Vercel only serves `dplus-iota.vercel.app` and runs
  the Amrod sync from `vercel.json`. No DNS change is needed.
- **The live build is from Aug 31** and talks to Neon with the old serverless
  driver, which fails a lot (`~/dplus24/stderr.log`).
- **The server's Postgres is version 10**; Neon is 18. `scripts/dump-neon.sh`
  edits the dump so 10 accepts it. The app's queries need nothing newer.
- **The server's glibc is 2.28**, too old for Next's native compiler. That only
  matters for building, which happens on your machine; at runtime the warnings
  in the log are harmless. `sharp` (image optimisation) works.
- **Uploads move to the server's disk.** `/api/uploads/[slot]` saves files to
  `UPLOADS_DIR` (`~/public_html/uploads`), which the web server hands out at
  `https://www.de-signplus.com/uploads/…` without going through Node.
  `~/public_html/uploads/.htaccess` (from `scripts/uploads.htaccess`) stops
  anything there running as a script.

## 1. Database user

The `desimrwr_dplus` database exists. In cPanel, open **PostgreSQL Databases**:

1. Create a user, for example `desimrwr_app`, with a strong password.
2. Add it to `desimrwr_dplus` (all privileges).
3. Save the password for the command-line tools: in cPanel's **Terminal** (or
   over SSH), run

   ```bash
   echo 'localhost:5432:desimrwr_dplus:desimrwr_app:PASSWORD' > ~/.pgpass && chmod 600 ~/.pgpass
   ```

The app's connection string is
`postgres://desimrwr_app:PASSWORD@localhost:5432/desimrwr_dplus` (URL-encode
special characters in the password).

## 2. Copy the data

On your machine, with Postgres 18's `pg_dump` (`brew install postgresql@18`)
and Neon's **direct** connection string (no `-pooler`):

```bash
NEON_DATABASE_URL='postgres://…' bash scripts/dump-neon.sh dplus.sql
gzip -f dplus.sql
scp -P 21098 dplus.sql.gz desimrwr@162.0.229.137:~/
```

On the server, load it into the empty database:

```bash
gunzip -f ~/dplus.sql.gz
psql -h localhost -U desimrwr_app -d desimrwr_dplus -v ON_ERROR_STOP=1 -q -f ~/dplus.sql
```

To load it again, empty the database first:

```bash
psql -h localhost -U desimrwr_app -d desimrwr_dplus -c 'drop schema public cascade; create schema public;'
```

Check the row counts match Neon:

```sql
select 'products', count(*) from products
union all select 'orders', count(*) from orders
union all select 'brochures', count(*) from brochures
union all select 'hampers', count(*) from hampers
union all select 'contact_submissions', count(*) from contact_submissions
union all select 'admin_users', count(*) from admin_users;
```

## 3. App settings

In cPanel's **Setup Node.js App**, edit the `dplus24` app's environment
variables. Keep the existing ones (auth secret, `CRON_SECRET`, Upstash, Amrod,
email) and set:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | the `localhost` connection string from step 1 |
| `UPLOADS_DIR` | `/home/desimrwr/public_html/uploads` |
| `AUTH_TRUST_HOST` | `true` (NextAuth trusts the host on its own only on Vercel) |
| `NODE_ENV` | `production` |
| `PG_POOL_MAX` | `5` (optional) |

`UPLOADTHING_TOKEN` and any `STORAGE_*` variables are no longer read.

## 4. Deploy

`NEXT_PUBLIC_SITE_URL` is baked in at build time and upload URLs are built from
it. It defaults to `https://www.de-signplus.com`; if `.env.local` sets it, it
must be that. Then:

```bash
export DEPLOY_DIR=dplus24   # the default; the live app
export DEPLOY_NODEENV='source /home/desimrwr/nodevenv/dplus24/24/bin/activate && cd /home/desimrwr/dplus24'
npm run remotedeploy
```

## 5. Move the UploadThing files

The database points at 24 UploadThing files (one brochure's pages). Copy them
to the server and repoint the rows; this never deletes anything at UploadThing:

```bash
scp -P 21098 scripts/migrate-uploadthing.mjs desimrwr@162.0.229.137:~/dplus24/scripts/
# on the server, inside the Node virtual environment from step 4:
cd ~/dplus24
DATABASE_URL='postgres://…' UPLOADS_DIR=~/public_html/uploads node scripts/migrate-uploadthing.mjs --dry-run
DATABASE_URL='postgres://…' UPLOADS_DIR=~/public_html/uploads node scripts/migrate-uploadthing.mjs
```

## 6. Check the site

Browse the home page, `/products`, a product page, `/brochures` (the page
images now come from `/uploads`), `/hampers`, `/portfolio`, the basket with an
artwork upload, `/portal` login and every `/admin` page, including uploading a
brochure page and a portfolio image. Watch `~/dplus24/stderr.log`.

## 7. Scheduled jobs and backups

In cPanel's **Cron Jobs**, using the `CRON_SECRET` value. `--resolve` sends the
request straight to this server instead of out through the CDN, whose time limit
is shorter than a full sync. Vercel's times were UTC; adjust if the server's
timezone differs.

```
0 2 * * *  curl -fsS --max-time 900 --resolve www.de-signplus.com:443:162.0.229.137 -H "Authorization: Bearer CRON_SECRET" https://www.de-signplus.com/api/cron/amrod-daily > /dev/null
0 3 * * 1  curl -fsS --max-time 900 --resolve www.de-signplus.com:443:162.0.229.137 -H "Authorization: Bearer CRON_SECRET" https://www.de-signplus.com/api/cron/amrod-weekly > /dev/null
15 1 * * * DATABASE_URL='postgres://desimrwr_app:PASSWORD@localhost:5432/desimrwr_dplus' bash ~/dplus24/scripts/backup-db.sh
```

Copy `scripts/backup-db.sh` to `~/dplus24/scripts/` once. It keeps 14 days in
`~/backups/dplus`; download one now and then, and include
`~/public_html/uploads` in whatever you copy off the server.

Watch the first Amrod sync: shared hosting limits memory per account, and the
sync is the heaviest thing the app does.

## 8. Shut down Vercel, Neon and UploadThing

1. In Vercel, disconnect the Git repository or delete the `dplus` project.
   Otherwise every push to `main` still deploys there and its cron jobs keep
   syncing Amrod into Neon. Then delete `vercel.json`.
2. Keep Neon for a week in case something was missed, then delete the project.
   Keep the last dump.
3. Once no row mentions `ufs.sh` (`select count(*) from brochures where pages::text like '%ufs.sh%'`,
   same for `hampers` and `orders.items`), cancel UploadThing.
4. The old app folders `~/dplus` and `~/neon_dump.sql` (Aug 31) can go once the
   new build has run for a while.
