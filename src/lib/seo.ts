/**
 * Canonical URLs and structured data.
 *
 * Set NEXT_PUBLIC_SITE_URL to the domain you want indexed — www and non-www
 * are different sites to a search engine, and the canonical must match the one
 * that actually serves traffic.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.de-signplus.com"
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

/** Four services, used for both the page copy and its structured data. */
export const SERVICES = [
  {
    slug: "corporate-gifting",
    name: "Corporate Gifting",
    description:
      "Premium, bespoke gifts curated for executive-level recipients, sourced globally and delivered across Nigeria.",
  },
  {
    slug: "branded-merchandise",
    name: "Branded Merchandise",
    description:
      "Custom merchandise aligned with your brand identity, delivered at scale for campaigns, conferences and trade shows.",
  },
  {
    slug: "workwear-ppe",
    name: "Workwear & PPE",
    description:
      "Professional workwear and personal protective equipment branded with your company identity, compliant and sector-tailored.",
  },
  {
    slug: "custom-branding",
    name: "Custom Branding",
    description:
      "Embroidery, screen-printing, laser engraving and custom packaging applied across products and promotional materials.",
  },
] as const;

/**
 * The generated card at app/opengraph-image.tsx.
 *
 * It has to be named explicitly: metadata objects merge shallowly, so a page
 * that sets `openGraph` replaces the root's — and with it the image Next
 * attaches from the file convention. Pages that set no openGraph at all would
 * still inherit it, but every page here sets one.
 */
export const DEFAULT_OG_IMAGE = {
  url: absoluteUrl("/opengraph-image"),
  width: 1200,
  height: 630,
  alt: `${SITE_NAME} — corporate gifting and branded merchandise in Nigeria`,
};

type PageMetaInput = {
  title: string;
  description: string;
  path: string;
  /** Catalogue and basket pages are followed for links but kept out of the index. */
  noindex?: boolean;
  images?: string[];
};

/**
 * Builds a page's metadata with its canonical already set.
 *
 * Canonicals must be declared per page: a canonical set on the root layout is
 * inherited by every page that doesn't override it, which tells search engines
 * the whole site is a duplicate of the homepage.
 */
export function pageMetadata({
  title,
  description,
  path,
  noindex = false,
  images,
}: PageMetaInput) {
  const url = absoluteUrl(path);
  const ogImages = images?.length ? images : [DEFAULT_OG_IMAGE];
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      locale: "en_NG",
      type: "website" as const,
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image" as const,
      title,
      description,
      images: ogImages,
    },
    ...(noindex
      ? { robots: { index: false, follow: true, googleBot: { index: false, follow: true } } }
      : {}),
  };
}

/** One offering, tied back to the business that provides it. */
export function serviceSchema(service: {
  name: string;
  description: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.name,
    description: service.description,
    serviceType: service.name,
    provider: { "@id": ORGANIZATION_ID },
    areaServed: { "@type": "Country", name: "Nigeria" },
  };
}

/** An ordered list of pages, used on index pages like the portfolio. */
export function itemListSchema(
  name: string,
  items: { name: string; path: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: items.length,
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      url: absoluteUrl(item.path),
    })),
  };
}
