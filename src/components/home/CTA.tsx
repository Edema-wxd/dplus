"use client";

import { motion, Variants } from "framer-motion";
import { ArrowRight, Sparkles, Star } from "lucide-react";
import { Button } from "../ui/button";

function CTA() {
  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        staggerChildren: 0.2,
        ease: "easeOut",
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  return (
    <section className="relative py-20 lg:py-32 overflow-hidden">
      {/* Background gradient and effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-coal-grey to-background"></div>
      
      {/* Animated background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-1/4 w-32 h-32 bg-white/5 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-20 right-1/4 w-24 h-24 bg-white/3 rounded-full blur-lg animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-10 w-16 h-16 bg-white/2 rounded-full blur-md animate-pulse delay-500"></div>
      </div>

      {/* Main content */}
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={containerVariants as Variants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="text-left"
        >
          {/* Badge */}
          <motion.div
            variants={itemVariants as Variants}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-sm font-raleway text-gray-300 mb-8"
          >
            <Sparkles className="w-4 h-4 text-yellow-400" />
            Ready to Transform Your Experience?
          </motion.div>

          {/* Main heading */}
          <motion.h2
            variants={itemVariants as Variants}
            className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-sarlotte font-bold text-white leading-tight mb-6"
          >
            Let&apos;s Create Something{" "}
            <span className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
              Extraordinary
            </span>{" "}
            Together
          </motion.h2>

          {/* Description */}
          <motion.p
            variants={itemVariants as Variants}
            className="text-lg text-left sm:text-xl text-gray-300 font-raleway leading-relaxed max-w-3xl   mb-10"
          >
            Ready to elevate your brand with our exclusive curation? Whether you&apos;re looking 
            for the perfect corporate gift, luxury brand experience, or bespoke partnership, 
            we&apos;re here to make it happen.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={itemVariants as Variants}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
          >
            <Button
              className="group bg-white text-black hover:bg-gray-100 font-sarlotte font-semibold px-8 py-4 text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl"
              size="lg"
              onClick={() => {
                window.location.href = "/contact-us";
              }}
            >
              Start Your Project
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>

            <Button
              variant="outline"
              className="border-white/30 text-white hover:bg-white hover:text-black font-sarlotte px-8 py-4 text-lg backdrop-blur-sm"
              size="lg"
              onClick={() => {
                window.location.href = "/services";
              }}
            >
              Explore Services
            </Button>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            variants={itemVariants as Variants  }
            className="flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-gray-400"
          >
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-400" />
              <span className="font-raleway">Premium Quality Guaranteed</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-400" />
              <span className="font-raleway">Global Sourcing Network</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-400" />
              <span className="font-raleway">Bespoke Solutions</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

export default CTA;
