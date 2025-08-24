"use client";

import React, { useEffect, useState } from "react";
import {
  motion,
  useInView,
  useScroll,
  useTransform,
  Variants,
} from "framer-motion";
import { ArrowRight, Gift, Palette, Package, Handshake } from "lucide-react";
import { Button } from "../ui/button";
import Image from "next/image";

const services = [
  {
    number: "01",
    title: "Bespoke Gift Curation",
    description:
      "Handcrafted corporate gifts sourced exclusively from South African artisans. Each piece carries cultural significance and rarity, designed to leave lasting impressions on C-suite executives.",
    link: "Explore Collection",
    icon: Gift,
    image: "/corporate.png",
  },
  {
    number: "02",
    title: "Premium Brand Development",
    description:
      "Complete luxury brand identity creation that resonates with affluent markets. We craft visual narratives that position your company as the pinnacle of excellence.",
    link: "Start Project",
    icon: Palette,
    image: "/brand.png",
  },
  {
    number: "03",
    title: "Executive Merchandise",
    description:
      "Limited-edition corporate merchandise featuring authentic South African materials. Perfect for strengthening relationships with high-net-worth individuals and corporate leaders.",
    link: "View Catalog",
    icon: Package,
    image: "/merchandise.png",
  },
  {
    number: "04",
    title: "Strategic Partnership Gifts",
    description:
      "Precisely timed gift experiences that align with your business objectives. Our discretion and cultural insight help secure partnerships worth millions in Naira.",
    link: "Learn More",
    icon: Handshake,
    image: "/partnership.png",
  },
];

function Services() {
  const [isLoaded, setIsLoaded] = useState(false);
  const { scrollY } = useScroll();

  // Parallax effect for background
  const y = useTransform(scrollY, [0, 1000], [0, 200]);
  const opacity = useTransform(scrollY, [0, 800], [1, 0.3]);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const containerVariants = {
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

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 50,
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

  const ServiceCard = ({
    service,
    index,
  }: {
    service: (typeof services)[0];
    index: number;
  }) => {
    const ref = React.useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    return (
      <motion.div
        ref={ref}
        variants={itemVariants as Variants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        whileHover={{
          y: -10,
          transition: { duration: 0.3, ease: "easeOut" },
        }}
        className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 hover:border-white/20 transition-all duration-500"
      >
        {/* Animated border effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Icon */}
        <motion.div
          initial={{ opacity: 0, rotate: -10 }}
          animate={
            isInView ? { opacity: 1, rotate: 0 } : { opacity: 0, rotate: -10 }
          }
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mb-6"
        >
  
          <div className="relative w-full aspect-[1/1]">
            <Image
              src={service.image}
              alt={service.title}
              fill
              className="rounded w-full h-full object-cover"
              sizes="(max-width: 768px) 100vw, 200px"
              priority={index === 0}
            />
          </div>
        </motion.div>

        {/* Content */}
        <div className="space-y-4">
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-2xl font-sarlotte font-bold text-white group-hover:text-yellow-400 transition-colors duration-300"
          >
            {service.title}
          </motion.h3>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-gray-300 font-raleway leading-relaxed"
          >
            {service.description}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="pt-4"
          >
            <Button
              variant="ghost"
              className="group/btn text-yellow-400 hover:text-white hover:bg-yellow-400/20 font-sarlotte font-semibold p-0 h-auto"
              onClick={() => {
                window.location.href = "/contact-us";
              }}
            >
              {service.link}
              <ArrowRight className="ml-2 w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        </div>
      </motion.div>
    );
  };

  return (
    <section id="services" className="relative py-20 lg:py-32 overflow-hidden">
      {/* Animated background elements */}
      <motion.div
        style={{ y, opacity }}
        className="absolute inset-0 pointer-events-none"
      >
        <div className="absolute top-20 left-10 w-64 h-64 bg-yellow-400/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-orange-400/3 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-white/2 rounded-full blur-2xl"></div>
      </motion.div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={containerVariants as Variants}
          initial="hidden"
          animate={isLoaded ? "visible" : "hidden"}
          className="text-center mb-16 lg:mb-20"
        >
          {/* Section header */}
          <motion.div
            variants={itemVariants as Variants}
            className="flex items-center justify-center gap-4 mb-8"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-black font-sarlotte font-bold text-lg">
              01
            </div>
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-white/30"></div>
          </motion.div>

          <motion.h2
            variants={itemVariants as Variants}
            className="text-4xl lg:text-5xl xl:text-6xl font-sarlotte font-bold text-white mb-6"
          >
            Exclusive Offerings for{" "}
            <span className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
              Discerning Leaders
            </span>
          </motion.h2>

          <motion.p
            variants={itemVariants as Variants}
            className="text-lg lg:text-xl text-gray-300 font-raleway leading-relaxed max-w-4xl mx-auto"
          >
            Each element in our collection represents the pinnacle of South
            African craftsmanship, thoughtfully curated and delivered with
            Nigerian business precision to strengthen your most important
            relationships.
          </motion.p>
        </motion.div>

        {/* Services grid */}
        <motion.div
          variants={containerVariants as Variants}
          initial="hidden"
          animate={isLoaded ? "visible" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 lg:gap-10"
        >
          {services.map((service, index) => (
            <ServiceCard key={service.number} service={service} index={index} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

export default Services;
