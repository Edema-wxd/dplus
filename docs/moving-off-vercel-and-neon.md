# Moving off Vercel, Neon and UploadThing

Everything ends up on the shared cPanel server (`162.0.229.137`, SSH on port
21098, user `desimrwr`): the app, its Postgres database and uploaded files.
Upstash Redis, email and the Amrod API stay as they are.

## Where things stand

The switch-over was done on 2026-11-06: the live site runs this code against
the server's own Postgres, the UploadThing files are in `~/public_html/uploads`,
and the steps below are kept for reference and for rebuilding the setup.
What's left is in step 8.

- **The live site runs on the server.** `www.de-signplus.com` points at
  Namecheap's CDN (`159.198.67.212`), which forwards to the cPanel Node.js app
  `dplus24` (Node 24, app root `~/dplus24`, wired up in
  `~/public_html/.htaccess`). Vercel only ever served `dplus-iota.vercel.app`
  and ran the Amrod sync; that project was paused on 2026-11-07. No DNS change
  is needed.
- **The app can't reach Neon from here.** The host blocks outgoing connections
  to port 5432, so `pg` times out against Neon. (The Aug 31 build used Neon's
  serverless driver, which goes over 443.) Copy data out of Neon from your own
  machine.
- **The app's environment comes from the Node selector**
  (`~/.cl.selector/node-selector.json`, what "Setup Node.js App" edits), not from
  `SetEnv` lines in `.htaccess`, which LiteSpeed ignores for `DATABASE_URL`.
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

The app connects with `postgres://desimrwr_app@localhost:5432/desimrwr_dplus`
and `PGPASSFILE=/home/desimrwr/.pgpass`: with no password in the URL, `pg`
reads it from that file, so it isn't stored in the app's settings. (`pg` 9 drops
this; before upgrading, put the password in the URL instead.)

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
variables (or `cloudlinux-selector set --interpreter nodejs --app-root dplus24
--env-vars '<json of all of them>'`, which replaces the whole set). Keep the
existing ones (auth secret, `CRON_SECRET`, Amrod) and set:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | `postgres://desimrwr_app@localhost:5432/desimrwr_dplus` |
| `PGPASSFILE` | `/home/desimrwr/.pgpass` |
| `UPLOADS_DIR` | `/home/desimrwr/public_html/uploads` |
| `AUTH_URL` | `https://www.de-signplus.com` |
| `AUTH_TRUST_HOST` | `true` |
| `PG_POOL_MAX` | `5` (optional) |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile secret key (optional; turns the captcha on) |

`AUTH_URL` matters: the CDN and LiteSpeed both add the host to
`X-Forwarded-Host`, and NextAuth chokes on the doubled value
(`Invalid URL: 'https://www.de-signplus.com, www.de-signplus.com'`) unless it is
told the site's address.

`UPLOADTHING_TOKEN` and any `STORAGE_*` variables are no longer read.

## 4. Deploy

`NEXT_PUBLIC_SITE_URL` is baked in at build time and upload URLs are built from
it. It defaults to `https://www.de-signplus.com`; if `.env.local` sets it, it
must be that. `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is baked in the same way: deploy
a build with it before setting `TURNSTILE_SECRET_KEY` on the server, or every
form is turned away for lack of a token. Then:

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
export PGPASSFILE=~/.pgpass DATABASE_URL=postgres://desimrwr_app@localhost:5432/desimrwr_dplus UPLOADS_DIR=~/public_html/uploads
node scripts/migrate-uploadthing.mjs --dry-run
node scripts/migrate-uploadthing.mjs
```

## 6. Check the site

Browse the home page, `/products`, a product page, `/brochures` (the page
images now come from `/uploads`), `/hampers`, `/portfolio`, the basket with an
artwork upload, `/portal` login and every `/admin` page, including uploading a
brochure page and a portfolio image. Watch `~/dplus24/stderr.log`.

## 7. Scheduled jobs and backups

Copy `scripts/cron-amrod.sh` and `scripts/backup-db.sh` to `~/dplus24/scripts/`
(`scripts/` isn't part of the deploy upload). `cron-amrod.sh` reads `CRON_SECRET`
from the app's settings, so the secret stays out of the crontab, and sends the
request straight to this server instead of out through the CDN.

These three were added to the crontab on 2026-11-07 (the earlier crontab is in
`~/crontab-before-dplus.bak`); cPanel's **Cron Jobs** page shows them. Times are
the server's (US Eastern), matching Vercel's 02:00 and 03:00 UTC in winter:

| Minute | Hour | Day | Month | Weekday | Command |
| --- | --- | --- | --- | --- | --- |
| 0 | 21 | * | * | * | `bash /home/desimrwr/dplus24/scripts/cron-amrod.sh daily >> /home/desimrwr/logs/dplus-cron.log 2>&1` |
| 0 | 22 | * | * | 0 | `bash /home/desimrwr/dplus24/scripts/cron-amrod.sh weekly >> /home/desimrwr/logs/dplus-cron.log 2>&1` |
| 15 | 20 | * | * | * | `PGPASSFILE=/home/desimrwr/.pgpass DATABASE_URL=postgres://desimrwr_app@localhost:5432/desimrwr_dplus bash /home/desimrwr/dplus24/scripts/backup-db.sh >> /home/desimrwr/logs/dplus-cron.log 2>&1` |

The daily sync takes about 10 seconds. Backups keep 14 days in `~/backups/dplus`;
download one now and then, and include `~/public_html/uploads` in whatever you
copy off the server.

## 8. Vercel and Neon become the dev site; shut down UploadThing

1. On 2026-11-07 Vercel stopped serving the live site and became the dev
   site, at `https://dplus-iota.vercel.app`:
   - Its production branch is `dev`. Push to `dev` to try a change there, then
     merge `dev` into `main` and deploy `main` to the server. Other branches
     still get their own preview links.
   - It uses Neon as its database: a copy of the live data from the 2026-11-06
     switch-over, so nothing done on dev touches the live site. Neon has the
     same tables as the server; when a schema file changes, apply it to both.
   - `next.config` sends `X-Robots-Tag: noindex` on every Vercel deployment
     (`VERCEL_ENV` is set there and never on the server), so dev stays out of
     search results.
   - It has no email, Turnstile or cron settings, so it sends no mail, shows no
     captcha and runs no Amrod syncs. Uploads go to `/tmp` and vanish when
     Vercel recycles the function; images uploaded on the live site don't
     show on dev.
   - `vercel.json` is gone, so Vercel runs no cron jobs.
2. Keep the Neon project: it is the dev database now. Keep the last dump too.
3. Once no row mentions `ufs.sh` (`select count(*) from brochures where pages::text like '%ufs.sh%'`,
   same for `hampers` and `orders.items`), cancel UploadThing. Neon still
   points at UploadThing for its images, so those break on dev afterwards.
4. The old app folders `~/dplus` and `~/neon_dump.sql` (Aug 31) can go once the
   new build has run for a while.
