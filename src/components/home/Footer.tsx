"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, Variants } from "framer-motion";
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaPhone,
  FaEnvelope,
  FaArrowUp,
  FaHome,
} from "react-icons/fa";
import { MdDesignServices } from "react-icons/md";
import { FaRegCopy, FaRegImages, FaScroll } from "react-icons/fa6";
import { toast } from "sonner";

function Footer() {
  const currentYear = new Date().getFullYear();

  // Enhanced container variants with smoother easing
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 1.2,
        ease: "easeOut",
        staggerChildren: 0.15,
      },
    },
  };

  // Enhanced item variants with better motion
  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut",
      },
    },
  };

  // Enhanced hover animations for social links
  const socialLinkVariants = {
    hover: {
      y: -4,
      scale: 1.1,
      transition: {
        duration: 0.3,
        ease: "easeOut",
      },
    },
    tap: {
      scale: 0.95,
      transition: {
        duration: 0.1,
      },
    },
  };

  // Enhanced hover animations for quick links
  const quickLinkVariants = {
    hover: {
      x: 8,
      transition: {
        duration: 0.3,
        ease: "easeOut",
      },
    },
    tap: {
      scale: 0.98,
      transition: {
        duration: 0.1,
      },
    },
  };

  // Enhanced contact item hover
  const contactItemVariants = {
    hover: {
      x: 8,
      transition: {
        duration: 0.3,
        ease: "easeOut",
      },
    },
  };

  // Enhanced button hover
  const buttonVariants = {
    hover: {
      scale: 1.05,
      transition: {
        duration: 0.3,
        ease: "easeOut",
      },
    },
    tap: {
      scale: 0.95,
      transition: {
        duration: 0.1,
      },
    },
  };

  // Enhanced scroll to top button
  const scrollToTopVariants = {
    hover: {
      scale: 1.1,
      y: -2,
      transition: {
        duration: 0.3,
        ease: "easeOut",
      },
    },
    tap: {
      scale: 0.9,
      transition: {
        duration: 0.1,
      },
    },
  };

  const socialLinks = [
    {
      icon: FaInstagram,
      href: "https://www.instagram.com/de.sign_plus",
      label: "Instagram",
    },
    {
      icon: FaFacebookF,
      href: "https://www.facebook.com/De.SignPlusNig/",
      label: "Facebook",
    },
    {
      icon: FaLinkedinIn,
      href: "https://www.linkedin.com/company/de-sign-plus/",
      label: "LinkedIn",
    },
  ];

  const quickLinks = [
    { href: "/", label: "Home", icon: FaHome },
    { href: "/services", label: "Services", icon: MdDesignServices },
    { href: "/portfolio", label: "Portfolio", icon: FaRegImages },
    { href: "/contact-us", label: "Contact", icon: FaScroll },
  ];

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-black text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
      </div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={containerVariants as Variants}
        className="relative z-10"
      >
        {/* Main Footer Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {/* Company Info */}
            <motion.div
              variants={itemVariants as Variants}
              className="lg:col-span-1"
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="relative w-24 h-12 lg:w-40 lg:h-16">
                  <Image
                    src="/logo-w.svg"
                    alt="De-Sign Plus"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
              <p className="text-gray-300 font-raleway text-sm leading-relaxed mb-6">
                We create exceptional experiences that inspire, engage, and
                drive results. Your vision, our expertise.
              </p>

              {/* Social Links */}
              <div className="flex space-x-4">
                {socialLinks.map((social, index) => (
                  <motion.a
                    key={social.label}
                    href={social.href}
                    variants={socialLinkVariants as Variants}
                    whileHover="hover"
                    whileTap="tap"
                    className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all duration-300 ease-out group"
                    aria-label={social.label}
                  >
                    <social.icon className="w-4 h-4 text-white group-hover:text-white transition-all duration-300 ease-out" />
                  </motion.a>
                ))}
              </div>
            </motion.div>

            {/* Quick Links */}
            <motion.div variants={itemVariants as Variants}>
              <h3 className="font-sarlotte text-xl font-bold mb-6">
                Quick Links
              </h3>
              <ul className="space-y-3">
                {quickLinks.map((link, index) => (
                  <motion.li
                    key={link.label}
                    variants={quickLinkVariants as Variants}
                    whileHover="hover"
                    whileTap="tap"
                  >
                    <Link
                      href={link.href}
                      className="flex items-center gap-2 font-raleway group text-gray-300 hover:text-white transition-all duration-300 ease-out text-sm font-medium"
                    >
                      <link.icon className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all duration-300 ease-out" />
                      {link.label}
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            {/* Contact Info */}
            <motion.div variants={itemVariants as Variants}>
              <h3 className="font-sarlotte text-xl font-bold mb-6">
                Contact Us
              </h3>
              <div className="space-y-4 font-raleway">
                <motion.div
                  variants={contactItemVariants as Variants}
                  whileHover="hover"
                  className="flex items-center space-x-3 group cursor-pointer"
                >
                  <FaPhone className="w-4 h-4 text-gray-400 flex-shrink-0 group-hover:text-white transition-all duration-300 ease-out" />
                  <span
                    className="text-gray-300 text-sm group-hover:text-white transition-all duration-300 ease-out cursor-pointer"
                    title="Click to copy"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(
                          "+1 (555) 123-4567"
                        );
                        toast.success("Phone number copied to clipboard");
                      } catch (err) {
                        console.error("Failed to copy phone number:", err);
                        toast.error("Failed to copy phone number");
                      }
                    }}
                  >
                    +1 (555) 123-4567
                  </span>
                  <FaRegCopy className="w-4 h-4 text-gray-400 flex-shrink-0 group-hover:text-white transition-all duration-300 ease-out" />
                </motion.div>

                <motion.div
                  variants={contactItemVariants as Variants}
                  whileHover="hover"
                  className="flex items-center space-x-3 group cursor-pointer"
                >
                  <FaEnvelope className="w-4 h-4 text-gray-400 flex-shrink-0 group-hover:text-white transition-all duration-300 ease-out" />
                  <span
                    onClick={() => {
                      window.location.href = "mailto:support@de-signplus.com";
                    }}
                    className="text-gray-300 text-sm group-hover:text-white transition-all duration-300 ease-out"
                  >
                    support@de-signplus.com
                  </span>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Newsletter Section */}
        <motion.div
          variants={itemVariants as Variants}
          className="border-t border-white/10"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col lg:flex-row items-center justify-between space-y-4 lg:space-y-0">
              <div>
                <h3 className="font-sarlotte text-xl font-bold mb-2">
                  Stay Updated
                </h3>
                <p className="font-raleway text-gray-300 text-sm">
                  Subscribe to our newsletter for the latest design insights and
                  updates.
                </p>
              </div>

              <div className="flex w-full flex-wrap gap-2 font-raleway lg:w-auto space-x-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 lg:w-64 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-white/40 transition-all duration-300 ease-out"
                />
                <motion.button
                  variants={buttonVariants as Variants}
                  whileHover="hover"
                  whileTap="tap"
                  className="px-6 py-3 bg-white text-black font-medium rounded-lg hover:bg-gray-100 transition-all duration-300 ease-out"
                >
                  Subscribe
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Bottom Bar */}
        <motion.div
          variants={itemVariants as Variants}
          className="border-t border-white/10"
        >
          <div className="max-w-7xl font-raleway mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
              <div className="text-gray-400 text-sm">
                © {currentYear} De-Sign Plus. All rights reserved.
              </div>

              <div className="flex items-center space-x-6 text-sm">
                <Link
                  href="/privacy"
                  className="text-gray-400 hover:text-white transition-all duration-300 ease-out"
                >
                  Privacy Policy
                </Link>
                <Link
                  href="/terms"
                  className="text-gray-400 hover:text-white transition-all duration-300 ease-out"
                >
                  Terms of Service
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Scroll to Top Button */}
      <motion.button
        onClick={scrollToTop}
        variants={scrollToTopVariants as Variants}
        whileHover="hover"
        whileTap="tap"
        className="fixed bottom-6 right-6 w-12 h-12 bg-white text-black rounded-full shadow-lg flex items-center justify-center z-40 hover:bg-gray-100 transition-all duration-300 ease-out"
        aria-label="Scroll to top"
      >
        <FaArrowUp className="w-4 h-4" />
      </motion.button>
    </footer>
  );
}

export default Footer;
