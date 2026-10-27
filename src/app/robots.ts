import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Private or thin pages that should never appear in search. Product
        // pages are supplier copy, and crawling thousands of them kept the
        // database awake; /products itself stays crawlable so its noindex is seen.
        disallow: ["/admin", "/admin/", "/portal", "/api/", "/basket", "/products/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
