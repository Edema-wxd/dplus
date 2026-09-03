"use client";

import React, { useEffect, useState } from "react";
import { motion, useScroll, useTransform, Variants } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "../ui/button";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";

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
  const { resolvedTheme } = useTheme();
  const { scrollY } = useScroll();
  const bgY = useTransform(scrollY, [0, 600], [0, 110]);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <section className="relative w-full overflow-hidden bg-background">
      {/* ── MOBILE ──────────────────────────────────────────────────────── */}
      <div className="lg:hidden relative min-h-[calc(100svh-4rem)] flex flex-col pt-8 pb-10">

        {/* Editorial left-rule — the signature device, and the only accent needed */}
        <motion.div
          variants={fadeUp(0)}
          initial="hidden"
          animate={isLoaded ? "visible" : "hidden"}
          className="mx-5 pl-5 border-l-[3px] border-dsp-yellow"
        >
          <h1
            className="font-sarlotte font-bold text-foreground leading-[1.0]"
            style={{ fontSize: "clamp(2.5rem, 12vw, 3.6rem)" }}
          >
            Transforming<br />
            Experiences
          </h1>

          <p className="font-raleway text-[0.9375rem] leading-[1.7] text-muted-foreground max-w-[28ch] mt-4">
            Exclusive curation for Nigeria&apos;s boardrooms. Sourced globally,
            delivered with precision.
          </p>
        </motion.div>

        {/* Full-bleed work image — takes the leftover height on any phone.
            The photo ships in two colourways; the dark one melts into the
            page ground so the objects read as if they sit on the page. */}
        <motion.div
          variants={fadeUp(0.18)}
          initial="hidden"
          animate={isLoaded ? "visible" : "hidden"}
          className="relative flex-1 min-h-[190px] my-7"
        >
          <Image
            src={isLoaded && resolvedTheme === "light" ? "/hero-light.jpg" : "/hero-dark.jpg"}
            alt="De-Sign Plus stationery and brand collateral"
            fill
            priority
            sizes="(min-width: 1024px) 1px, 100vw"
            className="object-cover object-center"
          />
        </motion.div>

        {/* CTAs, thumb-zone friendly */}
        <motion.div
          variants={fadeUp(0.26)}
          initial="hidden"
          animate={isLoaded ? "visible" : "hidden"}
          className="flex flex-col gap-3 px-5"
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
              sizes="(max-width: 1023px) 1px, 50vw"
              className="w-full h-auto rounded-2xl object-cover"
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

export default Hero;
