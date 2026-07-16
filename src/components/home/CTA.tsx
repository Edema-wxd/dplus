"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "../ui/button";
import Link from "next/link";

export default function CTA() {
  return (
    <section className="relative py-16 lg:py-28 overflow-hidden">
      {/* Subtle gradient backdrop */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-coal-grey/60 to-background" />

      {/* Ambient orbs — desktop only, no pulse */}
      <div className="absolute inset-0 pointer-events-none hidden lg:block">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-dsp-yellow/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-56 h-56 bg-dsp-red/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-5xl mx-auto px-5 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center text-center lg:items-start lg:text-left"
        >
          {/* Eyebrow — flanked rules, centered on mobile */}
          <div className="flex items-center gap-3 mb-6">
            <span className="w-8 h-px bg-dsp-yellow/40" />
            <p className="font-raleway text-[10px] tracking-[0.22em] uppercase text-dsp-yellow">
              Ready to Begin
            </p>
            <span className="w-8 h-px bg-dsp-yellow/40" />
          </div>

          {/* Heading */}
          <h2
            className="font-sarlotte font-bold text-foreground leading-[1.07] mb-5 lg:mb-6"
            style={{ fontSize: "clamp(2.1rem, 8vw, 3.75rem)" }}
          >
            Let&apos;s Create Something{" "}
            <span className="text-dsp-yellow italic">Extraordinary</span>{" "}
            Together
          </h2>

          {/* Body — shorter on mobile */}
          <p className="font-raleway text-sm sm:text-base lg:text-lg text-muted-foreground leading-[1.7] max-w-[30ch] sm:max-w-sm lg:max-w-2xl mb-8 lg:mb-10">
            Whether you need the perfect corporate gift, a luxury brand
            experience, or a bespoke partnership strategy, we make it happen.
          </p>

          {/* CTAs — full-width stacked on mobile, inline on sm+ */}
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Button
              asChild
              size="lg"
              className="group w-full sm:w-auto bg-foreground text-background hover:bg-foreground/90 font-sarlotte font-semibold text-base h-[52px] px-8 rounded-xl hover:scale-105 transition-all duration-300"
            >
              <Link href="/contact-us">
                Start Your Project
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full sm:w-auto border-foreground/15 text-foreground hover:bg-foreground hover:text-background font-sarlotte text-base h-[52px] px-8 rounded-xl"
            >
              <Link href="/services">Explore Services</Link>
            </Button>
          </div>

          {/* Trust — single compact line, no vertical stacking */}
          <div className="flex items-center justify-center lg:justify-start gap-2.5 mt-8 font-raleway text-[11px] tracking-wide text-muted-foreground/50">
            <span>Premium Quality</span>
            <span className="w-[3px] h-[3px] rounded-full bg-dsp-yellow/50 flex-shrink-0" />
            <span>Global Sourcing</span>
            <span className="w-[3px] h-[3px] rounded-full bg-dsp-yellow/50 flex-shrink-0" />
            <span>Bespoke Solutions</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
