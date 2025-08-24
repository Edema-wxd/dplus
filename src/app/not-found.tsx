"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, Variants } from "framer-motion";
import { Button } from "@/components/ui/button";
import { FaHome } from "react-icons/fa";
function NotFound() {
  // Auto-redirect after 10 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.href = "/";
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="text-center max-w-2xl mx-auto"
      >
        {/* Logo */}
        <motion.div variants={itemVariants} className="mb-8">
          <div className="relative w-32 h-16 mx-auto">
            <Image
              src="/logo-w.svg"
              alt="De-Sign Plus"
              fill
              className="object-contain"
              priority
            />
          </div>
        </motion.div>

        {/* 404 Number */}
        <motion.div variants={itemVariants} className="mb-6">
          <h1 className="text-8xl font-sarlotte md:text-9xl font-bold    text-white opacity-80">
            404
          </h1>
        </motion.div>

        {/* Error Message */}
        <motion.div variants={itemVariants} className="mb-8">
          <h2 className="text-2xl md:text-3xl font-raleway font-semibold text-white opacity-80 mb-4">
            Page Not Found
          </h2>
          <p className="text-muted-foreground font-raleway text-lg leading-relaxed">
            The page you&apos;re looking for doesn&apos;t exist or has been
            moved. Don&apos;t worry, we&apos;ll help you get back on track.
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          variants={itemVariants}
          className="flex font-raleway flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Link href="/">
            <Button
              size="lg"
              className="bg-dsp-red text-white px-8 py-3 text-lg font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dsp-red/70 focus-visible:ring-offset-2"
              style={{
                // Use inline style for scale on hover to ensure it works as expected
                transition: "background 0.3s, transform 0.3s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background =
                  "var(--dsp-red-hover, #c53030)";
                e.currentTarget.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--dsp-red, #e53e3e)";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              <FaHome className="w-5 h-5 mr-2" />
              Go Home
            </Button>
          </Link>
        </motion.div>

        {/* Auto-redirect notice */}
        <motion.div
          variants={itemVariants}
          className="mt-12 text-sm text-muted-foreground"
        >
          <p>
            You&apos;ll be automatically redirected to the home page in 10
            seconds
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default NotFound;
