/**
 * Canonical URLs and structured data.
 *
 * Set NEXT_PUBLIC_SITE_URL to the domain you want indexed — www and non-www
 * are different sites to a search engine, and the canonical must match the one
 * that actually serves traffic.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://de-signplus.com"
).replace(/\/$/, "");

export const SITE_NAME = "De-Sign Plus";

export const SITE_DESCRIPTION =
  "Corporate gifting, branded merchandise, workwear and custom branding for Nigerian business. Curated hampers, executive gifts and bulk branding, delivered nationwide.";

export function absoluteUrl(path = "/") {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export const ORGANIZATION_ID = `${SITE_URL}/#organization`;

/** Identity of the business, referenced by every other block on the site. */
export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    email: "support@de-signplus.com",
    telephone: "+234 912 512 0020",
    address: {
      "@type": "PostalAddress",
      addressCountry: "NG",
      addressRegion: "Lagos",
    },
    areaServed: { "@type": "Country", name: "Nigeria" },
    sameAs: [
      "https://www.instagram.com/de.sign_plus",
      "https://www.facebook.com/De.SignPlusNig/",
      "https://www.linkedin.com/company/de-sign-plus/",
    ],
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: SITE_NAME,
    publisher: { "@id": ORGANIZATION_ID },
  };
}

/** Trail shown in search results; every crumb needs an absolute URL. */
export function breadcrumbSchema(trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

export function faqSchema(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
}
