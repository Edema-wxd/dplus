"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { FaFacebookF, FaInstagram, FaLinkedinIn } from "react-icons/fa";
import { ArrowUp } from "lucide-react";
import { useTheme } from "next-themes";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/products", label: "Products" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/contact-us", label: "Contact" },
];

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

export default function Footer() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [email, setEmail] = useState("");
  const [subState, setSubState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [subError, setSubError] = useState("");
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <footer className="bg-background border-t border-border overflow-hidden">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        {/* ── Main grid ──────────────────────────────────────── */}
        <div className="py-12 lg:py-16 grid grid-cols-1 lg:grid-cols-4 gap-10 lg:gap-12">
          {/* Brand */}
          <div className="flex flex-col items-center lg:items-start lg:col-span-1">
            <div className="relative w-28 h-14 lg:w-36 lg:h-16 mb-4">
              <Image
                src={
                  mounted && resolvedTheme === "light"
                    ? "/logo-b.svg"
                    : "/logo-w.svg"
                }
                alt="De-Sign Plus"
                fill
                className="object-contain"
              />
            </div>

            <p className="font-raleway text-sm text-muted-foreground leading-relaxed text-center lg:text-left max-w-[28ch] mb-6">
              Nigeria&apos;s luxury curation house — crafting experiences that
              close deals and forge lasting partnerships.
            </p>

            <div className="flex items-center gap-3">
              {socialLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="group w-9 h-9 rounded-full bg-foreground/10 hover:bg-dsp-yellow/15 border border-foreground/10 hover:border-dsp-yellow/30 flex items-center justify-center transition-colors duration-200"
                >
                  <s.icon className="w-3.5 h-3.5 text-muted-foreground group-hover:text-dsp-yellow transition-colors duration-200" />
                </a>
              ))}
            </div>
          </div>

          {/* Navigation — improved for mobile: single column on very small, 2 cols on small screens, touch-friendly links */}
          <div>
            <h3 className="font-sarlotte font-bold text-base text-foreground mb-5 text-left">
              Quick Links
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-x-4 gap-y-2">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-raleway text-sm text-muted-foreground hover:text-foreground active:text-foreground transition-colors duration-200 block py-2 px-2 min-h-[44px] rounded-md text-left"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact — tappable links on mobile */}
          <div>
            <h3 className="font-sarlotte font-bold text-base text-foreground mb-5 text-center lg:text-left">
              Contact
            </h3>
            <div className="space-y-3 font-raleway text-sm text-center lg:text-left">
              <a
                href="tel:+15551234567"
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground active:text-foreground transition-colors duration-200 justify-center lg:justify-start"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-dsp-yellow flex-shrink-0" />
                +1 (555) 123-4567
              </a>
              <br />
              <a
                href="mailto:support@de-signplus.com"
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground active:text-foreground transition-colors duration-200 justify-center lg:justify-start"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-dsp-yellow flex-shrink-0" />
                support@de-signplus.com
              </a>
            </div>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-sarlotte font-bold text-base text-foreground mb-2 text-center lg:text-left">
              Stay Updated
            </h3>
            <p className="font-raleway text-xs text-muted-foreground mb-4 text-center lg:text-left">
              Design insights and exclusive updates.
            </p>
            {subState === "done" ? (
              <p className="font-raleway text-sm text-foreground text-center lg:text-left">
                You&apos;re subscribed!
              </p>
            ) : (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setSubState("loading");
                  setSubError("");
                  try {
                    const res = await fetch("/api/newsletter", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email }),
                    });
                    if (res.ok) {
                      setSubState("done");
                    } else {
                      const data = await res.json().catch(() => ({}));
                      setSubError(data.error ?? "Something went wrong. Please try again.");
                      setSubState("error");
                    }
                  } catch {
                    setSubError("Something went wrong. Please try again.");
                    setSubState("error");
                  }
                }}
                className="flex flex-col gap-2 max-w-xs mx-auto lg:mx-0"
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (subState === "error") { setSubState("idle"); setSubError(""); }
                  }}
                  placeholder="Your email address"
                  required
                  className={`w-full px-4 py-3 bg-foreground/5 border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none transition-colors duration-200 ${subState === "error" ? "border-red-400 focus:border-red-400" : "border-border focus:border-foreground/30"}`}
                />
                {subError && (
                  <p className="text-xs text-red-400 font-raleway">{subError}</p>
                )}
                <button
                  type="submit"
                  disabled={subState === "loading"}
                  className="w-full px-4 py-3 bg-foreground text-background font-sarlotte text-sm font-semibold rounded-lg hover:bg-foreground/90 active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {subState === "loading" ? "Subscribing…" : "Subscribe"}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* ── Bottom bar ──────────────────────────────────────── */}
        <div className="border-t border-border py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 font-raleway text-xs text-muted-foreground">
            <span>© {currentYear} De-Sign Plus. All rights reserved.</span>
            <div className="flex items-center gap-4">
              <Link
                href="/privacy"
                className="hover:text-foreground transition-colors duration-200"
              >
                Privacy Policy
              </Link>
              <span className="w-px h-3 bg-border" />
              <Link
                href="/terms"
                className="hover:text-foreground transition-colors duration-200"
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll-to-top — appears only after scrolling 400px */}
      <motion.button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        initial={false}
        animate={{
          opacity: showScrollTop ? 1 : 0,
          y: showScrollTop ? 0 : 10,
          pointerEvents: showScrollTop ? "auto" : "none",
        }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 w-10 h-10 bg-foreground text-background rounded-full shadow-lg flex items-center justify-center z-40 hover:bg-foreground/90 active:scale-95 transition-colors duration-200"
        aria-label="Scroll to top"
      >
        <ArrowUp className="w-4 h-4" />
      </motion.button>
    </footer>
  );
}
