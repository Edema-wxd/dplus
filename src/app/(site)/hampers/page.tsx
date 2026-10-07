import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import HamperCard from "@/components/hampers/HamperCard";
import JsonLd from "@/components/JsonLd";
import { getPublishedHampers } from "@/lib/hampers";
import { absoluteUrl, breadcrumbSchema, ORGANIZATION_ID } from "@/lib/seo";

export const revalidate = 300;

const TITLE = "Corporate Gift Hampers in Nigeria";
const DESCRIPTION =
  "Curated corporate gift hampers for Nigerian businesses: Christmas hampers, client appreciation gifts and employee welcome packs, branded with your logo and delivered nationwide.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/hampers" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: absoluteUrl("/hampers"),
    type: "website",
  },
};

export default async function HampersPage() {
  const hampers = await getPublishedHampers();

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: TITLE,
    itemListElement: hampers.map((hamper, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: hamper.name,
      url: absoluteUrl(`/hampers/${hamper.slug}`),
    })),
  };

  return (
    <main>
      <JsonLd
        data={[
          itemList,
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Hampers", path: "/hampers" },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: TITLE,
            description: DESCRIPTION,
            url: absoluteUrl("/hampers"),
            isPartOf: { "@id": ORGANIZATION_ID },
          },
        ]}
      />

      {/* ── Intro ─────────────────────────────────────────── */}
      <section className="py-16 lg:py-24 bg-gradient-to-b from-background to-coal-grey/40">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex items-center gap-2 font-raleway text-xs text-muted-foreground">
              <li>
                <Link href="/" className="hover:text-foreground">
                  Home
                </Link>
              </li>
              <li aria-hidden>/</li>
              <li className="text-foreground">Hampers</li>
            </ol>
          </nav>

          <h1
            className="font-sarlotte font-bold text-foreground leading-[1.07] max-w-3xl"
            style={{ fontSize: "clamp(2.2rem, 5.5vw, 3.6rem)" }}
          >
            {TITLE}
          </h1>

          <div className="mt-6 max-w-2xl space-y-4 font-raleway text-base text-muted-foreground leading-relaxed">
            <p>
              A hamper is the gift people remember opening. Ours are put
              together for Nigerian corporate occasions, from year-end client
              gifting to welcoming a new hire, and every item inside can carry
              your branding.
            </p>
            <p>
              Order by the dozen or by the thousand. Each hamper is quoted
              against your quantities and branding, and we handle sourcing,
              packing and delivery to one address or many, anywhere in Nigeria.
            </p>
          </div>
        </div>
      </section>

      {/* ── The hampers ───────────────────────────────────── */}
      <section className="py-14 lg:py-20 border-t border-border">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          {hampers.length === 0 ? (
            <div className="py-10">
              <h2 className="font-sarlotte font-bold text-foreground text-2xl mb-3">
                This season&apos;s hampers are being packed
              </h2>
              <p className="font-raleway text-sm text-muted-foreground max-w-[46ch] leading-relaxed">
                Tell us the occasion, the headcount and the budget, and we will
                put a selection in front of you.{" "}
                <Link
                  href="/contact-us"
                  className="text-foreground underline decoration-dsp-yellow decoration-2 underline-offset-4"
                >
                  Start a conversation
                </Link>
                .
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
              {hampers.map((hamper, i) => (
                <HamperCard key={hamper.id} hamper={hamper} priority={i < 3} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Close ─────────────────────────────────────────── */}
      <section className="py-14 lg:py-20 border-t border-border">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <h2 className="font-sarlotte font-bold text-foreground text-2xl sm:text-3xl mb-2">
Not quite what you had in mind?
            </h2>
            <p className="font-raleway text-sm sm:text-base text-muted-foreground max-w-[52ch]">
              We build hampers to a brief and a budget. Send us the occasion
              and the headcount, and we will come back within one working day.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link
              href="/contact-us?service=hampers#contact-form"
              className="inline-flex items-center justify-center gap-2 bg-dsp-yellow text-background font-sarlotte font-semibold px-7 py-4 rounded-xl hover:brightness-110 transition-[filter] duration-200"
            >
              Tell us what you need
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/brochures"
              className="inline-flex items-center justify-center border border-foreground/15 text-foreground font-sarlotte px-7 py-3.5 rounded-xl hover:bg-foreground hover:text-background transition-colors"
            >
              Browse the brochure
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
