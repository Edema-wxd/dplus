"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  FaFacebookF,
  FaTwitter,
  FaInstagram,
  FaLinkedinIn,
  FaYoutube,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaArrowUp,
} from "react-icons/fa";

function Footer() {
  const currentYear = new Date().getFullYear();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.8,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  const socialLinks = [
    { icon: FaFacebookF, href: "#", label: "Facebook" },
    { icon: FaTwitter, href: "#", label: "Twitter" },
    { icon: FaInstagram, href: "#", label: "Instagram" },
    { icon: FaLinkedinIn, href: "#", label: "LinkedIn" },
    { icon: FaYoutube, href: "#", label: "YouTube" },
  ];

  const quickLinks = [
    { href: "/", label: "Home" },
    { href: "/services", label: "Services" },
    { href: "/portfolio", label: "Portfolio" },
    { href: "/contact-us", label: "Contact" },
  ];

  const services = [
    { href: "/services", label: "Web Design" },
    { href: "/services", label: "Brand Identity" },
    { href: "/services", label: "Digital Marketing" },
    { href: "/services", label: "UI/UX Design" },
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
        variants={containerVariants}
        className="relative z-10"
      >
        {/* Main Footer Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {/* Company Info */}
            <motion.div variants={itemVariants} className="lg:col-span-1">
              <div className="flex items-center space-x-3 mb-6">
                <div className="relative w-12 h-12">
                  <Image
                    src="/logo.png"
                    alt="De-Sign Plus"
                    fill
                    className="object-contain"
                  />
                </div>
                <span className="font-sarlotte text-2xl font-bold">
                  De-Sign Plus
                </span>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed mb-6">
                We create exceptional digital experiences that inspire, engage,
                and drive results. Your vision, our expertise.
              </p>

              {/* Social Links */}
              <div className="flex space-x-4">
                {socialLinks.map((social, index) => (
                  <motion.a
                    key={social.label}
                    href={social.href}
                    whileHover={{ y: -3, scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all duration-200 group"
                    aria-label={social.label}
                  >
                    <social.icon className="w-4 h-4 text-white group-hover:text-white transition-colors duration-200" />
                  </motion.a>
                ))}
              </div>
            </motion.div>

            {/* Quick Links */}
            <motion.div variants={itemVariants}>
              <h3 className="font-sarlotte text-xl font-bold mb-6">
                Quick Links
              </h3>
              <ul className="space-y-3">
                {quickLinks.map((link, index) => (
                  <motion.li
                    key={link.label}
                    whileHover={{ x: 5 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link
                      href={link.href}
                      className="text-gray-300 hover:text-white transition-colors duration-200 text-sm font-medium"
                    >
                      {link.label}
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            {/* Services */}
            <motion.div variants={itemVariants}>
              <h3 className="font-sarlotte text-xl font-bold mb-6">Services</h3>
              <ul className="space-y-3">
                {services.map((service, index) => (
                  <motion.li
                    key={service.label}
                    whileHover={{ x: 5 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link
                      href={service.href}
                      className="text-gray-300 hover:text-white transition-colors duration-200 text-sm font-medium"
                    >
                      {service.label}
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            {/* Contact Info */}
            <motion.div variants={itemVariants}>
              <h3 className="font-sarlotte text-xl font-bold mb-6">
                Contact Us
              </h3>
              <div className="space-y-4">
                <motion.div
                  whileHover={{ x: 5 }}
                  className="flex items-center space-x-3"
                >
                  <FaPhone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-300 text-sm">
                    +1 (555) 123-4567
                  </span>
                </motion.div>

                <motion.div
                  whileHover={{ x: 5 }}
                  className="flex items-center space-x-3"
                >
                  <FaEnvelope className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-300 text-sm">
                    hello@designplus.com
                  </span>
                </motion.div>

                <motion.div
                  whileHover={{ x: 5 }}
                  className="flex items-start space-x-3"
                >
                  <FaMapMarkerAlt className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300 text-sm">
                    123 Design Street
                    <br />
                    Creative City, CC 12345
                  </span>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Newsletter Section */}
        <motion.div
          variants={itemVariants}
          className="border-t border-white/10"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col lg:flex-row items-center justify-between space-y-4 lg:space-y-0">
              <div>
                <h3 className="font-sarlotte text-xl font-bold mb-2">
                  Stay Updated
                </h3>
                <p className="text-gray-300 text-sm">
                  Subscribe to our newsletter for the latest design insights and
                  updates.
                </p>
              </div>

              <div className="flex w-full lg:w-auto space-x-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 lg:w-64 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-white/40 transition-colors duration-200"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 bg-white text-black font-medium rounded-lg hover:bg-gray-100 transition-colors duration-200"
                >
                  Subscribe
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Bottom Bar */}
        <motion.div
          variants={itemVariants}
          className="border-t border-white/10"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
              <div className="text-gray-400 text-sm">
                © {currentYear} De-Sign Plus. All rights reserved.
              </div>

              <div className="flex items-center space-x-6 text-sm">
                <Link
                  href="/privacy"
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  Privacy Policy
                </Link>
                <Link
                  href="/terms"
                  className="text-gray-400 hover:text-white transition-colors duration-200"
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
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-6 right-6 w-12 h-12 bg-white text-black rounded-full shadow-lg flex items-center justify-center z-40 hover:bg-gray-100 transition-colors duration-200"
        aria-label="Scroll to top"
      >
        <FaArrowUp className="w-4 h-4" />
      </motion.button>
    </footer>
  );
}

export default Footer;
