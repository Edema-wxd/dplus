import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { cache } from "react";
import JsonLd from "@/components/JsonLd";
import {
  ORGANIZATION_ID,
  absoluteUrl,
  breadcrumbSchema,
  pageMetadata,
} from "@/lib/seo";
import { getPortfolioItemById } from "@/lib/portfolio";
import { ArrowLeft, ArrowRight } from "lucide-react";

// Cached for a day: every regeneration wakes the Neon compute. Admin edits
// refresh it on demand (see src/lib/revalidate.ts).
export const revalidate = 86400;

/**
 * Without this the route renders on every request despite `revalidate`; an
 * empty list caches each project the first time it is visited.
 */
export async function generateStaticParams() {
  return [];
}

/** Shared by generateMetadata and the page, so the row is read once. */
const getItem = cache(async (id: string) => {
  const numId = Number(id);
  if (!Number.isFinite(numId)) return null;
  const item = await getPortfolioItemById(numId);
  return item && item.isPublished ? item : null;
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const item = await getItem(id);
  if (!item) return { title: "Project not found", robots: { index: false, follow: false } };

  const image = item.images.find((i) => i.isMain) ?? item.images[0];
  const description =
    item.description?.trim() ||
    `${item.title} — a corporate gifting and branding project delivered by De-Sign Plus${
      item.client ? ` for ${item.client}` : ""
    }.`;

  return pageMetadata({
    title: item.client ? `${item.title} — ${item.client}` : item.title,
    description: description.slice(0, 300),
    path: `/portfolio/${item.id}`,
    images: image ? [image.url] : undefined,
  });
}

export default async function PortfolioDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getItem(id);
  if (!item) notFound();

  const mainImg = item.images.find((i) => i.isMain) ?? item.images[0] ?? null;
  const otherImgs = item.images.filter((i) => i !== mainImg);

  return (
    <main>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Portfolio", path: "/portfolio" },
            { name: item.title, path: `/portfolio/${item.id}` },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "CreativeWork",
            name: item.title,
            url: absoluteUrl(`/portfolio/${item.id}`),
            ...(item.description ? { description: item.description } : {}),
            ...(item.tags.length ? { keywords: item.tags.join(", ") } : {}),
            ...(mainImg ? { image: mainImg.url } : {}),
            creator: { "@id": ORGANIZATION_ID },
            dateModified: item.updatedAt,
          },
        ]}
      />
      {/* ── Hero image ──────────────────────────────────── */}
      <div className="w-full aspect-[16/7] bg-muted overflow-hidden">
        {mainImg ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mainImg.url}
            alt={mainImg.alt || item.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground/20">
            <span className="font-sarlotte text-7xl">D+</span>
          </div>
        )}
      </div>

      {/* ── Content ─────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-5 sm:px-6 lg:px-8 py-14 lg:py-20">
        {/* Back */}
        <Link
          href="/portfolio"
          className="inline-flex items-center gap-1.5 font-raleway text-xs text-muted-foreground hover:text-foreground transition-colors mb-10"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          All Projects
        </Link>

        {/* Tags */}
        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-5">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-dsp-yellow/10 px-3 py-0.5 font-raleway text-xs text-dsp-yellow"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h1
          className="font-sarlotte font-bold text-foreground leading-[1.07] mb-4"
          style={{ fontSize: "clamp(2rem, 5vw, 3.25rem)" }}
        >
          {item.title}
        </h1>

        {/* Client */}
        {item.client && (
          <p className="font-raleway text-sm text-muted-foreground mb-8">
            Client:{" "}
            <span className="text-foreground font-medium">{item.client}</span>
          </p>
        )}

        {/* Description */}
        {item.description && (
          <p className="font-raleway text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl">
            {item.description}
          </p>
        )}

        {/* Additional images */}
        {otherImgs.length > 0 && (
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {otherImgs.map((img, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={img.url}
                alt={img.alt || `${item.title} - image ${i + 2}`}
                className="w-full rounded-xl object-cover aspect-[4/3] bg-muted"
              />
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-16 pt-10 border-t border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <p className="font-raleway text-xs uppercase tracking-[0.15em] text-dsp-yellow mb-1">
              Interested?
            </p>
            <h2 className="font-sarlotte font-bold text-foreground text-xl sm:text-2xl">
              Let&apos;s build something like this for you.
            </h2>
          </div>
          <Link
            href="/contact-us"
            className="inline-flex items-center gap-2 shrink-0 bg-foreground text-background font-sarlotte font-semibold px-6 py-3 rounded-xl hover:bg-foreground/90 transition-colors text-base"
          >
            Get in Touch
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
