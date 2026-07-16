# De-Sign Plus — Project Status

_Last reviewed: 2026-07-16_

## Overview
"dplus" (De-Sign Plus) is a Next.js 15 (App Router) + React 19 + Tailwind v4 site that has grown from a marketing/portfolio site into a small e-commerce + admin platform: a customer-facing storefront (products, basket, checkout-to-order) backed by Postgres, an Amrod catalogue sync integration, and a password-protected admin dashboard for orders, pricing, Amrod sync, and portfolio content.

Stack: shadcn/ui (Radix), framer-motion, sonner, next-themes, NextAuth v5 (beta, credentials provider), `pg` for Postgres (Neon), `@upstash/redis` for caching, custom "Sarlotte" + Raleway fonts.

## Current branch state
- On `main`, working tree clean aside from small in-progress edits.
- The layout restructure noted in earlier reviews (site vs. admin route groups, `/portal` login, pricing/orders/cart systems) is committed. Since then: order status constants moved to their own module, contact form validation/submission, dynamic theme-aware logo loading, and general cleanup passes.
- Admin routes are now rendered with `export const dynamic = "force-dynamic"` on `src/app/admin/layout.tsx` — the whole `/admin` tree is authenticated and DB-backed, so it should never be statically prerendered at build time.

## Routes — implementation status

### Customer site (`src/app/(site)/`)
| Route | Status |
|---|---|
| `/` | ✅ Built — Hero, Services, CTA |
| `/products` | ✅ Built — paginated/searchable listing from Postgres, NGN pricing via `calcPrice()` |
| `/products/[id]` | ✅ Built — variants, branding/logo selection, basket integration |
| `/basket` | ✅ Built — cart UI (localStorage + context), submits to `/api/orders` |
| `/portfolio` | ✅ Built — project listing, DB-backed (`getPublishedPortfolioItems()`), no longer uses mock data |
| `/portfolio/[id]` | ✅ Built — hero image, tags, client, description, additional images, CTA |
| `/contact-us` | ✅ Built — Hero + Contact form with validation and submission handling |
| `/services` | ✅ Built |
| `/privacy` | ✅ Built |
| `/terms-of-service` | ✅ Built |

### Admin (`src/app/admin/`, guarded by NextAuth middleware, force-dynamic)
| Route | Status |
|---|---|
| `/admin` | ✅ Built — dashboard: stat cards (new/total orders, catalogue size, contact inquiries), order status breakdown, recent orders table, recent contact inquiries |
| `/admin/orders` | ✅ Built — order list + `/admin/orders/[id]` detail view, status transitions via `PATCH /api/admin/orders/[id]/status` |
| `/admin/pricing` | ✅ Built — VAT / markup / ZAR→NGN exchange rate config form, shows last-updated-by |
| `/admin/amrod` | ✅ Built — sync status/log UI (per-resource status, record counts, errors, manual trigger) |
| `/admin/content` | ✅ Built — portfolio CRUD UI (create/edit/publish projects, image upload) |
| `/portal` | ✅ Built — admin login (credentials), outside `/admin` route group |

### API routes (`src/app/api/`)
| Route | Status |
|---|---|
| `/api/auth/[...nextauth]` | ✅ NextAuth credentials provider, `admin_users` table |
| `/api/orders` (POST) | ✅ Validates + persists order (JSONB items) |
| `/api/products` | ✅ Product fetch for listing/detail |
| `/api/contact` | ✅ Contact form submission |
| `/api/admin/orders`, `/api/admin/orders/[id]/status` | ✅ Order list + status-update endpoint (with tests) |
| `/api/admin/pricing` (GET/PATCH) | ✅ Read/update pricing config, Redis-cached, auth-protected |
| `/api/admin/pricing/preview` | ✅ Preview pricing calc against config changes |
| `/api/admin/portfolio` | ✅ Portfolio CRUD backing `/admin/content` |
| `/api/cron/amrod-daily`, `/api/cron/amrod-weekly` | ✅ Scheduled Amrod sync jobs |

## Data layer
- **Postgres (Neon)** (`src/lib/db.ts` — pooled client). Tables: `products`, `brands`, `categories`, `product_prices`, `product_stock` (via Amrod sync), `orders` (JSONB items + status), `pricing_config` (single-row, see `docs/pricing-schema.sql`), `admin_users`, `portfolio_items` (see `docs/portfolio-schema.sql`), `contact_submissions`.
- `src/lib/products.ts` — `getProducts()`, `getProductDetail()`, `getRelatedProducts()`, `getBrandOptions()`, `getTopCategoryOptions()`.
- `src/lib/orders.ts` — `createOrder()`, `getOrders()`, `getOrderStats()`, `getRecentOrders()`, `getNewOrderCount()`; status enum lives in `src/lib/order-constants.ts`.
- `src/lib/pricing.ts` — `getPricingConfig()`, `updatePricingConfig()`, `calcPrice()` (ZAR ex-VAT → inc-VAT → +markup → NGN), `getPricingPreview()`.
- `src/lib/portfolio.ts` — `getPortfolioItems()`, `getPublishedPortfolioItems()`, `getPortfolioItemById()`.
- `src/lib/redis.ts` — Upstash Redis client, used to cache pricing config.
- `src/lib/amrod/` — Amrod API auth + catalogue sync (brands, categories, products, stock), with sync log table backing `/admin/amrod`.
- `src/lib/email.ts` + `src/lib/email-templates.ts` — order receipt/alert and contact-form emails, via Resend (`RESEND_API_KEY`) with SMTP/nodemailer fallback; no-ops (logs only) if neither is configured.
- Portfolio/content image uploads go through an S3-compatible bucket (`STORAGE_*` env vars, `@aws-sdk/client-s3`).
- `src/context/cart-context.tsx` — client cart: `addItem`/`removeItem`/`updateQuantity`/`clear`, localStorage-persisted, computes `count`/`total`.

## Known issues / operational notes
- **Neon DB connectivity from local dev machine is flaky** — DNS lookups and/or TCP connects to the Neon Postgres host intermittently time out from this machine's network, which broke `next build` static prerendering for DB-backed pages (`/portfolio`, formerly `/admin`). `/admin/*` is now `force-dynamic` so it's immune to this at build time; `/portfolio` and `/portfolio/[id]` still use `revalidate = 60` (ISR) by choice, so a build-time DB hiccup there will still fail `next build` — worth keeping an eye on if builds start failing again.

## Likely next steps
1. **Payment integration** — orders are currently created as "new" with no payment step; decide on a provider (Stripe/PayFast/etc.) if checkout needs to be self-service rather than manual-review.
2. **Revisit `/portfolio` build-time behavior** — decide whether to keep ISR (`revalidate = 60`, current choice) or move to `force-dynamic` like `/admin` if Neon connectivity issues keep breaking builds.
3. **Verify email transport is configured in production** — `sendEmail()` silently no-ops if neither `RESEND_API_KEY` nor `SMTP_HOST` is set; confirm one is set in the deploy environment so order receipts/alerts and contact form emails actually send.
