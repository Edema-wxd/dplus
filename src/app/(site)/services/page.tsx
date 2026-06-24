import Link from "next/link";
import { Gift, Package, HardHat, Palette, ArrowRight } from "lucide-react";

const services = [
  {
    icon: Gift,
    title: "Corporate Gifting",
    description:
      "Premium, bespoke gifts curated for executive-level recipients. Handpicked items that leave lasting impressions at client meetings, year-end functions, and milestone events — sourced globally, delivered with Nigerian precision.",
  },
  {
    icon: Package,
    title: "Branded Merchandise",
    description:
      "Custom merchandise aligned with your brand identity. From branded apparel to promotional items, we deliver at scale for campaigns, conferences, trade shows, and staff recognition programmes.",
  },
  {
    icon: HardHat,
    title: "Workwear & PPE",
    description:
      "Professional workwear and personal protective equipment branded with your company identity. Compliant, durable, and tailored to your sector — from construction and manufacturing to hospitality and healthcare.",
  },
  {
    icon: Palette,
    title: "Custom Branding",
    description:
      "Full-service brand application across products and promotional materials. Embroidery, screen-printing, laser engraving, and custom packaging solutions for a cohesive, high-impact brand presence.",
  },
];

export default function ServicesPage() {
  return (
    <main>
      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="relative py-20 lg:py-28 overflow-hidden bg-gradient-to-b from-background to-coal-grey/40">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="font-raleway text-[10px] tracking-[0.2em] uppercase text-dsp-yellow mb-4">
              What We Do
            </p>
            <h1 className="font-sarlotte font-bold text-foreground leading-[1.07] mb-6"
                style={{ fontSize: "clamp(2.4rem, 6vw, 4rem)" }}>
              Elevating Brands Through{" "}
              <span className="text-dsp-yellow italic">Curated Excellence</span>
            </h1>
            <p className="font-raleway text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl">
              De-Sign Plus offers four core services designed for Nigerian businesses
              that understand the power of presentation. Every engagement is handled
              with discretion, quality, and an eye for detail that closes deals.
            </p>
          </div>
        </div>
      </section>

      {/* ── Services grid ─────────────────────────────────── */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {services.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="group rounded-2xl border border-border bg-foreground/5 p-8 hover:bg-foreground/[0.08] hover:border-foreground/20 transition-colors duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-dsp-yellow/10 flex items-center justify-center mb-6">
                  <Icon className="w-6 h-6 text-dsp-yellow" />
                </div>
                <h2 className="font-sarlotte font-bold text-foreground text-2xl mb-3 group-hover:text-dsp-yellow transition-colors duration-300">
                  {title}
                </h2>
                <p className="font-raleway text-muted-foreground leading-relaxed text-[0.95rem]">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────── */}
      <section className="py-16 lg:py-24 border-t border-border">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <h2 className="font-sarlotte font-bold text-foreground text-2xl sm:text-3xl mb-2">
                Ready to start a project?
              </h2>
              <p className="font-raleway text-muted-foreground text-sm sm:text-base">
                Tell us what you need — we&apos;ll handle the rest.
              </p>
            </div>
            <Link
              href="/contact-us"
              className="inline-flex items-center gap-2 shrink-0 bg-foreground text-background font-sarlotte font-semibold px-7 py-3.5 rounded-xl hover:bg-foreground/90 hover:scale-105 transition-all duration-300 text-base"
            >
              Get in Touch
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
