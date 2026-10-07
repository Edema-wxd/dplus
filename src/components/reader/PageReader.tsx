"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Leafs through the pages of a printed thing — a brochure, a hamper
 * presentation — as an object on a table rather than a web gallery.
 */
type Page = { url: string; alt?: string };

type Props = {
  pages: Page[];
  title: string;
  /** Trim ratio of the printed page, so the sheet never letterboxes. */
  pageRatio: number;
  /** Which brand accent marks position — red for brochures, yellow elsewhere. */
  accent?: "red" | "yellow";
};

const ACCENT = {
  red: {
    bar: "bg-dsp-red",
    outline: "focus-visible:outline-dsp-red",
    decoration: "hover:decoration-dsp-red",
  },
  yellow: {
    bar: "bg-dsp-yellow",
    outline: "focus-visible:outline-dsp-yellow",
    decoration: "hover:decoration-dsp-yellow",
  },
} as const;

const folio = (n: number) => String(n).padStart(2, "0");

export default function PageReader({
  pages,
  title,
  pageRatio,
  accent = "red",
}: Props) {
  const tone = ACCENT[accent];
  const [page, setPage] = useState(0);
  const [turn, setTurn] = useState(1);
  const reduceMotion = useReducedMotion();
  const total = pages.length;

  // Tracks the live page so quick, repeated turns don't read a stale value.
  const pageRef = useRef(0);

  const turnTo = useCallback(
    (target: number) => {
      if (total === 0) return;
      const wrapped = ((target % total) + total) % total;
      setTurn(target > pageRef.current ? 1 : -1);
      pageRef.current = wrapped;
      setPage(wrapped);
    },
    [total]
  );

  const back = useCallback(() => turnTo(pageRef.current - 1), [turnTo]);
  const forward = useCallback(() => turnTo(pageRef.current + 1), [turnTo]);

  // Arrow keys belong to this reader only while it is the thing being used:
  // focus inside it, or the pointer over it. Otherwise typing in a form field
  // elsewhere on the page would turn pages.
  const rootRef = useRef<HTMLDivElement>(null);
  const hoveredRef = useRef(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;

      const root = rootRef.current;
      if (!root) return;

      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable]")) return;

      const owns =
        (target && root.contains(target)) ||
        (hoveredRef.current && (!target || target === document.body));
      if (!owns) return;

      e.preventDefault();
      if (e.key === "ArrowLeft") back();
      else forward();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [back, forward]);

  if (total === 0) {
    return (
      <div className="bg-white dark:bg-neutral-100 px-8 py-16 text-center shadow-[0_18px_40px_-20px_rgba(0,0,0,0.45)]">
        <p className="font-sarlotte text-neutral-900 text-2xl mb-3">
          The pages are still at print
        </p>
        <p className="font-raleway text-sm text-neutral-600 leading-relaxed max-w-[38ch] mx-auto">
          Email us and we will send this brochure to you directly, usually the
          same working day.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      onPointerEnter={() => (hoveredRef.current = true)}
      onPointerLeave={() => (hoveredRef.current = false)}
    >
      {/* The sheet — the one object on this page with weight */}
      <div
        className="relative select-none"
        role="group"
        aria-label={`${title}, page ${page + 1} of ${total}`}
      >
        <div
          className="relative w-full bg-white dark:bg-neutral-100 overflow-hidden shadow-[0_24px_60px_-28px_rgba(0,0,0,0.5)]"
          style={{ aspectRatio: pageRatio }}
        >
          <AnimatePresence initial={false} mode="popLayout">
            <motion.div
              key={pages[page].url}
              drag={total > 1 ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.12}
              onDragEnd={(_, info) => {
                if (info.offset.x < -70) forward();
                else if (info.offset.x > 70) back();
              }}
              initial={
                reduceMotion ? { opacity: 0 } : { opacity: 0, x: turn * 56 }
              }
              animate={{ opacity: 1, x: 0 }}
              exit={
                reduceMotion ? { opacity: 0 } : { opacity: 0, x: turn * -56 }
              }
              transition={{ duration: reduceMotion ? 0.15 : 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 cursor-grab active:cursor-grabbing"
            >
              <Image
                src={pages[page].url}
                alt={pages[page].alt || `${title}, page ${page + 1}`}
                fill
                sizes="(max-width: 1023px) 100vw, 860px"
                loading="eager"
                fetchPriority="high"
                draggable={false}
                className="object-contain"
              />
            </motion.div>
          </AnimatePresence>

          {/* Gutter: the shadow a bound page casts into its spine */}
          <div
            aria-hidden
            className="absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-black/12 to-transparent"
          />
        </div>

        {total > 1 && (
          /* Print furniture: folio, how far through the book, page turns */
          <div className="mt-5 flex items-center gap-5">
            <p className="font-raleway text-[0.7rem] text-muted-foreground tabular-nums shrink-0">
              {folio(page + 1)}
              <span className="text-muted-foreground/50"> of </span>
              {folio(total)}
            </p>

            <div
              aria-hidden
              className="relative flex-1 h-px bg-border overflow-hidden"
            >
              <div
                className={`absolute inset-y-0 left-0 transition-[width] duration-500 ${tone.bar}`}
                style={{ width: `${((page + 1) / total) * 100}%` }}
              />
            </div>

            <a
              href={pages[page].url}
              target="_blank"
              rel="noopener noreferrer"
              className={`font-raleway text-[0.72rem] text-muted-foreground hover:text-foreground underline underline-offset-4 decoration-border transition-colors shrink-0 ${tone.decoration}`}
            >
              Full size
            </a>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={back}
                aria-label="Previous page"
                className={`w-9 h-9 flex items-center justify-center text-foreground/70 hover:text-foreground hover:bg-foreground/5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${tone.outline}`}
              >
                <ChevronLeft className="w-5 h-5" strokeWidth={1.5} />
              </button>
              <button
                type="button"
                onClick={forward}
                aria-label="Next page"
                className={`w-9 h-9 flex items-center justify-center text-foreground/70 hover:text-foreground hover:bg-foreground/5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${tone.outline}`}
              >
                <ChevronRight className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Contact sheet */}
      {total > 1 && (
        <div className="mt-8 flex gap-2.5 overflow-x-auto pb-2 snap-x">
          {pages.map((p, i) => (
            <button
              key={p.url}
              type="button"
              onClick={() => turnTo(i)}
              aria-label={`Turn to page ${i + 1}`}
              aria-current={i === page}
              className={`group shrink-0 snap-start focus-visible:outline-2 focus-visible:outline-offset-2 ${tone.outline}`}
            >
              <span
                className={`block h-0.5 mb-1.5 transition-colors ${
                  i === page ? tone.bar : "bg-transparent"
                }`}
              />
              <span
                className={`relative block h-14 sm:h-16 bg-white dark:bg-neutral-100 overflow-hidden transition-opacity ${
                  i === page
                    ? "opacity-100"
                    : "opacity-45 group-hover:opacity-80"
                }`}
                style={{ aspectRatio: pageRatio }}
              >
                <Image src={p.url} alt="" fill sizes="104px" className="object-cover" />
              </span>
              <span className="block mt-1.5 font-raleway text-[0.6rem] tabular-nums text-muted-foreground">
                {folio(i + 1)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
