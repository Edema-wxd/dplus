"use client";

import React, { useEffect, useState } from "react";
import { motion, useScroll, useTransform, Variants } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";
import { Button } from "../ui/button";
import Image from "next/image";
import Link from "next/link";

const fadeUp = (delay = 0): Variants => ({
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.52, ease: [0.22, 1, 0.36, 1], delay },
  },
});

function Hero() {
  const [isLoaded, setIsLoaded] = useState(false);
  const { scrollY } = useScroll();
  const bgY = useTransform(scrollY, [0, 600], [0, 110]);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <section className="relative w-full overflow-hidden bg-background">
      {/* ── MOBILE ──────────────────────────────────────────────────────── */}
      <div className="lg:hidden relative min-h-[calc(100svh-4rem)] flex flex-col px-5 pt-7 pb-8">

        {/* letters.svg as right-edge watermark — depth without layout cost */}
        <div className="absolute inset-0 flex items-center justify-end pointer-events-none select-none">
          <Image
            src="/letters.svg"
            alt=""
            aria-hidden
            width={300}
            height={300}
            className="w-[52vw] max-w-[200px] opacity-[0.045]"
          />
        </div>

        {/* Zone 1 — Badge */}
        <motion.div
          variants={fadeUp(0)}
          initial="hidden"
          animate={isLoaded ? "visible" : "hidden"}
          className="inline-flex items-center gap-2 self-start"
        >
          <span className="w-[5px] h-[5px] rounded-full bg-dsp-yellow flex-shrink-0" />
          <span className="font-raleway text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
            Nigerian Excellence · Global Impact
          </span>
        </motion.div>

        {/* Zone 2 — Headline + body, vertically centered */}
        <div className="flex-1 flex flex-col justify-center gap-5 py-6">

          {/* Editorial left-rule — the signature device */}
          <motion.div
            variants={fadeUp(0.1)}
            initial="hidden"
            animate={isLoaded ? "visible" : "hidden"}
            className="pl-4 border-l-[3px] border-dsp-yellow"
          >
            <h1
              className="font-sarlotte font-bold text-foreground leading-[1.05]"
              style={{ fontSize: "clamp(2.7rem, 10.5vw, 3.8rem)" }}
            >
              Transform&shy;ing<br />
              <span className="text-dsp-yellow italic">Experiences</span><br />
              through<br />
              Exclusive<br />
              Curation
            </h1>
          </motion.div>

          <motion.p
            variants={fadeUp(0.2)}
            initial="hidden"
            animate={isLoaded ? "visible" : "hidden"}
            className="font-raleway text-sm leading-[1.75] text-muted-foreground max-w-[30ch] pl-4"
          >
            Nigeria&apos;s luxury curation house, sourcing global craftsmanship to build brand experiences that close deals and forge lasting partnerships.
          </motion.p>
        </div>

        {/* Zone 3 — CTAs, thumb-zone friendly */}
        <motion.div
          variants={fadeUp(0.3)}
          initial="hidden"
          animate={isLoaded ? "visible" : "hidden"}
          className="flex flex-col gap-3"
        >
          <Button
            asChild
            size="lg"
            className="w-full bg-foreground text-background hover:bg-foreground/90 font-sarlotte font-semibold text-base h-[52px] rounded-xl"
          >
            <Link href="/contact-us">
              Begin Your Journey
              <ArrowRight className="ml-2 w-[18px] h-[18px]" />
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            size="lg"
            className="w-full border-foreground/15 text-foreground hover:bg-foreground hover:text-background font-sarlotte text-base h-[52px] rounded-xl"
          >
            <Link href="/portfolio">View Portfolio</Link>
          </Button>

          <div className="flex justify-center pt-3">
            <motion.div
              animate={{ y: [0, 5, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            >
              <ChevronDown className="w-4 h-4 text-muted-foreground/30" />
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* ── DESKTOP ──────────────────────────────────────────────────────── */}
      <motion.div
        style={{ y: bgY }}
        className="hidden lg:block absolute inset-0 pointer-events-none"
      >
        <div className="absolute top-24 right-[8%] w-96 h-96 rounded-full bg-dsp-yellow/5 blur-3xl" />
        <div className="absolute bottom-24 left-[4%] w-72 h-72 rounded-full bg-foreground/3 blur-3xl" />
      </motion.div>

      <div className="hidden lg:flex relative max-w-7xl mx-auto px-8 min-h-[calc(100svh-5rem)] items-center w-full">
        <motion.div
          initial="hidden"
          animate={isLoaded ? "visible" : "hidden"}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.13 } },
          }}
          className="grid lg:grid-cols-2 gap-16 xl:gap-20 items-center w-full"
        >
          {/* Left — text */}
          <div className="flex flex-col gap-7">
            <motion.div
              variants={fadeUp(0)}
              className="inline-flex items-center gap-2.5 px-4 py-2 bg-foreground/5 border border-foreground/10 rounded-full text-sm font-raleway text-muted-foreground self-start"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-dsp-yellow flex-shrink-0" />
              Nigerian Excellence · Global Impact
            </motion.div>

            <motion.h1
              variants={fadeUp(0)}
              className="font-sarlotte font-bold text-foreground text-5xl xl:text-6xl 2xl:text-7xl leading-[1.08]"
            >
              Transforming{" "}
              <span className="bg-gradient-to-r from-foreground via-foreground/70 to-foreground bg-clip-text text-transparent">
                Experiences
              </span>{" "}
              through{" "}
              <span className="text-dsp-yellow">Exclusive Curation</span>
            </motion.h1>

            <motion.p
              variants={fadeUp(0)}
              className="font-raleway text-lg xl:text-xl text-muted-foreground leading-relaxed max-w-xl"
            >
              As Nigeria&apos;s fastest rising luxury curation house, we source
              extraordinary craftsmanship across the globe to create gifts and
              brand experiences that close deals and forge lasting partnerships.
            </motion.p>

            <motion.div variants={fadeUp(0)} className="flex gap-3 flex-wrap">
              <Button
                asChild
                size="lg"
                className="group bg-foreground text-background hover:bg-foreground/90 font-sarlotte font-semibold px-8 text-lg hover:scale-105 transition-all duration-300"
              >
                <Link href="/contact-us">
                  Begin Your Journey
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-foreground/20 text-foreground hover:bg-foreground hover:text-background font-sarlotte px-8 text-lg"
              >
                <Link href="/portfolio">View Portfolio</Link>
              </Button>
            </motion.div>

            <motion.div
              variants={fadeUp(0)}
              className="flex items-center gap-6 text-sm text-muted-foreground"
            >
              <div className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-dsp-yellow" />
                Global Sourcing
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-dsp-yellow" />
                Premium Quality
              </div>
            </motion.div>
          </div>

          {/* Right — image */}
          <motion.div variants={fadeUp(0)} className="flex items-center justify-center">
            <Image
              src="/image.png"
              alt="De-Sign Plus"
              width={1000}
              height={750}
              priority
              className="w-full h-auto rounded-2xl object-cover"
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

export default Hero;
