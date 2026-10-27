import { revalidatePath } from "next/cache";

/**
 * On-demand ISR refreshes, called from route handlers after content changes.
 *
 * Public pages cache for a day so crawlers and visitors don't keep the Neon
 * compute awake. These calls are what make an admin edit show up right away
 * instead of when that window runs out.
 *
 * Route patterns must include the `(site)` route group: the cache tags Next
 * stores on each page follow the file path, not the URL.
 */

const SITEMAP = "/sitemap.xml";

export function revalidateCatalogue() {
  revalidatePath("/products");
  revalidatePath("/(site)/products/[id]", "page");
}

export function revalidatePortfolio() {
  revalidatePath("/portfolio");
  revalidatePath("/(site)/portfolio/[id]", "page");
  revalidatePath(SITEMAP);
}

export function revalidateBrochures() {
  revalidatePath("/brochures");
  revalidatePath(SITEMAP);
}

export function revalidateHampers() {
  revalidatePath("/hampers");
  revalidatePath("/(site)/hampers/[slug]", "page");
  revalidatePath(SITEMAP);
}
