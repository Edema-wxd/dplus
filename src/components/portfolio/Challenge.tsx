"use client";

import React, { useEffect, useState } from "react";
import { motion, useScroll, useTransform, Variants } from "framer-motion";
import { Quote, TrendingUp, Clock, Target, AlertTriangle } from "lucide-react";

type Challenge = {
  description: string;
  quote: {
    quote: string;
    role: string;
  };
};

function Challenge({ challenge }: { challenge: Challenge }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const { scrollY } = useScroll();

  // Parallax effect for background elements
  const y = useTransform(scrollY, [0, 500], [0, 100]);
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
      y: 40,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.7,
        ease: "easeOut",
      },
    },
  };

  const numberVariants: Variants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
      rotateY: -90,
    },
    visible: {
      opacity: 1,
      scale: 1,
      rotateY: 0,
      transition: {
        duration: 1,
        ease: "easeOut",
        delay: 0.3,
      },
    },
  };

  const statVariants: Variants = {
    hidden: {
      opacity: 0,
      y: 20,
      scale: 0.9,
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

  const quoteVariants: Variants = {
    hidden: {
      opacity: 0,
      x: -30,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut",
        delay: 0.4,
      },
    },
  };

  const floatingAnimation = {
    y: [0, -6, 0],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut" as const,
    },
  };

  const pulseAnimation = {
    scale: [1, 1.05, 1],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut" as const,
    },
  };

  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-br from-background via-coal-grey to-background py-24 lg:py-32">
      {/* Animated background elements */}
      <motion.div
        style={{ y, opacity }}
        className="absolute inset-0 pointer-events-none"
      >
        <div className="absolute top-20 left-10 w-32 h-32 bg-white/3 rounded-full blur-xl"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-yellow-400/5 rounded-full blur-lg"></div>
        <div className="absolute bottom-40 left-1/4 w-40 h-40 bg-white/2 rounded-full blur-2xl"></div>
        <div className="absolute top-1/2 right-1/4 w-20 h-20 bg-yellow-400/8 rounded-full blur-lg"></div>
      </motion.div>

      {/* Main content container */}
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isLoaded ? "visible" : "hidden"}
          className="w-full"
        >
          {/* Section Header */}
          <motion.div
            variants={itemVariants}
            className="text-center mb-20 lg:mb-24"
          >
            {/* Section Number */}
            <motion.div
              variants={numberVariants}
              className="relative inline-block mb-6"
            >
              <span className="font-sarlotte text-8xl lg:text-9xl xl:text-[120px] text-gray-800 font-normal leading-none">
                01
              </span>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 rounded-full blur-3xl"
                animate={pulseAnimation}
              />
            </motion.div>

            {/* Section Title */}
            <motion.h2
              variants={itemVariants}
              className="font-sarlotte text-3xl sm:text-4xl lg:text-5xl xl:text-[42px] font-normal text-white mb-6 tracking-tight"
            >
              The Challenge
            </motion.h2>

            {/* Section Description */}
            <motion.p
              variants={itemVariants}
              className="text-lg text-gray-300 font-raleway leading-relaxed max-w-2xl mx-auto"
            >
              Creating meaningful cultural bridges while maintaining the highest
              standards of luxury and exclusivity.
            </motion.p>
          </motion.div>

          {/* Challenge Content */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16  items-start">
            {/* Challenge Text */}
            <motion.div variants={itemVariants} className="space-y-6">
              <motion.p
                variants={itemVariants}
                className="text-base text-gray-300 font-raleway leading-relaxed"
              >
                <span
                  dangerouslySetInnerHTML={{ __html: challenge.description }}
                />
              </motion.p>
            </motion.div>

            {/* Challenge Quote and Stats */}
            <motion.div variants={itemVariants} className="space-y-8">
              {/* Quote */}
              <motion.div
                variants={quoteVariants}
                className="relative bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-sm p-8 lg:p-10 border-l-4 border-yellow-400 rounded-r-2xl"
              >
                <div className="absolute top-4 right-4 text-yellow-400/20">
                  <Quote className="w-8 h-8" />
                </div>

                <motion.p
                  variants={itemVariants}
                  className="font-raleway text-lg lg:text-xl text-white italic leading-relaxed mb-4"
                >
                  &quot;{challenge.quote.quote}&quot;
                </motion.p>

                <motion.div
                  variants={itemVariants}
                  className="text-yellow-400 text-sm font-raleway uppercase mb-4 tracking-wider"
                >
                  ~ {challenge.quote.role}
                </motion.div>

                {/* Decorative elements */}
                <motion.div
                  className="absolute -bottom-2 -right-2 w-16 h-16 bg-yellow-400/10 rounded-full blur-xl"
                  animate={floatingAnimation}
                />
                <motion.div
                  variants={itemVariants}
                  className="grid grid-cols-2 gap-6"
                >
                  <motion.div
                    variants={statVariants}
                    className="text-center p-6 lg:p-8 bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl"
                  >
                    <motion.div className="flex justify-center mb-3">
                      <TrendingUp className="w-6 h-6 text-yellow-400" />
                    </motion.div>
                    <motion.span
                      className="font-sarlotte text-2xl lg:text-3xl text-yellow-400 block mb-2"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        delay: 0.8,
                        type: "spring",
                        stiffness: 200,
                      }}
                    >
                      ₦1.2B
                    </motion.span>
                    <span className="text-xs text-gray-400 font-raleway uppercase tracking-wider">
                      Deal at Stake
                    </span>
                  </motion.div>

                  <motion.div
                    variants={statVariants}
                    className="text-center p-6 lg:p-8 bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl"
              
                  >
                    <motion.div className="flex justify-center mb-3">
                      <Clock className="w-6 h-6 text-yellow-400" />
                    </motion.div>
                    <motion.span
                      className="font-sarlotte text-2xl lg:text-3xl text-yellow-400 block mb-2"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        delay: 1.0,
                        type: "spring",
                        stiffness: 200,
                      }}
                    >
                      8
                    </motion.span>
                    <span className="text-xs text-gray-400 font-raleway uppercase tracking-wider">
                      Weeks Timeline
                    </span>
                  </motion.div>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default Challenge;
