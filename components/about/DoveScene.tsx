"use client";

import type { PointerEvent, ReactElement } from "react";
import { useState } from "react";
import Image from "next/image";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";

import { FrequencyWaves } from "@/components/shared/FrequencyWaves";
import type { Ribbon, WavePalette } from "@/components/shared/FrequencyWaves";

/** The logo's colors: blue field on the left, red on the right, violet where they meet. */
const LOGO_PALETTE: WavePalette = {
  left: [52, 92, 255],
  front: [178, 120, 255],
  right: [255, 64, 72],
};
const logoPalette = (): WavePalette => LOGO_PALETTE;

/** Wide ribbons crossing behind the dove's body, as behind the words in the logo. */
const ABOUT_RIBBONS: readonly Ribbon[] = [
  { y: 0.5, amp: 0.15, freq: 1.0, freq2: 2.4, speed: 0.4, twist: 1.9, strands: 48, alpha: 0.24 },
  { y: 0.48, amp: 0.1, freq: 0.75, freq2: 3.1, speed: -0.3, twist: 2.6, strands: 34, alpha: 0.15 },
];

/**
 * Motes of light rising from the waves, in two depths: small faint ones behind the dove and
 * larger, softer ones drifting in front of it. Values are fixed so server and client agree.
 */
const BACK_MOTES = Array.from({ length: 24 }, (_, i) => ({
  color: "255,255,255",
  left: (i * 37.3) % 100,
  bottom: 30,
  size: 2 + ((i * 7) % 3),
  blur: 0,
  peak: 0.85,
  rise: 420,
  drift: 0,
  duration: 7 + ((i * 13) % 6),
  delay: (i * 0.71) % 7,
}));
const FRONT_MOTES = Array.from({ length: 16 }, (_, i) => ({
  /** Warm gold so the near motes read against the white dove. */
  color: "255,214,140",
  left: 14 + ((i * 29.7) % 72),
  bottom: 18 + ((i * 17) % 34),
  size: 6 + ((i * 5) % 6),
  blur: 0.6 + ((i * 3) % 4) * 0.5,
  peak: 0.8 + ((i * 7) % 3) * 0.1,
  rise: 300 + ((i * 41) % 220),
  drift: ((i % 2 === 0 ? 1 : -1) * (10 + ((i * 11) % 20))),
  duration: 6 + ((i * 7) % 5),
  delay: (i * 0.93) % 6,
}));

type Mote = (typeof BACK_MOTES)[number];

/** How far each depth layer shifts with the pointer — nearer layers move more. */
const BACK_PARALLAX_PX = 8;
const FRONT_PARALLAX_PX = 34;

/**
 * About page scene: the dove from the logo, still, above flowing frequency waves in the
 * logo's blue and red. Motes of light rise behind and in front of it for depth; the near
 * ones shift more with the pointer. Touching the dove sends a ripple and a surge through
 * the waves.
 */
export function DoveScene(): ReactElement {
  const reduceMotion = useReducedMotion() === true;
  const [pulse, setPulse] = useState(0);

  const pointerX = useSpring(0, { stiffness: 40, damping: 16 });
  const pointerY = useSpring(0, { stiffness: 40, damping: 16 });
  const backX = useTransform(pointerX, (v) => v * BACK_PARALLAX_PX);
  const backY = useTransform(pointerY, (v) => v * BACK_PARALLAX_PX * 0.5);
  const frontX = useTransform(pointerX, (v) => v * FRONT_PARALLAX_PX);
  const frontY = useTransform(pointerY, (v) => v * FRONT_PARALLAX_PX * 0.5);

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>): void => {
    const rect = e.currentTarget.getBoundingClientRect();
    pointerX.set(((e.clientX - rect.left) / rect.width) * 2 - 1);
    pointerY.set(((e.clientY - rect.top) / rect.height) * 2 - 1);
  };

  const sendPulse = (): void => setPulse((p) => p + 1);

  return (
    <div
      onPointerMove={handlePointerMove}
      onPointerLeave={() => {
        pointerX.set(0);
        pointerY.set(0);
      }}
      className="relative isolate flex h-[calc(100dvh-4rem)] min-h-[560px] w-full flex-col items-center overflow-hidden text-white"
    >
      {/* Night sky with the logo's two color fields */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-20 bg-[#05050a]" />
      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-[22%] top-[42%] -z-20 size-[55vmax] rounded-full blur-[110px]"
        style={{
          x: "-50%",
          y: "-50%",
          background: "radial-gradient(closest-side, rgba(52,92,255,0.55), transparent)",
        }}
        animate={reduceMotion ? undefined : { scale: [1, 1.12, 1], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-[78%] top-[42%] -z-20 size-[55vmax] rounded-full blur-[110px]"
        style={{
          x: "-50%",
          y: "-50%",
          background: "radial-gradient(closest-side, rgba(255,64,72,0.5), transparent)",
        }}
        animate={reduceMotion ? undefined : { scale: [1.12, 1, 1.12], opacity: [1, 0.8, 1] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />

      <FrequencyWaves
        colors={logoPalette}
        pointerX={pointerX}
        energized={false}
        still={reduceMotion}
        ribbons={ABOUT_RIBBONS}
        pulseKey={pulse}
      />

      {/* Motes behind the dove */}
      {!reduceMotion ? (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{ x: backX, y: backY }}
        >
          <MoteLayer motes={BACK_MOTES} />
        </motion.div>
      ) : null}

      {/* Dove */}
      <div className="relative mt-[4vh] flex w-full justify-center md:mt-[5vh]">
        {/* Halo and slow light rays behind the dove */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 -z-10 size-[min(620px,95vw)] rounded-full"
          style={{
            x: "-50%",
            y: "-50%",
            background:
              "radial-gradient(closest-side, rgba(255,247,225,0.5), rgba(255,220,170,0.16) 45%, transparent 72%)",
          }}
          animate={reduceMotion ? undefined : { scale: [1, 1.08, 1], opacity: [0.75, 1, 0.75] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 -z-10 size-[min(900px,140vw)]"
          style={{
            x: "-50%",
            y: "-50%",
            background:
              "repeating-conic-gradient(from 0deg, rgba(255,240,210,0.14) 0deg 3deg, transparent 3deg 14deg)",
            maskImage: "radial-gradient(closest-side, #000 10%, transparent 70%)",
            WebkitMaskImage: "radial-gradient(closest-side, #000 10%, transparent 70%)",
          }}
          animate={reduceMotion ? undefined : { rotate: 360 }}
          transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
        />

        {/* Ripple sent out by a touch */}
        <AnimatePresence>
          {pulse > 0 ? (
            <motion.div
              key={pulse}
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-1/2 -z-10 size-[260px] rounded-full border border-white/60"
              style={{ x: "-50%", y: "-50%" }}
              initial={{ scale: 0.4, opacity: 0.8 }}
              animate={{ scale: 4, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.6, ease: "easeOut" }}
            />
          ) : null}
        </AnimatePresence>

        {/* The dove stands still; it only fades in out of the light */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.8, ease: "easeOut" }}
          className="w-[min(600px,86vw)]"
        >
          <button
            type="button"
            onClick={sendPulse}
            aria-label="היונה של תדר-ישר-אל"
            className="block w-full cursor-pointer drop-shadow-[0_0_28px_rgba(255,244,214,0.55)] focus-visible:outline-none"
          >
            <Image
              src="/dove.png"
              alt=""
              width={1551}
              height={1008}
              priority
              draggable={false}
              className="h-auto w-full select-none"
            />
          </button>
        </motion.div>
      </div>

      {/* Motes in front of the dove */}
      {!reduceMotion ? (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-10"
          style={{ x: frontX, y: frontY }}
        >
          <MoteLayer motes={FRONT_MOTES} />
        </motion.div>
      ) : null}

      {/* Words */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.4, delay: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="relative mt-auto mb-[9vh] flex flex-col items-center gap-4 px-6 text-center"
      >
        <h1 className="bg-gradient-to-l from-[#ff5a64] via-[#c08bff] to-[#5b84ff] bg-clip-text font-heading text-5xl font-bold leading-tight tracking-tight text-transparent drop-shadow-[0_0_30px_rgba(192,139,255,0.35)] md:text-7xl">
          להתחבר לתדר אמת.
        </h1>
        <p className="text-lg font-medium text-white/75 md:text-xl">
          ארכיון חשיפות, עדויות ומידע.
        </p>
      </motion.div>
    </div>
  );
}

/** One depth layer of rising motes of light. */
function MoteLayer({ motes }: { motes: readonly Mote[] }): ReactElement {
  return (
    <>
      {motes.map((m, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${m.left}%`,
            bottom: `${m.bottom}%`,
            width: m.size,
            height: m.size,
            background: `rgb(${m.color})`,
            filter: m.blur > 0 ? `blur(${m.blur}px)` : undefined,
            boxShadow: `0 0 ${m.size * 2}px rgba(${m.color},0.95)`,
          }}
          animate={{ y: [0, -m.rise], x: [0, m.drift], opacity: [0, m.peak, 0] }}
          transition={{ duration: m.duration, delay: m.delay, repeat: Infinity, ease: "easeOut" }}
        />
      ))}
    </>
  );
}
