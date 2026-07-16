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
- `/portfolio` and `/portfolio/[id]` use ISR (`revalidate = 60`); a build-time DB connectivity hiccup to Neon can fail `next build` for these routes — see the "Known issues" section in [PROJECT-STATUS.md](./PROJECT-STATUS.md).

## Deploy

Deployed on [Vercel](https://vercel.com). See [Next.js deployment docs](https://nextjs.org/docs/app/building-your-application/deploying) for general guidance.
