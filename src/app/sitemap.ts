import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { getPublishedHampers } from "@/lib/hampers";
import { getPublishedBrochures } from "@/lib/brochures";
import { getPublishedPortfolioItems } from "@/lib/portfolio";

export const revalidate = 3600;

const STATIC_ROUTES: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}> = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/hampers", changeFrequency: "weekly", priority: 0.9 },
  { path: "/services", changeFrequency: "monthly", priority: 0.8 },
  { path: "/portfolio", changeFrequency: "weekly", priority: 0.7 },
  { path: "/brochures", changeFrequency: "monthly", priority: 0.7 },
  { path: "/about-us", changeFrequency: "yearly", priority: 0.5 },
  { path: "/contact-us", changeFrequency: "yearly", priority: 0.6 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.1 },
  { path: "/terms-of-service", changeFrequency: "yearly", priority: 0.1 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // A database that is down must not take the sitemap with it.
  const [hampers, brochures, portfolio] = await Promise.all([
    getPublishedHampers().catch(() => []),
    getPublishedBrochures().catch(() => []),
    getPublishedPortfolioItems().catch(() => []),
  ]);

  const now = new Date();
  // The brochures page changes when its newest edition does.
  const brochuresUpdated = brochures.length
    ? new Date(
        Math.max(...brochures.map((b) => new Date(b.updatedAt).getTime()))
      )
    : now;

  return [
    ...STATIC_ROUTES.map((route) => ({
      url: `${SITE_URL}${route.path === "/" ? "" : route.path}`,
      lastModified: route.path === "/brochures" ? brochuresUpdated : now,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })),
    ...hampers.map((hamper) => ({
      url: `${SITE_URL}/hampers/${hamper.slug}`,
      lastModified: new Date(hamper.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
    ...portfolio.map((item) => ({
      url: `${SITE_URL}/portfolio/${item.id}`,
      lastModified: new Date(item.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
