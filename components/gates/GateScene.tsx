"use client";

import type { MouseEvent, ReactElement } from "react";
import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { GATE_ICONS } from "@/components/home/GateIcons";
import { BLAZE_FILTER } from "@/components/shared/blaze";
import { FrequencyWaves } from "@/components/shared/FrequencyWaves";
import type { Ribbon, WavePalette } from "@/components/shared/FrequencyWaves";
import { rgbString } from "@/lib/gates";
import type { Gate } from "@/lib/gates";

type Rgb = readonly [number, number, number];

/** A topic the gate will hold, optionally with sub-items. */
export interface GateTopic {
  title: string;
  items?: readonly string[];
}

export interface GateSceneProps {
  gate: Gate;
  topics?: readonly GateTopic[];
}

function mix(a: Rgb, b: Rgb, t: number): Rgb {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

/** Shades of the gate's color across the waves: deeper on the left, lighter on the right. */
export function gatePalette(rgb: Rgb): WavePalette {
  return {
    left: mix(rgb, [20, 60, 110], 0.35),
    front: rgb,
    right: mix(rgb, [255, 250, 200], 0.4),
  };
}

/** Ribbons crossing behind the gate's symbol and name. */
const GATE_RIBBONS: readonly Ribbon[] = [
  { y: 0.3, amp: 0.13, freq: 1.0, freq2: 2.4, speed: 0.38, twist: 1.9, strands: 44, alpha: 0.22 },
  { y: 0.28, amp: 0.09, freq: 0.75, freq2: 3.1, speed: -0.28, twist: 2.6, strands: 30, alpha: 0.14 },
];

const CENTERED_RIBBONS: readonly Ribbon[] = GATE_RIBBONS.map((r) => ({ ...r, y: r.y + 0.12 }));

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Landing page of a gate that is still being built: its symbol, alive, over frequency
 * waves in the gate's own color, the topics it will hold, and a "coming soon" mark.
 * Touching the symbol makes it blaze with light that floods the screen in the gate's
 * color and surges through the waves — as the dove does on the about page.
 */
export function GateScene({ gate, topics = [] }: GateSceneProps): ReactElement {
  // Without topics the symbol sits near mid-screen, so the waves cross a little lower.
  const ribbons = topics.length > 0 ? GATE_RIBBONS : CENTERED_RIBBONS;
  const reduceMotion = useReducedMotion() === true;
  const Icon = GATE_ICONS[gate.id];
  /** Each touch of the symbol: a counter (keys fresh animations) and where the light starts. */
  const [blaze, setBlaze] = useState<{ n: number; x: number; y: number }>({ n: 0, x: 0, y: 0 });

  const ignite = (e: MouseEvent<HTMLButtonElement>): void => {
    const r = e.currentTarget.getBoundingClientRect();
    setBlaze((b) => ({ n: b.n + 1, x: r.left + r.width / 2, y: r.top + r.height / 2 }));
  };
  const palette = gatePalette(gate.rgb);
  const c = (alpha: number): string => rgbString(gate.rgb, alpha);
  const enter = (delay: number) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 18 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 1, delay, ease: EASE },
        };

  return (
    // Centered vertically: a gate with few topics sits in the middle of the screen.
    <div className="relative isolate flex min-h-[calc(100dvh-4rem)] w-full flex-col items-center justify-center overflow-x-clip px-6 py-14 text-white">
      {/* Night sky washed in the gate's color */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-20"
        style={{
          background: `radial-gradient(70% 50% at 50% 28%, ${c(0.32)}, transparent 75%), radial-gradient(60% 40% at 50% 100%, ${rgbString(palette.left, 0.25)}, transparent 75%), #05080a`,
        }}
      />
      <FrequencyWaves
        colors={() => palette}
        energized={false}
        still={reduceMotion}
        ribbons={ribbons}
        pulseKey={blaze.n}
      />

      {/* The light floods the screen in the gate's color */}
      <AnimatePresence>
        {blaze.n > 0 && !reduceMotion ? (
          <motion.div
            key={blaze.n}
            aria-hidden
            className="pointer-events-none fixed inset-0 z-[70]"
            style={{
              background: `radial-gradient(circle at ${blaze.x}px ${blaze.y}px, rgba(255,255,255,0.95), ${c(0.55)} 35%, ${c(0.12)} 75%)`,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.9, 0] }}
            transition={{ duration: 1.1, times: [0, 0.15, 1], ease: "easeOut" }}
          />
        ) : null}
      </AnimatePresence>

      {/* Symbol */}
      <motion.button
        type="button"
        onClick={ignite}
        aria-label={`האירו את ${gate.title}`}
        {...enter(0)}
        className="relative flex size-36 cursor-pointer items-center justify-center rounded-full border border-white/30 bg-white/[0.06] backdrop-blur-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 md:size-44"
        style={{ boxShadow: `0 0 60px ${c(0.55)}, inset 0 0 30px ${c(0.25)}` }}
      >
        <Icon engaged={!reduceMotion} weight={0.8} className="size-24 text-white md:size-28" />
        <AnimatePresence>
          {blaze.n > 0 ? (
            <motion.span
              key={blaze.n}
              aria-hidden
              className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 1, 0] }}
              transition={{
                duration: reduceMotion ? 0.8 : 1.5,
                times: [0, 0.12, 0.45, 1],
                ease: "easeOut",
              }}
            >
              {/* The circle fills with light… */}
              <span
                className="absolute inset-0 rounded-full"
                style={{
                  background: `radial-gradient(closest-side, rgba(255,255,255,0.95), ${c(0.6)} 60%, transparent)`,
                }}
              />
              {/* …and the symbol blazes white */}
              <span className="relative" style={{ filter: BLAZE_FILTER }}>
                <Icon engaged weight={1.3} className="size-24 text-white md:size-28" />
              </span>
            </motion.span>
          ) : null}
        </AnimatePresence>
      </motion.button>

      {/* Name */}
      <motion.h1
        {...enter(0.2)}
        className="mt-8 text-center font-heading text-5xl font-bold tracking-tight md:text-7xl"
        style={{ textShadow: `0 0 40px ${c(0.6)}` }}
      >
        {gate.title}
      </motion.h1>
      {gate.tagline !== undefined ? (
        <motion.p {...enter(0.35)} className="mt-3 text-center text-lg text-white/70 md:text-xl">
          {gate.tagline}
        </motion.p>
      ) : null}

      {/* What the gate will hold */}
      {topics.length > 0 ? (
        <ul className="mt-12 flex w-full max-w-xl flex-col gap-4">
          {topics.map((topic, i) => (
            <motion.li
              key={topic.title}
              {...enter(0.5 + i * 0.15)}
              className="rounded-2xl border bg-[#05080a]/55 px-6 py-5 text-center backdrop-blur-md"
              style={{ borderColor: c(0.35), boxShadow: `0 0 30px ${c(0.12)}` }}
            >
              <h2 className="font-heading text-2xl font-bold text-white md:text-3xl">
                {topic.title}
              </h2>
              {topic.items !== undefined && topic.items.length > 0 ? (
                <ul className="mt-4 flex flex-col gap-3">
                  {topic.items.map((item) => (
                    <li
                      key={item}
                      className="flex items-start justify-center gap-3 text-base leading-relaxed text-white/80 md:text-lg"
                    >
                      <span
                        aria-hidden
                        className="mt-2.5 size-1.5 shrink-0 rounded-full"
                        style={{ background: rgbString(gate.rgb), boxShadow: `0 0 8px ${c(0.9)}` }}
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </motion.li>
          ))}
        </ul>
      ) : null}

      {/* Coming soon */}
      <motion.p
        {...enter(0.6 + topics.length * 0.15)}
        className="mt-12 rounded-full border px-5 py-2 text-sm font-medium tracking-widest text-white/85"
        style={{ borderColor: c(0.6), boxShadow: `0 0 24px ${c(0.25)}` }}
      >
        בקרוב
      </motion.p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-white/60 transition hover:text-white"
      >
        <ArrowRight className="size-4" aria-hidden />
        חזרה לשערים
      </Link>
    </div>
  );
}
