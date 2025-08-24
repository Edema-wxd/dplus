"use client";

import React, { useEffect, useState } from "react";
import { motion, useScroll, useTransform, Variants } from "framer-motion";
import {
  Calendar,
  DollarSign,
  Users,
  Package,
  Target,
  TrendingUp,
} from "lucide-react";
import Image from "next/image";

interface SubHeroProps {
  subTitle: string;
  title: string;
  description: string;
  image: string;
  projectTags: string[];
  projectCost: string;
  projectTimeline: string;
  projectQuantity: string;
  client?: string;
  outcome?: string;
  artisansInvolved?: string;
  piecesCreated?: string;
}

function SubHero({
  subTitle,
  title,
  description,
  image,
  projectTags,
  projectCost,
  projectTimeline,
  client,
  outcome,
  piecesCreated,
}: SubHeroProps) {
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
        staggerChildren: 0.15,
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
    y: [0, -8, 0],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut",
    },
  };

  const detailItems = [
    {
      label: "Project Value",
      value: projectCost,
      icon: DollarSign,
      highlight: true,
    },
    { label: "Client", value: client, icon: Users },
    { label: "Timeline", value: projectTimeline, icon: Calendar },
    { label: "Outcome", value: outcome, icon: TrendingUp },
    { label: "Pieces Created", value: piecesCreated, icon: Package },
  ];

  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-br from-background via-background to-coal-grey py-16 lg:py-24">
      {/* Animated background elements */}
      <motion.div
        style={{ y, opacity }}
        className="absolute inset-0 pointer-events-none"
      >
        <div className="absolute top-20 left-10 w-32 h-32 bg-white/5 rounded-full blur-xl"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-white/3 rounded-full blur-lg"></div>
        <div className="absolute bottom-40 left-1/4 w-40 h-40 bg-white/2 rounded-full blur-2xl"></div>
        <div className="absolute top-1/2 right-1/4 w-20 h-20 bg-yellow-400/10 rounded-full blur-lg"></div>
      </motion.div>

      {/* Main content container */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isLoaded ? "visible" : "hidden"}
          className="w-full"
        >
          {/* Project Header */}
          <div className="grid lg:grid-cols-3 gap-12 lg:gap-16 mb-16 lg:mb-20">
            {/* Project Info - Takes 2 columns */}
            <motion.div
              variants={itemVariants}
              className="lg:col-span-2 space-y-8"
            >
              {/* Subtitle */}
              <motion.div
                variants={itemVariants}
                className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-400/10 backdrop-blur-sm border border-yellow-400/20 rounded-full text-sm font-raleway text-yellow-400 uppercase tracking-wider"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <Target className="w-4 h-4" />
                {subTitle}
              </motion.div>

              {/* Main Title */}
              <motion.h1
                variants={itemVariants}
                className="text-4xl leading-tight sm:text-5xl lg:text-6xl xl:text-7xl font-sarlotte font-normal text-white tracking-tight"
              >
                {title}
              </motion.h1>

              {/* Description */}
              <motion.p
                variants={itemVariants}
                className="text-lg sm:text-xl text-gray-300 font-raleway leading-relaxed max-w-3xl"
              >
                {description}
              </motion.p>

              {/* Project Tags */}
              <motion.div
                variants={itemVariants}
                className="flex flex-wrap gap-3"
              >
                {projectTags.map((tag, index) => (
                  <motion.span
                    key={index}
                    className={`px-4 py-2 text-xs font-raleway uppercase tracking-wider border rounded-full transition-all duration-300 ${
                      index === 0
                        ? "border-yellow-400 text-yellow-400 bg-yellow-400/10"
                        : "border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300"
                    }`}
                    whileHover={{ scale: 1.05, y: -2 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    {tag}
                  </motion.span>
                ))}
              </motion.div>
            </motion.div>

            {/* Project Details - Takes 1 column */}
            <motion.div variants={itemVariants} className="space-y-6">
              {detailItems.map((item, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="pt-6 border-t border-gray-800 first:border-t-0 first:pt-0"
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <item.icon
                      className={`w-4 h-4 ${
                        item.highlight ? "text-yellow-400" : "text-gray-500"
                      }`}
                    />
                    <span className="text-xs font-raleway text-gray-500 uppercase tracking-wider">
                      {item.label}
                    </span>
                  </div>
                  <div
                    className={`text-base font-raleway leading-relaxed ${
                      item.highlight
                        ? "text-yellow-400 font-sarlotte text-2xl"
                        : "text-white"
                    }`}
                  >
                    {item.value}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Project Images */}
          <motion.div
            variants={itemVariants}
            className="grid lg:grid-cols-3 gap-6 lg:gap-8"
          >
            {/* Main Image */}
            <motion.div
              className="lg:col-span-2 h-96 lg:h-[500px] relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 via-transparent to-orange-400/10"></div>
              {image && (
                <Image
                  src={image}
                  alt={title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 800px"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
            </motion.div>

            {/* Secondary Images */}
            <motion.div className="space-y-6 lg:space-y-8">
              <motion.div
                className="h-48 lg:h-[240px] relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-green-400/10 via-transparent to-blue-400/10"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
              </motion.div>

              <motion.div
                className="h-48 lg:h-[240px] relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 via-transparent to-pink-400/10"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

export default SubHero;
