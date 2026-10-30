# De-Sign Plus (dplus)

Next.js 15 (App Router) + React 19 + Tailwind v4 site: a marketing/portfolio site plus a small e-commerce and admin platform — customer storefront (products, basket, checkout-to-order), Amrod catalogue sync, and an authenticated admin dashboard for orders, pricing, Amrod sync, and portfolio content.

See [PROJECT-STATUS.md](./PROJECT-STATUS.md) for current route/feature status and known issues.

## Stack

- Next.js 15 App Router, React 19, Tailwind v4
- shadcn/ui (Radix), framer-motion, sonner, next-themes
- NextAuth v5 (beta, credentials provider) for admin auth
- Postgres (Neon) via `pg`, `@upstash/redis` for caching
- Resend / SMTP for transactional email, S3-compatible storage for uploads

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

Copy `.env.local` (not committed) with at least:

- `DATABASE_URL` — Postgres (Neon) connection string
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
- Public DB-backed pages (`/products`, `/portfolio`, `/hampers` and their detail pages, `/sitemap.xml`) use ISR with `revalidate = 86400`. Admin edits, pricing changes and the Amrod cron refresh them on demand via `src/lib/revalidate.ts`, so add a call there when a new admin mutation changes a public page.
- Catalogue reads in `src/lib/products.ts` are cached in Redis under `products:*` (`src/lib/cache.ts`), cleared by pricing updates and the Amrod sync. `/brochures` renders per request instead, reading the published list from Redis under `brochures:*`, which every write in `src/lib/brochures.ts` clears. ISR state lives in each Node process's memory on the self-hosted server, so on-demand revalidation only reaches the process that handled the admin request. Neon only suspends after 5 minutes without queries, so anything that queries on every request, or on a short timer, keeps the compute awake and burns the monthly CU-hour allowance.
- A build-time DB connectivity hiccup to Neon can fail `next build` for prerendered routes, see the "Known issues" section in [PROJECT-STATUS.md](./PROJECT-STATUS.md).

## Deploy

Deployed on [Vercel](https://vercel.com). See [Next.js deployment docs](https://nextjs.org/docs/app/building-your-application/deploying) for general guidance.
