"use client";

import React, { useEffect, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  Variants,
  TargetAndTransition,
} from "framer-motion";
import { ArrowRight, Sparkles, Globe, Award } from "lucide-react";
import { Button } from "../ui/button";
import Image from "next/image";

function Hero() {
  const [isLoaded, setIsLoaded] = useState(false);
  const { scrollY } = useScroll();

  // Parallax effect for background elements
  const y = useTransform(scrollY, [0, 500], [0, 150]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0.3]);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.8,
        staggerChildren: 0.2,
        ease: "easeOut",
      },
    },
  };

  const itemVariants: Variants = {
    hidden: {
      opacity: 0,
      y: 30,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  const floatingAnimation = {
    y: [0, -10, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut",
    },
  };

  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-background via-background to-coal-grey">
      {/* Animated background elements */}
      <motion.div
        style={{ y, opacity }}
        className="absolute inset-0 pointer-events-none"
      >
        <div className="absolute top-20 left-10 w-32 h-32 bg-white/5 rounded-full blur-xl"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-white/3 rounded-full blur-lg"></div>
        <div className="absolute bottom-40 left-1/4 w-40 h-40 bg-white/2 rounded-full blur-2xl"></div>
      </motion.div>

      {/* Main content container */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20 min-h-screen flex items-center">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isLoaded ? "visible" : "hidden"}
          className="w-full grid lg:grid-cols-2 gap-12 lg:gap-16 items-center"
        >
          {/* Left content */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col gap-6 sm:gap-8 items-start justify-center"
          >
            {/* Badge */}
            <motion.div
              variants={itemVariants}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-sm font-raleway text-gray-300"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <Sparkles className="w-4 h-4 text-yellow-400" />
              Nigerian Excellence • Global Impact
            </motion.div>

            {/* Main heading */}
            <motion.h1
              variants={itemVariants}
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-sarlotte font-bold text-white leading-tight"
            >
              Transforming{" "}
              <span className="bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent">
                Experiences
              </span>{" "}
              through{" "}
              <span className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
                Exclusive Curation
              </span>
            </motion.h1>

            {/* Description */}
            <motion.p
              variants={itemVariants}
              className="text-lg sm:text-xl text-gray-300 font-raleway leading-relaxed max-w-2xl"
            >
              As Nigeria&apos;s fastest rising luxury curation house, we source
              extraordinary craftsmanship across the globe to create gifts and
              brand experiences that close deals and forge lasting partnerships
              & relationships.
            </motion.p>

            {/* CTA Button */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
            >
              <Button
                className="group bg-white text-black hover:bg-gray-100 font-sarlotte font-semibold px-8 py-4 text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                size="lg"
                onClick={() => {
                  window.location.href = "/contact-us";
                }}
              >
                Begin Your Journey
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>

              <Button
                variant="outline"
                className="border-white/30 text-white hover:bg-white hover:text-black font-sarlotte px-8 py-4 text-lg backdrop-blur-sm"
                size="lg"
                onClick={() => {
                  window.location.href = "/portfolio";
                }}
              >
                View Portfolio
              </Button>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              variants={itemVariants}
              className="flex items-center gap-6 pt-4 text-sm text-gray-400"
            >
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                <span>Global Sourcing</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4" />
                <span>Premium Quality</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right content - Hero image or placeholder */}
          <motion.div
            variants={itemVariants}
            className="relative flex items-center justify-center"
          >
            <Image
              src="/letters.svg"
              alt="Hero Image"
              width={1000}
              height={1000}
              className=" max-h-90vh"
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

export default Hero;
