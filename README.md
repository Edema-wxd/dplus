# De-Sign Plus (dplus)

Next.js 15 (App Router) + React 19 + Tailwind v4 site: a marketing/portfolio site plus a small e-commerce and admin platform — customer storefront (products, basket, checkout-to-order), Amrod catalogue sync, and an authenticated admin dashboard for orders, pricing, Amrod sync, and portfolio content.

See [PROJECT-STATUS.md](./PROJECT-STATUS.md) for current route/feature status and known issues.

## Stack

- Next.js 15 App Router, React 19, Tailwind v4
- shadcn/ui (Radix), framer-motion, sonner, next-themes
- NextAuth v5 (beta, credentials provider) for admin auth
- Postgres via `pg` (Neon today, moving to the shared server), `@upstash/redis` for caching
- Resend / SMTP for transactional email, S3-compatible storage for uploads

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

Copy `.env.local` (not committed) with at least:

- `DATABASE_URL` — Postgres connection string
- `PG_POOL_MAX` — optional, max database connections per process (default 5)
- `NEXTAUTH_URL`, admin auth secrets
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` — pricing config cache
- `AMROD_API_URL`, `AMROD_IDENTITY_URL`, `AMROD_CUSTOMER_CODE`, `AMROD_USERNAME`, `AMROD_PASSWORD` — Amrod catalogue sync
- `CRON_SECRET` — protects `/api/cron/*` sync endpoints
- `RESEND_API_KEY` or `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASS`/`SMTP_SECURE`, `EMAIL_FROM`, `ADMIN_EMAIL`/`NOTIFY_EMAIL` — order/contact email notifications (no-op if unset)
- `STORAGE_ENDPOINT`, `STORAGE_REGION`, `STORAGE_BUCKET`, `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY` — S3-compatible bucket for portfolio image uploads

### Seed scripts

```bash
npm run seed:admin   # create an initial admin_users row
npm run seed:amrod   # seed Amrod catalogue data
```

### Tests

```bash
npm test
```

## Notes

- `/admin/*` is rendered `force-dynamic` (see `src/app/admin/layout.tsx`) since it's authenticated and DB-backed — it should never be statically prerendered.
- Every DB-backed page (`/products`, `/brochures`, `/hampers`, `/portfolio` and their detail pages) renders per request, so `next build` never queries the database. On the self-hosted server ISR revalidation state lives in each Node process's memory, so on-demand revalidation would only reach the process that handled the admin request.
- Those pages read through a Redis cache (`src/lib/cache.ts`) shared by every process: `products:*` (cleared by pricing updates and the Amrod sync), and `brochures:*`, `hampers:*` and `portfolio:*` (cleared by every write in `src/lib/brochures.ts`, `src/lib/hampers.ts` and `src/lib/portfolio.ts`). Expired entries are kept a week as a fallback if the database is unreachable.
- `/sitemap.xml` uses ISR with `revalidate = 86400`, refreshed on demand via `src/lib/revalidate.ts`.

## Deploy

Moving from Vercel and Neon to the shared cPanel server, with Postgres on the same machine. Follow [docs/moving-off-vercel-and-neon.md](./docs/moving-off-vercel-and-neon.md) for the one-off migration.

`npm run remotedeploy` (`scripts/deploy.sh`) builds locally, uploads the build and, with `DEPLOY_NODEENV` set to cPanel's virtual-environment command, installs dependencies and restarts the app. Scheduled jobs (Amrod sync, nightly `scripts/backup-db.sh`) run from cPanel cron.
