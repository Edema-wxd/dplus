"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Gift, Palette, Package, Handshake, ArrowRight } from "lucide-react";
import Link from "next/link";

const services = [
  {
    numeral: "I",
    title: "Bespoke Gift Curation",
    desc: "Handcrafted corporate gifts sourced from South African artisans. Each piece carries cultural significance and rarity, designed to leave lasting impressions on C-suite executives.",
    icon: Gift,
    textColor: "text-dsp-yellow",
    bgColor: "bg-dsp-yellow/10",
    borderColor: "border-dsp-yellow",
  },
  {
    numeral: "II",
    title: "Premium Brand Development",
    desc: "Complete luxury brand identity that resonates with affluent markets — crafting visual narratives that position your company as the pinnacle of excellence.",
    icon: Palette,
    textColor: "text-dsp-red",
    bgColor: "bg-dsp-red/10",
    borderColor: "border-dsp-red",
  },
  {
    numeral: "III",
    title: "Executive Merchandise",
    desc: "Limited-edition corporate merchandise featuring authentic materials, perfect for strengthening relationships with high-net-worth individuals and corporate leaders.",
    icon: Package,
    textColor: "text-dsp-blue",
    bgColor: "bg-dsp-blue/10",
    borderColor: "border-dsp-blue",
  },
  {
    numeral: "IV",
    title: "Strategic Partnership Gifts",
    desc: "Precisely timed gift experiences aligned with your business objectives. Our discretion and cultural insight help secure partnerships worth millions.",
    icon: Handshake,
    textColor: "text-dsp-green",
    bgColor: "bg-dsp-green/10",
    borderColor: "border-dsp-green",
  },
] as const;

export default function Services() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section id="services" ref={ref} className="relative py-16 lg:py-28 overflow-hidden">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">

        {/* ── Section header ──────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10 lg:mb-16 lg:text-center"
        >
          <p className="font-raleway text-[10px] tracking-[0.2em] uppercase text-dsp-yellow mb-3 lg:mb-4">
            What We Do
          </p>
          <h2 className="font-sarlotte font-bold text-foreground text-[1.85rem] sm:text-4xl lg:text-5xl xl:text-6xl leading-[1.1] max-w-xl lg:mx-auto">
            Exclusive Offerings for{" "}
            <span className="text-dsp-yellow">Discerning Leaders</span>
          </h2>
          <p className="hidden lg:block mt-5 font-raleway text-lg text-muted-foreground leading-relaxed max-w-3xl mx-auto">
            Each element in our collection represents the pinnacle of South African craftsmanship,
            thoughtfully curated and delivered with Nigerian business precision to strengthen
            your most important relationships.
          </p>
        </motion.div>

        {/* ── MOBILE: tap-list ────────────────────────────── */}
        <div className="lg:hidden">
          <div className="divide-y divide-border/40">
            {services.map((service, i) => {
              const Icon = service.icon;
              return (
                <motion.div
                  key={service.numeral}
                  initial={{ opacity: 0, x: -14 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{
                    duration: 0.44,
                    delay: i * 0.07,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <Link
                    href="/services"
                    className={`group flex items-start gap-4 py-5 border-l-[3px] pl-4 ${service.borderColor} active:bg-foreground/5 transition-colors`}
                  >
                    {/* Icon pill */}
                    <div
                      className={`mt-0.5 flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${service.bgColor}`}
                    >
                      <Icon className={`w-[18px] h-[18px] ${service.textColor}`} />
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-sarlotte font-bold text-foreground text-[1.05rem] leading-snug">
                          {service.title}
                        </h3>
                        <ArrowRight
                          className={`w-4 h-4 flex-shrink-0 mt-0.5 opacity-30 group-active:opacity-100 ${service.textColor} transition-opacity`}
                        />
                      </div>
                      <p className="font-raleway text-[13px] text-muted-foreground leading-[1.65] mt-1.5">
                        {service.desc}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {/* Mobile footer link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.4, delay: 0.38 }}
            className="pt-8"
          >
            <Link
              href="/services"
              className="inline-flex items-center gap-2 font-sarlotte text-sm text-dsp-yellow hover:opacity-80 transition-opacity"
            >
              View all services
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>

        {/* ── DESKTOP: 2×2 card grid ──────────────────────── */}
        <div className="hidden lg:grid grid-cols-2 gap-6 xl:gap-8">
          {services.map((service, i) => {
            const Icon = service.icon;
            return (
              <motion.div
                key={service.numeral}
                initial={{ opacity: 0, y: 28 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{
                  duration: 0.5,
                  delay: i * 0.1,
                  ease: [0.22, 1, 0.36, 1],
                }}
                whileHover={{ y: -6, transition: { duration: 0.25 } }}
                className="group relative bg-foreground/5 border border-foreground/10 rounded-2xl p-8 hover:bg-foreground/[0.08] hover:border-foreground/20 transition-colors duration-300"
              >
                {/* Roman numeral */}
                <span
                  className={`font-sarlotte italic text-xs tracking-wide ${service.textColor} opacity-60 block mb-5`}
                >
                  {service.numeral}
                </span>

                {/* Icon */}
                <div
                  className={`w-12 h-12 rounded-xl ${service.bgColor} flex items-center justify-center mb-6`}
                >
                  <Icon className={`w-6 h-6 ${service.textColor}`} />
                </div>

                <h3 className="font-sarlotte font-bold text-foreground text-2xl mb-3 group-hover:text-dsp-yellow transition-colors duration-300">
                  {service.title}
                </h3>

                <p className="font-raleway text-muted-foreground leading-relaxed text-[0.95rem] mb-6">
                  {service.desc}
                </p>

                <Link
                  href="/services"
                  className={`inline-flex items-center gap-2 font-sarlotte text-sm font-semibold ${service.textColor} hover:opacity-80 transition-opacity`}
                >
                  Explore
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
