"use client";

import React from "react";
import { motion, Variants } from "framer-motion";
import { Quote as QuoteIcon } from "lucide-react";

interface QuoteProps {
  quote: string;
  role: string;
  company: string;
}

function Quote({ quote, role, company }: QuoteProps) {
  // Animation variants following the established patterns in the codebase
  const containerVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
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

  const iconVariants: Variants = {
    hidden: { opacity: 0, scale: 0.8, rotate: -10 },
    visible: {
      opacity: 1,
      scale: 1,
      rotate: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8"
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-32 h-32 bg-white/5 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-24 h-24 bg-white/3 rounded-full blur-lg animate-pulse delay-1000"></div>
      </div>

      {/* Main quote container */}
      <motion.div
        variants={itemVariants}
        className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 sm:p-10 lg:p-12 hover:bg-white/10 hover:border-white/20 transition-all duration-500"
      >
        {/* Quote icon */}
        <motion.div
          variants={iconVariants}
          className="mb-6 flex justify-center"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400/20 to-orange-400/20 rounded-full flex items-center justify-center border border-yellow-400/30">
            <QuoteIcon className="w-8 h-8 text-yellow-400" />
          </div>
        </motion.div>

        {/* Quote text */}
        <motion.blockquote variants={itemVariants} className="text-center mb-8">
          <p className="text-lg sm:text-xl lg:text-2xl font-raleway font-medium text-white/90 leading-relaxed sm:leading-relaxed lg:leading-relaxed">
            &quot;{quote}&quot;
          </p>
        </motion.blockquote>

        {/* Author information */}
        <motion.div variants={itemVariants} className="text-center space-y-2">
          <h4 className="text-base sm:text-lg font-sarlotte font-bold text-white">
           ~ {role}
          </h4>
          <p className="text-sm sm:text-base font-raleway text-white/70">
            {company}
          </p>
        </motion.div>

        {/* Decorative accent line */}
        <motion.div
          variants={itemVariants}
          className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent rounded-full"
        />
      </motion.div>
    </motion.div>
  );
}

export default Quote;
