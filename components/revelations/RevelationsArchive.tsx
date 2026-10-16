"use client";

import type { ReactElement } from "react";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { gatePalette } from "@/components/gates/GateScene";
import { GATE_ICONS } from "@/components/home/GateIcons";
import { ArchiveRows } from "@/components/revelations/ArchiveRows";
import { ArchiveWall } from "@/components/revelations/ArchiveWall";
import { FrequencyWaves } from "@/components/shared/FrequencyWaves";
import type { Ribbon } from "@/components/shared/FrequencyWaves";
import { GATES, rgbString } from "@/lib/gates";
import type { ArchiveCategory } from "@/lib/archive";

const gate = GATES[1];
const palette = gatePalette(gate.rgb);
const Icon = GATE_ICONS[gate.id];

/** Waves crossing behind the gate's name; they belong to the header and scroll away with it. */
const HEADER_RIBBONS: readonly Ribbon[] = [
  { y: 0.5, amp: 0.26, freq: 1.0, freq2: 2.4, speed: 0.36, twist: 1.9, strands: 40, alpha: 0.2 },
  { y: 0.48, amp: 0.18, freq: 0.75, freq2: 3.1, speed: -0.26, twist: 2.6, strands: 28, alpha: 0.12 },
];

/**
 * The חשיפות אמת archive: the gate's light over violet waves, then its playlists grouped by
 * category — a filterable magazine wall on wide screens, swipeable rows on phones.
 */
export function RevelationsArchive({ categories }: { categories: ArchiveCategory[] }): ReactElement {
  const reduceMotion = useReducedMotion() === true;
  /** Desktop: the hovered playlist's cover tints the night sky. */
  const [backdrop, setBackdrop] = useState<string | null>(null);
  const c = (alpha: number): string => rgbString(gate.rgb, alpha);

  return (
    <div className="relative isolate min-h-[calc(100dvh-4rem)] w-full overflow-x-clip px-4 pb-24 text-white md:px-8">
      {/* Night sky in the gate's violet */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-30"
        style={{
          background: `radial-gradient(70% 45% at 50% 12%, ${c(0.3)}, transparent 75%), #07060f`,
        }}
      />
      {/* The hovered cover, blurred into the sky */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-20 hidden overflow-hidden lg:block">
        <AnimatePresence>
          {backdrop !== null ? (
            <motion.img
              key={backdrop}
              src={backdrop}
              alt=""
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.28 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="absolute inset-0 h-full w-full scale-125 object-cover blur-[90px] saturate-150"
            />
          ) : null}
        </AnimatePresence>
      </div>
      <FrequencyWaves
        colors={() => palette}
        energized={false}
        still={reduceMotion}
        ribbons={HEADER_RIBBONS}
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[340px] w-full md:h-[420px]"
      />

      {/* Gate header */}
      <motion.header
        initial={reduceMotion ? false : { opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto flex max-w-3xl flex-col items-center pb-4 pt-10 text-center md:pt-14"
      >
        <div
          className="flex size-20 items-center justify-center rounded-full border border-white/25 bg-white/[0.06] backdrop-blur-md md:size-24"
          style={{ boxShadow: `0 0 50px ${c(0.55)}` }}
        >
          <Icon engaged={!reduceMotion} weight={0.9} className="size-12 text-white md:size-14" />
        </div>
        <h1
          className="mt-5 font-heading text-5xl font-bold tracking-tight md:text-7xl"
          style={{ textShadow: `0 0 40px ${c(0.6)}` }}
        >
          {gate.title}
        </h1>
        {gate.tagline !== undefined ? (
          <p className="mt-3 text-lg text-white/65 md:text-xl">{gate.tagline}</p>
        ) : null}
      </motion.header>

      {categories.length === 0 ? (
        <p className="mt-16 text-center text-white/50">לא נמצאו פלייליסטים במערכת.</p>
      ) : (
        <>
          <div className="mx-auto hidden max-w-6xl lg:block">
            <ArchiveWall categories={categories} onFocusCover={setBackdrop} />
          </div>
          <div className="lg:hidden">
            <ArchiveRows categories={categories} />
          </div>
        </>
      )}
    </div>
  );
}
