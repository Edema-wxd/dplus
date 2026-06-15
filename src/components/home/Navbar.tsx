"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { useTheme } from "next-themes";
import { useCart } from "@/context/cart-context";

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();
  const { count } = useCart();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle scroll effect for navbar background
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/services", label: "Services" },
    { href: "/products", label: "Products" },
    { href: "/portfolio", label: "Portfolio" },
    { href: "/contact-us", label: "Contact" },
  ];

  const containerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 },
    },
  };

  const mobileMenuVariants = {
    closed: {
      opacity: 0,
      x: "100%",
      transition: {
        duration: 0.3,
        ease: "easeInOut" as const,
      },
    },
    open: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.3,
        ease: "easeInOut" as const,
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  return (
    <>
      <motion.nav
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-background/95 backdrop-blur-md shadow-lg"
            : "bg-background"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 lg:h-20">
            {/* Logo */}
            <motion.div variants={itemVariants} className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <div className="relative w-24  h-12 lg:w-32 lg:h-16">
                  <Image
                    src={mounted && resolvedTheme === "light" ? "/logo-b.svg" : "/logo-w.svg"}
                    alt="De-Sign Plus"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
                
              </Link>
            </motion.div>

            {/* Desktop Navigation */}
            <motion.div
              variants={itemVariants}
              className="hidden lg:flex items-center space-x-8"
            >
              {navItems.map((item, index) => (
                <motion.div
                  key={item.href}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    href={item.href}
                    id={index.toString()}
                    className="font-sarlotte text-foreground/80 hover:text-foreground text-lg font-medium transition-colors duration-200 relative group"
                  >
                    {item.label}
                    <motion.div
                      className="absolute -bottom-1 left-0 w-0 h-0.5 bg-foreground group-hover:w-full transition-all duration-300"
                      initial={{ width: 0 }}
                      whileHover={{ width: "100%" }}
                    />
                  </Link>
                </motion.div>
              ))}
            </motion.div>

            {/* CTA Button + Theme Toggle */}
            <motion.div
              variants={itemVariants}
              className="hidden lg:flex items-center gap-4"
            >
              <Link
                href="/basket"
                className="relative p-2 text-foreground/80 hover:text-foreground transition-colors"
                aria-label="Basket"
              >
                <ShoppingCart size={22} />
                {count > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background text-xs font-medium">
                    {count}
                  </span>
                )}
              </Link>
              <ThemeToggle />
              <Button
                asChild
                className="font-sarlotte bg-foreground text-background hover:bg-foreground/90 transition-all duration-200 hover:scale-105"
                size="lg"
              >
                <Link href="/contact-us">Get Started</Link>
              </Button>
            </motion.div>

            {/* Mobile Menu Button */}
            <motion.div
              variants={itemVariants}
              className="lg:hidden flex items-center gap-2"
            >
              <Link
                href="/basket"
                className="relative p-2 text-foreground/80 hover:text-foreground transition-colors"
                aria-label="Basket"
              >
                <ShoppingCart size={22} />
                {count > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background text-xs font-medium">
                    {count}
                  </span>
                )}
              </Link>
              <ThemeToggle />
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-foreground p-2 hover:bg-foreground/10 rounded-lg transition-colors duration-200"
                aria-label="Toggle menu"
              >
                <AnimatePresence mode="wait">
                  {isOpen ? (
                    <motion.div
                      key="close"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <X size={24} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="menu"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Menu size={24} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </motion.div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={mobileMenuVariants}
            className="fixed top-0 right-0 h-full w-80 bg-background border-l border-border z-50 lg:hidden"
          >
            <div className="flex flex-col h-full">
              {/* Mobile Menu Header */}
              <div className="flex justify-between items-center p-6 border-b border-border">
                <span className="font-sarlotte text-foreground text-xl font-bold">
                  Menu
                </span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-foreground/70 hover:text-foreground transition-colors duration-200"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Mobile Menu Items */}
              <div className="flex-1 p-6">
                <div className="space-y-6">
                  {navItems.map((item, index) => (
                    <motion.div
                      key={item.href}
                      variants={itemVariants}
                      whileHover={{ x: 10 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Link
                        href={item.href}
                        id={index.toString()}
                        onClick={() => setIsOpen(false)}
                        className="font-sarlotte text-foreground/80 hover:text-foreground text-2xl font-medium transition-colors duration-200 block py-2"
                      >
                        {item.label}
                      </Link>
                    </motion.div>
                  ))}
                </div>

                <motion.div
                  variants={itemVariants}
                  className="mt-8 pt-6 border-t border-border"
                >
                  <Button
                    asChild
                    className="font-sarlotte bg-foreground text-background hover:bg-foreground/90 w-full transition-all duration-200"
                    size="lg"
                  >
                    <Link href="/contact-us" onClick={() => setIsOpen(false)}>
                      Get Started
                    </Link>
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="h-16 lg:h-20" />
    </>
  );
}

export default Navbar;
