import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check, Download } from "lucide-react";
import PageReader from "@/components/reader/PageReader";
import HamperEnquiry, { enquiryHref } from "@/components/hampers/HamperEnquiry";
import HamperCard from "@/components/hampers/HamperCard";
import JsonLd from "@/components/JsonLd";
import {
  getHamperBySlug,
  getPublishedHampers,
  getRelatedHampers,
} from "@/lib/hampers";
import {
  absoluteUrl,
  breadcrumbSchema,
  faqSchema,
  ORGANIZATION_ID,
  SITE_NAME,
} from "@/lib/seo";

export const revalidate = 300;

type Props = { params: Promise<{ slug: string }> };

/** Prerenders every published hamper, so the first crawl hits a static page. */
export async function generateStaticParams() {
  const hampers = await getPublishedHampers();
  return hampers.map((hamper) => ({ slug: hamper.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const hamper = await getHamperBySlug(slug);

  if (!hamper) {
    return { title: "Hamper not found", robots: { index: false, follow: true } };
  }

  const title = hamper.metaTitle ?? `${hamper.name} — Corporate Gift Hamper`;
  const description =
    hamper.metaDescription ??
    hamper.tagline ??
    (hamper.description
      ? `${hamper.description.slice(0, 155).trimEnd()}…`
      : `${hamper.name}, a curated corporate gift hamper from ${SITE_NAME}, branded with your logo and delivered across Nigeria.`);

  const cover = hamper.pages[0];

  return {
    title,
    description,
    alternates: { canonical: `/hampers/${hamper.slug}` },
    openGraph: {
      title,
      description,
      url: absoluteUrl(`/hampers/${hamper.slug}`),
      type: "website",
      images: cover ? [{ url: cover.url, alt: cover.alt || hamper.name }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: cover ? [cover.url] : undefined,
    },
  };
}

export default async function HamperPage({ params }: Props) {
  const { slug } = await params;
  const hamper = await getHamperBySlug(slug);
  if (!hamper) notFound();

  const related = await getRelatedHampers(hamper.slug, hamper.occasions, 3);

  // An enquiry product: described in full, with no price and no offer.
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: hamper.name,
    description:
      hamper.metaDescription ?? hamper.description ?? hamper.tagline ?? hamper.name,
    sku: hamper.slug,
    image: hamper.pages.map((page) => page.url),
    brand: { "@type": "Brand", name: SITE_NAME },
    category: "Corporate gift hampers",
    manufacturer: { "@id": ORGANIZATION_ID },
    url: absoluteUrl(`/hampers/${hamper.slug}`),
  };

  return (
    <main className="bg-coal-grey/40">
      <JsonLd
        data={[
          productSchema,
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Hampers", path: "/hampers" },
            { name: hamper.name, path: `/hampers/${hamper.slug}` },
          ]),
          ...(hamper.faqs.length ? [faqSchema(hamper.faqs)] : []),
        ]}
      />

      {/* Colophon line, as on the brochures page */}
      <div className="border-b border-border">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-5">
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-2 font-raleway text-xs text-muted-foreground">
              <li>
                <Link href="/" className="hover:text-foreground">
                  Home
                </Link>
              </li>
              <li aria-hidden>/</li>
              <li>
                <Link href="/hampers" className="hover:text-foreground">
                  Hampers
                </Link>
              </li>
              <li aria-hidden>/</li>
              <li className="text-foreground">{hamper.name}</li>
            </ol>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-[24rem_1fr] lg:grid-rows-[auto_1fr] gap-x-16 xl:gap-x-20 gap-y-10 items-start">
          {/* Name first on a phone, then the hamper, then the detail */}
          <div className="lg:col-start-1 lg:row-start-1">
            <h1
              className="font-sarlotte font-bold text-foreground leading-[0.95] tracking-[-0.015em]"
              style={{ fontSize: "clamp(2.1rem, 4.4vw, 3.25rem)" }}
            >
              {hamper.name}
            </h1>
            {hamper.tagline && (
              <p className="font-sarlotte italic text-muted-foreground leading-tight mt-2 text-[clamp(1.1rem,2.2vw,1.5rem)]">
                {hamper.tagline}
              </p>
            )}
          </div>

          <div className="min-w-0 lg:col-start-2 lg:row-start-1 lg:row-span-2">
            <PageReader
              pages={hamper.pages}
              title={hamper.name}
              pageRatio={hamper.pageRatio}
              accent="yellow"
            />
          </div>

          <div className="lg:col-start-1 lg:row-start-2">
            {hamper.contents.length > 0 && (
              <section>
                <h2 className="font-sarlotte font-bold text-foreground text-xl mb-4">
                  What is inside
                </h2>
                <ul className="space-y-3">
                  {hamper.contents.map((entry) => (
                    <li key={entry.item} className="flex items-start gap-3">
                      <Check className="size-4 mt-1 shrink-0 text-dsp-yellow" />
                      <div className="font-raleway">
                        <span className="text-foreground text-[0.95rem]">
                          {entry.item}
                        </span>
                        {entry.note && (
                          <span className="block text-sm text-muted-foreground">
                            {entry.note}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <Link
              href={enquiryHref(hamper)}
              className="mt-8 inline-flex items-center justify-center gap-2 bg-dsp-yellow text-background font-sarlotte font-semibold text-base px-7 py-4 rounded-xl hover:brightness-110 transition-[filter] duration-200 w-full sm:w-auto"
            >
              Request this hamper
              <ArrowRight className="size-4" />
            </Link>
            {hamper.pdfUrl && (
              <a
                href={hamper.pdfUrl}
                download
                className="mt-3 inline-flex items-center justify-center gap-2 font-raleway text-sm text-foreground underline decoration-dsp-yellow decoration-2 underline-offset-4 hover:text-dsp-yellow transition-colors"
              >
                <Download className="size-3.5" />
                Download as a PDF
              </a>
            )}
            <p className="font-raleway text-xs text-muted-foreground mt-3">
              Priced to your quantities and branding. No obligation.
            </p>
          </div>
        </div>

        {/* ── Description ─────────────────────────────────── */}
        {hamper.description && (
          <section className="mt-16 lg:mt-24 border-t border-border pt-12">
            <h2 className="font-sarlotte font-bold text-foreground text-2xl sm:text-3xl mb-6">
              About {hamper.name}
            </h2>
            <div className="font-raleway text-muted-foreground leading-[1.8] max-w-[68ch] space-y-5">
              {hamper.description.split(/\n{2,}/).map((paragraph) => (
                <p key={paragraph.slice(0, 40)}>{paragraph}</p>
              ))}
            </div>
          </section>
        )}

        {/* ── The ask ─────────────────────────────────────── */}
        <div className="mt-14">
          <HamperEnquiry hamper={hamper} />
        </div>

        {/* ── FAQs ────────────────────────────────────────── */}
        {hamper.faqs.length > 0 && (
          <section className="mt-16 border-t border-border pt-12">
            <h2 className="font-sarlotte font-bold text-foreground text-2xl sm:text-3xl mb-7">
              Questions people ask
            </h2>
            <div className="max-w-[68ch] divide-y divide-border">
              {hamper.faqs.map((faq) => (
                <details key={faq.question} className="group py-4">
                  <summary className="font-raleway text-foreground cursor-pointer list-none flex items-start justify-between gap-4">
                    <span>{faq.question}</span>
                    <span
                      aria-hidden
                      className="text-dsp-yellow transition-transform group-open:rotate-45 shrink-0"
                    >
                      +
                    </span>
                  </summary>
                  <p className="font-raleway text-sm text-muted-foreground leading-relaxed mt-3">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* ── Related ─────────────────────────────────────── */}
        {related.length > 0 && (
          <section className="mt-16 border-t border-border pt-12">
            <h2 className="font-sarlotte font-bold text-foreground text-2xl sm:text-3xl mb-8">
              Other hampers
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
              {related.map((item) => (
                <HamperCard key={item.id} hamper={item} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
