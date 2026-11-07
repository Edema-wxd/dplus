import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Only block what is expensive to crawl. A blocked URL can still be
        // indexed from links, because the crawler never sees its noindex — so
        // /admin, /portal and /basket stay fetchable and rely on their noindex
        // meta tags and X-Robots-Tag headers (next.config). Product pages are
        // supplier copy, and crawling thousands of them kept the database awake;
        // /products itself stays crawlable so its noindex is seen.
        disallow: ["/api/", "/products/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
