import Link from "next/link";
import Image from "next/image";
import {
  Gem,
  Globe2,
  ShieldCheck,
  Clock,
  ArrowRight,
} from "lucide-react";

export const metadata = {
  title: "About Us - De-Sign Plus",
  description:
    "De-Sign Plus is Nigeria's luxury curation house for corporate gifting, branded merchandise, workwear, and custom branding.",
};

const values = [
  {
    icon: Gem,
    title: "Curation Over Catalogue",
    description:
      "We do not simply fill orders. Every item we present is chosen for how it will be received, how it will be remembered, and what it says about the brand behind it.",
  },
  {
    icon: Globe2,
    title: "Global Sourcing",
    description:
      "Our supplier network reaches across Africa, Europe, and Asia, giving clients access to craftsmanship and ranges that are difficult to find locally, at scale and on schedule.",
  },
  {
    icon: ShieldCheck,
    title: "Discretion as Standard",
    description:
      "We work on executive gifting, internal recognition programmes, and sensitive client relationships. Confidentiality is not a premium add-on, it is how we operate.",
  },
  {
    icon: Clock,
    title: "Nigerian Precision",
    description:
      "Deadlines in this market are unforgiving. We plan around customs, production lead times, and launch dates so your project lands when it needs to.",
  },
];

const process = [
  {
    step: "01",
    title: "Brief",
    description:
      "We start with the occasion, the audience, and the budget. No templates, no assumptions.",
  },
  {
    step: "02",
    title: "Curate",
    description:
      "You receive a considered selection with costings, branding options, and realistic timelines.",
  },
  {
    step: "03",
    title: "Brand",
    description:
      "Embroidery, screen-printing, laser engraving, and custom packaging, proofed before production runs.",
  },
  {
    step: "04",
    title: "Deliver",
    description:
      "Quality-checked, packed, and delivered to one address or many, with a single point of contact throughout.",
  },
];

const stats = [
  { value: "4", label: "Core service lines" },
  { value: "3", label: "Continents sourced" },
  { value: "24h", label: "Enquiry response" },
];

export default function AboutPage() {
  return (
    <main>
      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="relative py-20 lg:py-28 overflow-hidden bg-gradient-to-b from-background to-coal-grey/40">
        <div className="absolute inset-0 pointer-events-none hidden lg:block">
          <div className="absolute top-20 right-[8%] w-80 h-80 rounded-full bg-dsp-yellow/5 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="font-raleway text-[10px] tracking-[0.2em] uppercase text-dsp-yellow mb-4">
              Who We Are
            </p>
            <h1
              className="font-sarlotte font-bold text-foreground leading-[1.07] mb-6"
              style={{ fontSize: "clamp(2.4rem, 6vw, 4rem)" }}
            >
              A Curation House Built for{" "}
              <span className="text-dsp-yellow italic">Nigerian Business</span>
            </h1>
            <p className="font-raleway text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl">
              De-Sign Plus is a business-to-business luxury curation and branded
              merchandise company. We help Nigerian organisations say the right
              thing to the people who matter most to them, through objects worth
              keeping.
            </p>
          </div>
        </div>
      </section>

      {/* ── Story ─────────────────────────────────────────── */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="pl-5 border-l-[3px] border-dsp-yellow lg:pl-7">
              <h2
                className="font-sarlotte font-bold text-foreground leading-[1.1] mb-6"
                style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)" }}
              >
                Presentation is a business decision
              </h2>
              <div className="space-y-5 font-raleway text-muted-foreground leading-relaxed text-[0.95rem] sm:text-base">
                <p>
                  A branded item is rarely about the item. It is about what a
                  client thinks of your company when they open the box, what a
                  new hire feels on their first morning, and whether a partner
                  remembers your name six months after the meeting.
                </p>
                <p>
                  We built De-Sign Plus because too much of that work was being
                  handled as an afterthought: rushed, generic, and sourced from
                  whatever happened to be available. Our approach is the
                  opposite. We treat gifting and merchandise as an extension of
                  brand strategy, and we hold it to the same standard.
                </p>
                <p>
                  Today we serve corporate clients across Nigeria and the wider
                  continent, from executive gifting and year-end functions to
                  large-scale workwear and PPE programmes, all handled end to
                  end by one team.
                </p>
              </div>
            </div>

            <div className="relative">
              <Image
                src="/image.png"
                alt="De-Sign Plus curated corporate gifting and branded collateral"
                width={1000}
                height={750}
                sizes="(max-width: 1023px) 100vw, 50vw"
                className="w-full h-auto rounded-2xl object-cover"
              />
            </div>
          </div>

          {/* Stats */}
          <div className="mt-14 lg:mt-20 grid grid-cols-3 gap-4 sm:gap-8 border-t border-border pt-10">
            {stats.map(({ value, label }) => (
              <div key={label}>
                <p className="font-sarlotte font-bold text-foreground text-3xl sm:text-4xl lg:text-5xl leading-none mb-2">
                  {value}
                </p>
                <p className="font-raleway text-[11px] sm:text-sm text-muted-foreground leading-snug">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Values ────────────────────────────────────────── */}
      <section className="py-16 lg:py-24 border-t border-border">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12 lg:mb-16">
            <p className="font-raleway text-[10px] tracking-[0.2em] uppercase text-dsp-yellow mb-4">
              What We Stand For
            </p>
            <h2
              className="font-sarlotte font-bold text-foreground leading-[1.1]"
              style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)" }}
            >
              Four things we refuse to compromise on
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {values.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="group rounded-2xl border border-border bg-foreground/5 p-8 hover:bg-foreground/[0.08] hover:border-foreground/20 transition-colors duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-dsp-yellow/10 flex items-center justify-center mb-6">
                  <Icon className="w-6 h-6 text-dsp-yellow" />
                </div>
                <h3 className="font-sarlotte font-bold text-foreground text-2xl mb-3 group-hover:text-dsp-yellow transition-colors duration-300">
                  {title}
                </h3>
                <p className="font-raleway text-muted-foreground leading-relaxed text-[0.95rem]">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Process ───────────────────────────────────────── */}
      <section className="py-16 lg:py-24 border-t border-border bg-gradient-to-b from-background via-coal-grey/40 to-background">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12 lg:mb-16">
            <p className="font-raleway text-[10px] tracking-[0.2em] uppercase text-dsp-yellow mb-4">
              How We Work
            </p>
            <h2
              className="font-sarlotte font-bold text-foreground leading-[1.1]"
              style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)" }}
            >
              From brief to delivered, in four steps
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
            {process.map(({ step, title, description }) => (
              <div key={step} className="pt-6 border-t border-foreground/15">
                <p className="font-raleway text-[11px] tracking-[0.2em] text-dsp-yellow mb-4">
                  {step}
                </p>
                <h3 className="font-sarlotte font-bold text-foreground text-xl mb-2">
                  {title}
                </h3>
                <p className="font-raleway text-muted-foreground leading-relaxed text-[0.9rem]">
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
                Let&apos;s talk about your next project
              </h2>
              <p className="font-raleway text-muted-foreground text-sm sm:text-base">
                Tell us the occasion and the audience. We&apos;ll handle the rest.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <Link
                href="/contact-us"
                className="inline-flex items-center justify-center gap-2 bg-foreground text-background font-sarlotte font-semibold px-7 py-3.5 rounded-xl hover:bg-foreground/90 hover:scale-105 transition-all duration-300 text-base"
              >
                Get in Touch
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/services"
                className="inline-flex items-center justify-center border border-foreground/15 text-foreground font-sarlotte px-7 py-3.5 rounded-xl hover:bg-foreground hover:text-background transition-colors duration-300 text-base"
              >
                Explore Services
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
