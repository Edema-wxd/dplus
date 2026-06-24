import Link from "next/link";
import { getPublishedPortfolioItems } from "@/lib/portfolio";
import { ArrowRight } from "lucide-react";

export const revalidate = 60;

export default async function PortfolioPage() {
  const items = await getPublishedPortfolioItems();

  return (
    <main>
      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="py-20 lg:py-28 bg-gradient-to-b from-background to-coal-grey/40">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="font-raleway text-[10px] tracking-[0.2em] uppercase text-dsp-yellow mb-4">
              Our Work
            </p>
            <h1
              className="font-sarlotte font-bold text-foreground leading-[1.07] mb-6"
              style={{ fontSize: "clamp(2.4rem, 6vw, 4rem)" }}
            >
              Projects That{" "}
              <span className="text-dsp-yellow italic">Speak for Themselves</span>
            </h1>
            <p className="font-raleway text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl">
              A selection of curated gifting, branding, and merchandise projects
              delivered to clients across Nigeria and beyond.
            </p>
          </div>
        </div>
      </section>

      {/* ── Grid ──────────────────────────────────────────── */}
      <section className="py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-2xl bg-foreground/5 border border-border flex items-center justify-center mb-5">
                <ArrowRight className="w-7 h-7 text-muted-foreground/40" />
              </div>
              <h2 className="font-sarlotte font-bold text-foreground text-xl mb-2">
                Nothing published yet
              </h2>
              <p className="font-raleway text-muted-foreground text-sm max-w-xs">
                Portfolio projects will appear here once they&apos;re published.
                Check back soon.
              </p>
              <Link
                href="/contact-us"
                className="mt-6 inline-flex items-center gap-2 font-sarlotte text-sm text-dsp-yellow hover:opacity-80 transition-opacity"
              >
                Start a project with us
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {items.map((item) => {
                const mainImg =
                  item.images.find((i) => i.isMain) ?? item.images[0] ?? null;
                return (
                  <Link
                    key={item.id}
                    href={`/portfolio/${item.id}`}
                    className="group flex flex-col rounded-2xl border border-border bg-foreground/5 overflow-hidden hover:border-foreground/20 hover:bg-foreground/[0.08] transition-colors duration-300"
                  >
                    {/* Image */}
                    <div className="aspect-[4/3] bg-muted overflow-hidden">
                      {mainImg ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={mainImg.url}
                          alt={mainImg.alt || item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                          <span className="font-sarlotte text-4xl">D+</span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex flex-col gap-2 p-5 flex-1">
                      <h2 className="font-sarlotte font-bold text-foreground text-lg leading-snug group-hover:text-dsp-yellow transition-colors duration-300">
                        {item.title}
                      </h2>
                      {item.client && (
                        <p className="font-raleway text-xs text-muted-foreground">
                          {item.client}
                        </p>
                      )}
                      {item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-auto pt-3">
                          {item.tags.slice(0, 4).map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-foreground/10 px-2.5 py-0.5 font-raleway text-[11px] text-muted-foreground"
                            >
                              {tag}
                            </span>
                          ))}
                          {item.tags.length > 4 && (
                            <span className="rounded-full bg-foreground/10 px-2.5 py-0.5 font-raleway text-[11px] text-muted-foreground">
                              +{item.tags.length - 4}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
