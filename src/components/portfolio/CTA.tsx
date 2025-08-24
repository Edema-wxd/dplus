"use client";

import { motion, Variants } from "framer-motion";
import { ArrowRight, Sparkles, Star, Trophy, Users } from "lucide-react";
import { Button } from "../ui/button";
import Link from "next/link";

function CTA() {
  const containerVariants: Variants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        staggerChildren: 0.15,
        ease: "easeOut",
      },
    },
  };

  const itemVariants: Variants = {
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

  const buttonVariants: Variants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
    hover: {
      scale: 1.05,
      transition: {
        duration: 0.2,
        ease: "easeOut",
      },
    },
  };

  return (
    <section className="relative py-16 sm:py-20 lg:py-24 xl:py-32 overflow-hidden">
      {/* Background gradient and effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-coal-grey/50 to-background"></div>

      {/* Animated background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-10 left-1/4 w-32 h-32 bg-dsp-yellow/10 rounded-full blur-xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-20 right-1/4 w-24 h-24 bg-dsp-blue/10 rounded-full blur-lg"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />
        <motion.div
          className="absolute top-1/2 left-10 w-16 h-16 bg-dsp-green/10 rounded-full blur-md"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
        />
      </div>

      {/* Main content */}
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="text-center"
        >
         
          {/* Main heading */}
          <motion.h2
            variants={itemVariants}
            className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-sarlotte font-bold text-white leading-tight mb-4 sm:mb-6"
          >
            Ready to Create Your Own Success Story?
          </motion.h2>

          {/* Description */}
          <motion.p
            variants={itemVariants}
            className="text-base sm:text-lg lg:text-xl text-gray-300 font-raleway leading-relaxed max-w-3xl mx-auto mb-8 sm:mb-10"
          >
            Let&apos;s discuss how our exclusive curation services can transform
            your next business opportunity into a remarkable success story.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-10 sm:mb-12"
          >
            <motion.div variants={buttonVariants} whileHover="hover">
              <Link href="/contact-us">
                <Button
                  className="group bg-white text-black hover:bg-gray-100 font-sarlotte font-semibold px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg transition-all duration-300 hover:shadow-2xl w-full sm:w-auto"
                  size="lg"
                >
                  Start Your Project
                  <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </motion.div>

            <motion.div variants={buttonVariants} whileHover="hover">
              <Link href="/portfolio">
                <Button
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white hover:text-black font-sarlotte px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg backdrop-blur-sm w-full sm:w-auto"
                  size="lg"
                >
                  View All Projects
                </Button>
              </Link>
            </motion.div>
          </motion.div>

         
        </motion.div>
      </div>
    </section>
  );
}

export default CTA;
