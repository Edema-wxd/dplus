# De-Sign Plus — Project Status

_Last reviewed: 2026-06-15_

## Overview
"dplus" (De-Sign Plus) is a Next.js 15 (App Router) + React 19 + Tailwind v4 site that has grown from a marketing/portfolio site into a small e-commerce + admin platform: a customer-facing storefront (products, basket, checkout-to-order) backed by Postgres, an Amrod catalogue sync integration, and a password-protected admin dashboard for orders, pricing, and content.

Stack: shadcn/ui (Radix), framer-motion, sonner, next-themes, NextAuth v5 (beta, credentials provider), `pg` for Postgres, `@upstash/redis` for caching, custom "Sarlotte" + Raleway fonts.

## Current branch state
- On `main`. Large uncommitted working tree — this represents an in-progress restructure, not yet committed:
  - **Layout restructure**: customer-facing routes moved into a `src/app/(site)/` route group with their own layout (Navbar/Footer/CartProvider/Toaster); root `layout.tsx` trimmed to fonts + ThemeProvider only. Admin (`src/app/admin/*`) now has its own dashboard layout, not the site chrome.
  - **Login moved**: `src/app/admin/login` → `src/app/portal/page.tsx` (top-level route, outside the `/admin` auth matcher) to avoid redirect loops; `middleware.ts` and `auth.config.ts` updated accordingly.
  - New: pricing system (`src/lib/pricing.ts`, `src/lib/redis.ts`, `src/app/admin/pricing/`, `src/app/api/admin/pricing/*`), orders system (`src/lib/orders.ts`, `src/app/api/orders/`, `src/app/admin/orders/`), cart (`src/context/cart-context.tsx`), product detail UI (`src/components/products/ProductDetailClient.tsx`), theme provider/toggle.
  - New schema docs: `docs/orders-schema.sql`, `docs/pricing-schema.sql` (not yet committed).
  - `package.json`/`package-lock.json` modified (dependency additions for the above).
- Recent commits: Amrod brands/categories sync, admin auth + Amrod catalogue integration, Next.js 15.5.9 bump, RSC CVE fix, portfolio/hero/footer refactors.

## Routes — implementation status

### Customer site (`src/app/(site)/`)
| Route | Status |
|---|---|
| `/` | ✅ Built — Hero, Services, CTA |
| `/products` | ✅ Built — paginated/searchable listing from Postgres, NGN pricing via `calcPrice()` |
| `/products/[id]` | ✅ Built — variants, branding/logo selection, basket integration |
| `/basket` | ✅ Built — cart UI (localStorage + context), submits to `/api/orders` |
| `/portfolio` | ✅ Built — project listing |
| `/portfolio/[id]` | ✅ Built — SubHero, Challenge, Quote, CTA |
| `/contact-us` | ✅ Built — Hero + Contact form |
| `/services` | ✅ Built |
| `/privacy` | ✅ Built |
| `/terms-of-service` | ✅ Built |

### Admin (`src/app/admin/`, guarded by NextAuth middleware)
| Route | Status |
|---|---|
| `/admin` | ❌ Stub — placeholder dashboard overview only |
| `/admin/orders` | ✅ Built — read-only order list (customer, items, total, status); **no status-update action yet** |
| `/admin/pricing` | ✅ Built — VAT / markup / ZAR→NGN exchange rate config form, shows last-updated-by |
| `/admin/amrod` | ❌ Stub — "Trigger and monitor Amrod sync", no UI |
| `/admin/content` | ❌ Stub — "Manage portfolio projects and site content", no UI |
| `/portal` | ✅ Built — admin login (credentials), outside `/admin` route group |

### API routes (`src/app/api/`)
| Route | Status |
|---|---|
| `/api/auth/[...nextauth]` | ✅ NextAuth credentials provider, `admin_users` table |
| `/api/orders` (POST) | ✅ Validates + persists order (JSONB items) |
| `/api/products` | ✅ Product fetch for listing/detail |
| `/api/admin/pricing` (GET/PATCH) | ✅ Read/update pricing config, Redis-cached, auth-protected |
| `/api/admin/pricing/preview` | ✅ Preview pricing calc against config changes |
| `/api/cron/amrod-daily`, `/api/cron/amrod-weekly` | ✅ Scheduled Amrod sync jobs |

## Data layer
- **Postgres** (`src/lib/db.ts` — pooled client). Tables: `products`, `brands`, `categories`, `product_prices`, `product_stock` (via Amrod sync), `orders` (JSONB items + status), `pricing_config` (single-row, see `docs/pricing-schema.sql`), `admin_users`.
- `src/lib/products.ts` — `getProducts()`, `getProductDetail()`, `getRelatedProducts()`, `getBrandOptions()`, `getTopCategoryOptions()`.
- `src/lib/orders.ts` — `createOrder()`, `getOrders()`.
- `src/lib/pricing.ts` — `getPricingConfig()`, `updatePricingConfig()`, `calcPrice()` (ZAR ex-VAT → inc-VAT → +markup → NGN), `getPricingPreview()`.
- `src/lib/redis.ts` — Upstash Redis client, used to cache pricing config.
- `src/lib/amrod/` — Amrod API auth + catalogue sync (brands, categories, products, stock).
- `src/context/cart-context.tsx` — client cart: `addItem`/`removeItem`/`updateQuantity`/`clear`, localStorage-persisted, computes `count`/`total`.

## Likely next steps
1. **Commit the in-progress restructure** — the `(site)`/admin layout split, `/portal` login move, pricing/orders/cart systems are all uncommitted. Review and split into logical commits (layout restructure, pricing feature, orders feature, Amrod sync) before it grows further.
2. **Build out `/admin`** — replace the placeholder dashboard with real summary widgets (recent orders, pending sync status, pricing snapshot).
3. **Order status workflow** — `/admin/orders` is read-only; add status transitions (new → reviewing → confirmed/cancelled) with persistence via a PATCH endpoint.
4. **`/admin/amrod`** — build sync trigger UI + last-run/status display for the existing cron-based sync jobs.
5. **`/admin/content`** — CMS-lite UI for portfolio projects (currently `src/mock/data.ts`) and other site content.
6. **Payment integration** — orders are currently created as "new" with no payment step; decide on a provider (Stripe/PayFast/etc.) if checkout needs to be self-service rather than manual-review.
7. **Email notifications** — no email service wired for order confirmations or admin alerts on new orders.
8. **Replace mock portfolio data** — `src/mock/data.ts` still holds placeholder project content/images.
