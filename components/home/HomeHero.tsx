"use client";

import type { ReactElement } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";

/**
 * Scroll-linked parallax hero: logo floats above the page and fades as the user scrolls down.
 */
export function HomeHero(): ReactElement {
  const { scrollY } = useScroll();

  const opacity = useTransform(scrollY, [0, 400], [1, 0], { clamp: true });
  const y = useTransform(scrollY, [0, 400], [0, -100], { clamp: true });
  const scale = useTransform(scrollY, [0, 400], [1, 0.9], { clamp: true });

  return (
    <div className="relative flex min-h-[50vh] w-full flex-col items-center justify-center overflow-hidden pt-12 md:pt-14">
      <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center">
        <div className="h-[250px] w-[300px] rounded-[100%] bg-amber-200/40 blur-[80px] sm:h-[400px] sm:w-[600px]" />
        <div className="absolute left-1/2 top-1/2 h-[300px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-[100%] bg-yellow-500/10 blur-[100px] sm:h-[500px] sm:w-[800px]" />
      </div>
      <motion.div
        style={{ opacity, y, scale }}
        className="relative z-10 flex flex-col items-center gap-0 text-center"
      >
        <div className="relative z-10 w-full max-w-[320px] sm:max-w-[450px] md:max-w-[600px] lg:max-w-[800px]">
          <Image
            src="/logo.png"
            alt="תדר-ישר-אל"
            width={1500}
            height={400}
            className="h-auto w-full object-contain"
            priority
          />
        </div>
        <p className="mt-6 max-w-2xl text-lg font-medium tracking-wide text-zinc-800 drop-shadow-sm sm:text-xl md:text-2xl">
          ארכיון דוקומנטרי של עדויות וחשיפות אמת
        </p>
      </motion.div>
    </div>
  );
}
