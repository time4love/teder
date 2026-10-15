"use client";

import type { ReactElement } from "react";
import { motion } from "framer-motion";

import { GATE_ICONS } from "@/components/home/GateIcons";
import { rgbString } from "@/lib/gates";
import { cn } from "@/lib/utils";

import type { Gate } from "@/lib/gates";

export interface GateCircleProps {
  gate: Gate;
  /** The user is engaging this gate — it is (or is travelling to) the front and opens up. */
  engaged: boolean;
  /** "circle" stands as a round portal; "ellipse" stretches it to the full gate height. */
  shape?: "circle" | "ellipse";
}

/**
 * The gate as a round (or elliptical) portal standing on the ring: a glowing rim in the gate's color, light
 * from its center, and a dashed orbit that turns while the gate is engaged.
 */
export function GateCircle({
  gate,
  engaged,
  shape = "circle",
}: GateCircleProps): ReactElement {
  const Icon = GATE_ICONS[gate.id];
  const c = (alpha: number): string => rgbString(gate.rgb, alpha);

  return (
    <motion.div
      animate={{ scale: engaged ? 1.22 : 1 }}
      transition={{ type: "spring", stiffness: 160, damping: 18 }}
      style={{ transformOrigin: "50% 100%" }}
      className="relative flex h-full w-full items-end"
    >
      {/* Floor glow under the portal */}
      <motion.div
        aria-hidden
        animate={{ opacity: engaged ? 1 : 0.55, scaleX: engaged ? 1.25 : 1 }}
        transition={{ duration: 0.6 }}
        className="absolute -bottom-5 left-1/2 h-10 w-[90%] -translate-x-1/2 rounded-[50%] blur-xl"
        style={{ background: c(0.55) }}
      />

      <div
        className={cn(
          "relative w-full",
          shape === "circle" ? "aspect-square" : "h-full",
        )}
      >
        {/* Orbit: dashes flow along the outline (rotating an ellipse would tilt it) */}
        <motion.svg
          aria-hidden
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute -inset-3 h-[calc(100%+1.5rem)] w-[calc(100%+1.5rem)] overflow-visible"
          animate={{ opacity: engaged ? 0.8 : 0.3 }}
          transition={{ duration: 0.6 }}
        >
          <motion.ellipse
            cx={50}
            cy={50}
            rx={49.5}
            ry={49.5}
            fill="none"
            stroke={c(0.7)}
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
            pathLength={100}
            strokeDasharray="0.7 1.3"
            animate={{ strokeDashoffset: engaged ? [0, -100] : 0 }}
            transition={
              engaged
                ? { duration: 30, ease: "linear", repeat: Infinity }
                : { duration: 0.6 }
            }
          />
        </motion.svg>

        {/* Rim and body */}
        <motion.div
          animate={{
            boxShadow: engaged
              ? `0 0 70px ${c(0.65)}, inset 0 0 40px ${c(0.45)}`
              : `0 0 28px ${c(0.3)}, inset 0 0 24px ${c(0.25)}`,
          }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0 overflow-hidden rounded-[50%] border backdrop-blur-sm"
          style={{
            borderColor: c(0.8),
            background: `linear-gradient(to top, ${c(0.35)}, rgba(10, 10, 18, 0.72) 75%)`,
          }}
        >
          {/* Inner ring with light from the center */}
          <div
            className="absolute inset-4 overflow-hidden rounded-[50%] border"
            style={{ borderColor: c(0.35) }}
          >
            <motion.div
              aria-hidden
              animate={{ opacity: engaged ? 1 : 0.5 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0"
              style={{
                background: `radial-gradient(closest-side at 50% 42%, ${c(0.95)}, ${c(0.3)} 60%, transparent)`,
              }}
            />
            <motion.div
              aria-hidden
              animate={{ opacity: engaged ? 0.5 : 0, rotate: engaged ? 360 : 0 }}
              transition={{
                opacity: { duration: 0.6 },
                rotate: { duration: 24, ease: "linear", repeat: Infinity },
              }}
              className="absolute left-1/2 top-[42%] size-[220%] -translate-x-1/2 -translate-y-1/2"
              style={{
                background:
                  "repeating-conic-gradient(from 0deg, rgba(255,255,255,0.22) 0deg 4deg, transparent 4deg 18deg)",
                maskImage: "radial-gradient(closest-side, #000, transparent 70%)",
                WebkitMaskImage: "radial-gradient(closest-side, #000, transparent 70%)",
              }}
            />
          </div>

          {/* Content */}
          <div className="relative flex h-full flex-col items-center justify-center gap-4 text-center">
            <motion.div
              animate={{ y: engaged ? -6 : 0 }}
              transition={{ duration: 0.6 }}
              className="flex size-20 items-center justify-center rounded-full border border-white/40 bg-white/10 backdrop-blur-md"
              style={{ boxShadow: `0 0 30px ${c(0.6)}` }}
            >
              <Icon engaged={engaged} className="size-11 text-white" />
            </motion.div>
            <h2 className="font-heading text-3xl font-bold leading-none text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]">
              {gate.title}
            </h2>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
