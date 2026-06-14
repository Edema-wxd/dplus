# De-Sign Plus — Project Status

_Last reviewed: 2026-06-14_

## Overview
"dplus" (De-Sign Plus) is a Next.js 15 (App Router) + React 19 + Tailwind v4 marketing/portfolio site, bootstrapped from `create-next-app`. Uses shadcn/ui (Radix), framer-motion, sonner for toasts, next-themes, and custom "Sarlotte" font + Raleway.

## Current branch state
- On `main`, up to date with `origin/main`.
- Uncommitted changes:
  - `.gitignore` modified (+9 lines)
  - `package.json` / `package-lock.json` modified (Next.js bumped to 15.5.9, large lockfile diff)
  - Untracked: `.mcp.json`, `skills-lock.json` (tooling/MCP config, not app code)
- Recent history: CVE fix for React Server Components, Next.js version bump, Portfolio/Hero/SubHero refactors, Footer/Navbar/CTA/Services additions.

## Pages — implementation status
| Route | File | Status |
|---|---|---|
| `/` (Home) | `src/app/page.tsx` | ✅ Built — Hero, Services, CTA |
| `/services` | `src/app/services/page.tsx` | ❌ Stub (`<div>page</div>`) |
| `/portfolio` | `src/app/portfolio/page.tsx` | ❌ Stub (`<div>page</div>`) |
| `/portfolio/[id]` | `src/app/portfolio/[id]/page.tsx` | ✅ Built — SubHero, Challenge, Quote, CTA; reads from `src/mock/data.ts` |
| `/contact-us` | `src/app/contact-us/page.tsx` | ✅ Built — Hero + Contact form |
| `/privacy` | `src/app/privacy/page.tsx` | ❌ Stub |
| `/terms-of-service` | `src/app/terms-of-service/page.tsx` | ❌ Stub |

Global layout (`src/app/layout.tsx`) wires up Navbar, Footer, Toaster, and both font families — appears complete.

## Components
- `home/`: Navbar, Footer, Hero, Services, CTA — all built
- `portfolio/`: Hero, SubHero, Challenge, Quote, CTA — built (used by `/portfolio/[id]`), but the `/portfolio` index page itself is still a stub (likely needs a project listing/grid using these or new components)
- `contact/`: Hero, Contact — built
- `ui/`: shadcn primitives (alert, button, navigation-menu, sonner)

## Data
- `src/mock/data.ts` defines a `Project` type and `projectsData` array used to drive `/portfolio/[id]`. Sample data only ("Project 1", "Description 1", etc.) — needs real content/images.

## Likely next steps
1. Build out `/portfolio` index page (grid/list of projects from `projectsData`, linking to `/portfolio/[id]`).
2. Build `/services` page content.
3. Fill in `/privacy` and `/terms-of-service` legal copy.
4. Replace placeholder project data/images in `src/mock/data.ts` with real content.
5. Decide whether to commit the pending `.gitignore`/`package.json`/lockfile changes (Next.js 15.5.9 bump) and the untracked `.mcp.json`/`skills-lock.json` tooling files.
