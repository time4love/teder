"use client";

import type { ReactElement } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";

/**
 * Scroll-linked parallax hero: logo floats above the page and fades as the user scrolls down.
 * Ambient color behind the page is driven by {@link PlaylistGrid} using the same logo asset blurred.
 */
export function HomeHero(): ReactElement {
  const { scrollY } = useScroll();

  const opacity = useTransform(scrollY, [0, 400], [1, 0], { clamp: true });
  const y = useTransform(scrollY, [0, 400], [0, -100], { clamp: true });
  const scale = useTransform(scrollY, [0, 400], [1, 0.9], { clamp: true });

  return (
    <div className="relative z-20 flex min-h-[50vh] w-full flex-col items-center justify-center overflow-hidden pt-12 md:pt-14">
      <motion.div
        style={{ opacity, y, scale }}
        className="relative z-10 flex flex-col items-center gap-0 text-center"
      >
        <div className="relative z-10 flex w-full max-w-[85vw] justify-center sm:max-w-[500px] md:max-w-[700px] lg:max-w-[900px]">
          <Image
            src="/logo.png"
            alt="תדר-ישר-אל"
            width={1500}
            height={400}
            className="h-auto w-full object-contain drop-shadow-lg"
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
