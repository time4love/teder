"use client";

import type { ReactElement } from "react";
import { motion } from "framer-motion";

import { GATE_ICONS } from "@/components/home/GateIcons";
import { rgbString } from "@/lib/gates";

import type { Gate } from "@/lib/gates";

export interface GateArchProps {
  gate: Gate;
  /** The user is engaging this gate — it is (or is travelling to) the front and opens up. */
  engaged: boolean;
}

/**
 * The visual gate: an arched frame in the gate's color with light pouring out of its doorway.
 * Purely presentational — positioning on the ring is handled by {@link GatePortal}.
 */
export function GateArch({ gate, engaged }: GateArchProps): ReactElement {
  const Icon = GATE_ICONS[gate.id];
  const c = (alpha: number): string => rgbString(gate.rgb, alpha);

  return (
    <motion.div
      animate={{ scale: engaged ? 1.22 : 1 }}
      transition={{ type: "spring", stiffness: 160, damping: 18 }}
      style={{ transformOrigin: "50% 100%" }}
      className="relative h-full w-full"
    >
      {/* Floor glow under the gate */}
      <motion.div
        aria-hidden
        animate={{ opacity: engaged ? 1 : 0.55, scaleX: engaged ? 1.25 : 1 }}
        transition={{ duration: 0.6 }}
        className="absolute -bottom-6 left-1/2 h-12 w-[140%] -translate-x-1/2 rounded-[50%] blur-xl"
        style={{ background: c(0.55) }}
      />

      {/* Outer arch */}
      <motion.div
        animate={{
          boxShadow: engaged
            ? `0 0 70px ${c(0.65)}, inset 0 0 40px ${c(0.45)}`
            : `0 0 28px ${c(0.3)}, inset 0 0 24px ${c(0.25)}`,
        }}
        transition={{ duration: 0.6 }}
        className="absolute inset-0 overflow-hidden rounded-b-2xl rounded-t-full border backdrop-blur-sm"
        style={{
          borderColor: c(0.75),
          background: `linear-gradient(to top, ${c(0.32)}, rgba(10, 10, 18, 0.72) 70%)`,
        }}
      >
        {/* Doorway: light from inside the gate */}
        <div
          className="absolute inset-x-4 bottom-4 top-4 overflow-hidden rounded-b-xl rounded-t-full border"
          style={{ borderColor: c(0.35) }}
        >
          <motion.div
            aria-hidden
            animate={{ opacity: engaged ? 1 : 0.5 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0"
            style={{
              background: `radial-gradient(120% 70% at 50% 38%, ${c(0.95)}, ${c(0.35)} 45%, transparent 80%)`,
            }}
          />
          {/* Light rays sweeping slowly while engaged */}
          <motion.div
            aria-hidden
            animate={{ opacity: engaged ? 0.55 : 0, rotate: engaged ? 360 : 0 }}
            transition={{
              opacity: { duration: 0.6 },
              rotate: { duration: 24, ease: "linear", repeat: Infinity },
            }}
            className="absolute left-1/2 top-[38%] size-[220%] -translate-x-1/2 -translate-y-1/2"
            style={{
              background:
                "repeating-conic-gradient(from 0deg, rgba(255,255,255,0.22) 0deg 4deg, transparent 4deg 18deg)",
              maskImage: "radial-gradient(closest-side, #000, transparent 70%)",
              WebkitMaskImage: "radial-gradient(closest-side, #000, transparent 70%)",
            }}
          />
        </div>

        {/* Content */}
        <div className="relative flex h-full flex-col items-center justify-end gap-3 px-6 pb-10 text-center">
          <motion.div
            animate={{ y: engaged ? -6 : 0 }}
            transition={{ duration: 0.6 }}
            className="mb-auto mt-[28%] flex size-20 items-center justify-center rounded-full border border-white/40 bg-white/10 backdrop-blur-md"
            style={{ boxShadow: `0 0 30px ${c(0.6)}` }}
          >
            <Icon engaged={engaged} className="size-11 text-white" />
          </motion.div>
          <h2 className="font-heading text-4xl font-bold leading-none text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]">
            {gate.title}
          </h2>
        </div>
      </motion.div>
    </motion.div>
  );
}
