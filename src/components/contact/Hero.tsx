"use client";

import React, { useEffect, useState } from "react";
import { motion, Variants } from "framer-motion";
import { GiElectric, GiGlobe } from "react-icons/gi";

function Hero() {
  const [isLoaded, setIsLoaded] = useState(false);

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

  const featureVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  const features = [
    {
      icon: <GiElectric className="text-3xl" />,
      text: "24H Response",
      color: "bg-teal-500",
    },
    {
      icon: <GiGlobe className="text-3xl" />,
      text: "Global Reach",
      color: "bg-green-500",
    },
  ];

  return (
    <section className="relative py-32 lg:py-48 bg-gradient-to-br from-background via-coal-grey to-background text-center overflow-hidden">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-background/80 via-coal-grey/60 to-background/80"></div>

      {/* Animated background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-white/5 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-white/3 rounded-full blur-lg animate-pulse delay-1000"></div>
        <div className="absolute bottom-40 left-1/4 w-40 h-40 bg-white/2 rounded-full blur-2xl animate-pulse delay-2000"></div>
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isLoaded ? "visible" : "hidden"}
          className="hero-content"
        >
          {/* Hero Label */}
          <motion.div
            variants={itemVariants}
            className="text-teal-400 font-raleway text-xs font-normal tracking-[0.3em] uppercase mb-8 opacity-80"
          >
            Begin Your Exclusive Journey
          </motion.div>

          {/* Hero Title */}
          <motion.h1
            variants={itemVariants}
            className="font-sarlotte text-5xl sm:text-6xl lg:text-7xl font-normal leading-tight mb-10 tracking-tight text-white"
          >
            Let&apos;s Create Something Extraordinary Together
          </motion.h1>

          {/* Hero Description */}
          <motion.p
            variants={itemVariants}
            className="text-xl font-raleway text-gray-300 leading-relaxed font-light mb-16 max-w-3xl mx-auto"
          >
            Every transformative partnership begins with a conversation. Whether
            you&apos;re seeking exclusive South African gifts, premium brand
            development, or strategic corporate experiences, we&apos;re here to
            bring your vision to life with Nigerian excellence and global
            sophistication.
          </motion.p>

          {/* Hero Features Grid */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-2  gap-6 lg:gap-10 max-w-4xl mx-auto"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={featureVariants}
                whileHover={{
                  y: -5,
                  transition: { type: "spring", stiffness: 300 },
                }}
                className="text-center p-5 border border-gray-700 bg-coal-grey/50 backdrop-blur-sm rounded-lg transition-all duration-300 hover:border-teal-400 group"
              >
                <div
                  className={`w-12 h-12 ${feature.color} rounded-full flex items-center justify-center mx-auto mb-4 text-lg text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}
                >
                  {feature.icon}
                </div>
                <div className="text-base font-raleway text-gray-400 uppercase tracking-wider font-light">
                  {feature.text}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

export default Hero;
