"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";

export default function Loading() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="relative">
        {/* Logo with pulse animation */}
        <div className="animate-pulse">
          <Image
            src={mounted && resolvedTheme === "light" ? "/logo-b.svg" : "/logo-w.svg"}
            alt="DSP Logo"
            width={200}
            height={106}
            className="opacity-80"
            priority
          />
        </div>

        {/* Subtle loading indicator */}
        <div className="mt-8 flex justify-center">
          <div className="flex space-x-2">
            <div className="w-2 h-2 bg-dsp-red rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-dsp-blue rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-dsp-green rounded-full animate-bounce"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
