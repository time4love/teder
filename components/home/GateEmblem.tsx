"use client";

import type { ReactElement } from "react";
import { motion } from "framer-motion";

import { GATE_ICONS } from "@/components/home/GateIcons";
import { rgbString } from "@/lib/gates";

import type { Gate } from "@/lib/gates";

export interface GateEmblemProps {
  gate: Gate;
  /** The user is engaging this gate — it is (or is travelling to) the front and opens up. */
  engaged: boolean;
}

/**
 * The gate as its own symbol, drawn large and free-standing on the ring: no frame, just the
 * emblem glowing in the gate's color above a pool of light, with the gate's name beneath.
 */
export function GateEmblem({ gate, engaged }: GateEmblemProps): ReactElement {
  const Icon = GATE_ICONS[gate.id];
  const c = (alpha: number): string => rgbString(gate.rgb, alpha);

  return (
    <motion.div
      animate={{ scale: engaged ? 1.22 : 1 }}
      transition={{ type: "spring", stiffness: 160, damping: 18 }}
      style={{ transformOrigin: "50% 100%" }}
      className="relative flex h-full w-full flex-col items-center justify-end"
    >
      {/* Pool of light on the ring */}
      <motion.div
        aria-hidden
        animate={{ opacity: engaged ? 1 : 0.55, scaleX: engaged ? 1.3 : 1 }}
        transition={{ duration: 0.6 }}
        className="absolute -bottom-5 left-1/2 h-10 w-[110%] -translate-x-1/2 rounded-[50%] blur-xl"
        style={{ background: c(0.6) }}
      />

      {/* Aura behind the emblem */}
      <motion.div
        aria-hidden
        animate={{ opacity: engaged ? 0.95 : 0.5, scale: engaged ? 1.1 : 1 }}
        transition={{ duration: 0.7 }}
        className="absolute left-1/2 top-[4%] size-[105%] -translate-x-1/2 rounded-full blur-2xl"
        style={{ background: `radial-gradient(closest-side, ${c(0.55)}, transparent)` }}
      />

      {/* Emblem */}
      <motion.div
        animate={{ y: engaged ? -6 : 0 }}
        transition={{ duration: 0.6 }}
        className="relative mb-4 w-full text-white"
        style={{
          filter: `drop-shadow(0 0 10px ${c(0.9)}) drop-shadow(0 0 28px ${c(0.6)})`,
        }}
      >
        <Icon engaged={engaged} weight={0.6} className="h-auto w-full" />
      </motion.div>

      <h2 className="relative pb-3 font-heading text-4xl font-bold leading-none text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.7)]">
        {gate.title}
      </h2>
    </motion.div>
  );
}
