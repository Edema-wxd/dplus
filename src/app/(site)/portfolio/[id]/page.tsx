import { notFound } from "next/navigation";
import Link from "next/link";
import { getPortfolioItemById } from "@/lib/portfolio";
import { ArrowLeft, ArrowRight } from "lucide-react";

export const revalidate = 60;

export default async function PortfolioDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numId = Number(id);
  if (!Number.isFinite(numId)) notFound();

  const item = await getPortfolioItemById(numId);
  if (!item || !item.isPublished) notFound();

  const mainImg = item.images.find((i) => i.isMain) ?? item.images[0] ?? null;
  const otherImgs = item.images.filter((i) => i !== mainImg);

  return (
    <main>
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
                alt={img.alt || `${item.title} — image ${i + 2}`}
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
