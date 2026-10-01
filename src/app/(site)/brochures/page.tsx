import Link from "next/link";
import { Download } from "lucide-react";
import BrochureReader from "@/components/brochures/BrochureReader";
import { getBrochures, type Brochure } from "@/lib/brochures";

export const metadata = {
  title: "Brochures - De-Sign Plus",
  description:
    "Read the De-Sign Plus brochures online, including the 2026 Corporate Christmas collection of executive gifts, hampers and branded keepsakes, and download the PDF to share.",
};

function fileNote(brochure: Brochure) {
  const pages = brochure.images.length;
  const size = brochure.pdfSizeLabel;
  if (pages && size) return `A ${pages}-page PDF, ${size}.`;
  if (pages) return `${pages} pages.`;
  if (size) return `PDF, ${size}.`;
  return null;
}

export default function BrochuresPage() {
  const brochures = getBrochures();

  return (
    <main className="bg-coal-grey/50">
      {/* Colophon line: what this shelf holds */}
      <div className="border-b border-border">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-5 flex items-baseline justify-between gap-6">
          <h1 className="font-sarlotte font-bold text-foreground text-xl">
            Brochures
          </h1>
          <p className="font-raleway text-[0.72rem] text-muted-foreground tabular-nums">
            {brochures.length === 1
              ? "One edition in print"
              : `${brochures.length} editions in print`}
          </p>
        </div>
      </div>

      {brochures.map((brochure) => {
        const note = fileNote(brochure);

        return (
          <section
            key={brochure.slug}
            id={brochure.slug}
            className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-12 lg:py-20 border-b border-border last:border-b-0"
          >
            <div className="grid grid-cols-1 lg:grid-cols-[22rem_1fr] lg:grid-rows-[auto_1fr] gap-x-16 xl:gap-x-20 gap-y-10 items-start">
              {/* Title, then the brochure itself, then the detail — in that
                  order on a phone, two columns from lg up. */}
              <div className="lg:col-start-1 lg:row-start-1">
                <h2 className="font-sarlotte font-bold text-foreground leading-[0.95] tracking-[-0.015em] text-[clamp(2.1rem,4.4vw,3.25rem)]">
                  {brochure.name}
                </h2>
                <p className="font-sarlotte italic text-muted-foreground leading-tight mt-1.5 text-[clamp(1.25rem,2.4vw,1.75rem)]">
                  {brochure.edition}
                </p>
              </div>

              <div className="min-w-0 lg:col-start-2 lg:row-start-1 lg:row-span-2">
                <BrochureReader
                  images={brochure.images}
                  title={brochure.title}
                  pageRatio={brochure.pageRatio}
                />
              </div>

              <div className="lg:col-start-1 lg:row-start-2">
                <p className="font-raleway text-[0.95rem] text-muted-foreground leading-[1.75] max-w-[46ch]">
                  {brochure.description}
                </p>

                <div className="mt-8">
                  {brochure.pdfUrl ? (
                    <>
                      <a
                        href={brochure.pdfUrl}
                        download
                        className="inline-flex items-center gap-2.5 bg-dsp-red text-white font-sarlotte font-semibold text-base px-7 py-3.5 rounded-xl hover:brightness-95 transition-[filter] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dsp-red"
                      >
                        <Download className="w-4 h-4" strokeWidth={2} />
                        Download the brochure
                      </a>
                      {note && (
                        <p className="font-raleway text-[0.72rem] text-muted-foreground mt-3">
                          {note} Share it with whoever signs off.
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <Link
                        href="/contact-us"
                        className="inline-flex items-center gap-2.5 bg-dsp-red text-white font-sarlotte font-semibold text-base px-7 py-3.5 rounded-xl hover:brightness-95 transition-[filter] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dsp-red"
                      >
                        Ask us for the PDF
                      </Link>
                      <p className="font-raleway text-[0.72rem] text-muted-foreground mt-3">
                        We will email it to you, usually the same working day.
                      </p>
                    </>
                  )}
                </div>

                <p className="font-raleway text-[0.85rem] text-muted-foreground leading-relaxed mt-9 pt-7 border-t border-border max-w-[42ch]">
                  Found something?{" "}
                  <Link
                    href="/contact-us"
                    className="text-foreground underline decoration-dsp-red decoration-2 underline-offset-4 hover:text-dsp-red transition-colors"
                  >
                    Send us the page numbers
                  </Link>{" "}
                  with your quantities and we will come back with costs and lead
                  times.
                </p>
              </div>
            </div>
          </section>
        );
      })}
    </main>
  );
}
