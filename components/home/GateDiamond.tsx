"use client";

import type { ReactElement } from "react";
import { useId } from "react";
import { motion } from "framer-motion";

import { GATE_ICONS } from "@/components/home/GateIcons";
import { rgbString } from "@/lib/gates";

import type { Gate } from "@/lib/gates";

export interface GateDiamondProps {
  gate: Gate;
  /** The user is engaging this gate — it is (or is travelling to) the front and opens up. */
  engaged: boolean;
}

/** Frame box, matching the gate slot on the ring. */
const W = 230;
const H = 320;
/** Height of the diamond's widest point, as a fraction of its height. */
const WAIST = 0.46;

/** Diamond corners inset by `inset` px, standing on its bottom point. */
function diamond(inset: number): string {
  const waist = H * WAIST;
  return [
    [W / 2, inset * 1.4],
    [W - inset, waist],
    [W / 2, H - inset * 1.4],
    [inset, waist],
  ]
    .map(([x, y]) => `${x},${y}`)
    .join(" ");
}

const OUTER = diamond(1.5);
const INNER = diamond(18);
/** Same inner diamond as a CSS clip-path, for the light layers. */
const INNER_CLIP = `polygon(50% ${((18 * 1.4) / H) * 100}%, ${((W - 18) / W) * 100}% ${WAIST * 100}%, 50% ${((H - 18 * 1.4) / H) * 100}%, ${(18 / W) * 100}% ${WAIST * 100}%)`;
const OUTER_CLIP = `polygon(50% 0%, 100% ${WAIST * 100}%, 50% 100%, 0% ${WAIST * 100}%)`;

/**
 * The gate as a standing diamond: a faceted frame in the gate's color with light pouring
 * from its core. Same behaviour as the arch gate — only the shape differs.
 */
export function GateDiamond({ gate, engaged }: GateDiamondProps): ReactElement {
  const Icon = GATE_ICONS[gate.id];
  const c = (alpha: number): string => rgbString(gate.rgb, alpha);
  const uid = useId().replace(/:/g, "");
  const bodyId = `diamond-body-${uid}`;

  const waist = H * WAIST;

  return (
    <motion.div
      animate={{ scale: engaged ? 1.22 : 1 }}
      transition={{ type: "spring", stiffness: 160, damping: 18 }}
      style={{ transformOrigin: "50% 100%" }}
      className="relative h-full w-full"
    >
      {/* Floor glow under the point */}
      <motion.div
        aria-hidden
        animate={{ opacity: engaged ? 1 : 0.55, scaleX: engaged ? 1.25 : 1 }}
        transition={{ duration: 0.6 }}
        className="absolute -bottom-5 left-1/2 h-10 w-[90%] -translate-x-1/2 rounded-[50%] blur-xl"
        style={{ background: c(0.55) }}
      />

      {/* Frosted body */}
      <div
        aria-hidden
        className="absolute inset-0 backdrop-blur-sm"
        style={{ clipPath: OUTER_CLIP }}
      />

      {/* Frame, facets and glow */}
      <motion.svg
        viewBox={`0 0 ${W} ${H}`}
        className="absolute inset-0 h-full w-full overflow-visible"
        aria-hidden
        animate={{
          filter: engaged
            ? `drop-shadow(0 0 26px ${c(0.7)})`
            : `drop-shadow(0 0 12px ${c(0.35)})`,
        }}
        transition={{ duration: 0.6 }}
      >
        <defs>
          <linearGradient id={bodyId} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor={c(0.4)} />
            <stop offset="70%" stopColor="rgba(10, 10, 18, 0.72)" />
          </linearGradient>
        </defs>
        <polygon points={OUTER} fill={`url(#${bodyId})`} stroke={c(0.8)} strokeWidth={1.5} />
        <polygon points={INNER} fill="none" stroke={c(0.4)} strokeWidth={1} />
        {/* Facets: corners of the frame joined to the inner diamond and across the waist */}
        <g stroke={c(0.28)} strokeWidth={1} fill="none">
          <line x1={W / 2} y1={2} x2={W / 2} y2={18 * 1.4} />
          <line x1={W - 2} y1={waist} x2={W - 18} y2={waist} />
          <line x1={W / 2} y1={H - 2} x2={W / 2} y2={H - 18 * 1.4} />
          <line x1={2} y1={waist} x2={18} y2={waist} />
          <line x1={18} y1={waist} x2={W - 18} y2={waist} opacity={0.6} />
          <line x1={W / 2} y1={18 * 1.4} x2={W / 2} y2={H - 18 * 1.4} opacity={0.35} />
        </g>
      </motion.svg>

      {/* Core light */}
      <div className="absolute inset-0" style={{ clipPath: INNER_CLIP }}>
        <motion.div
          aria-hidden
          animate={{ opacity: engaged ? 1 : 0.5 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0"
          style={{
            background: `radial-gradient(70% 45% at 50% ${WAIST * 100 - 6}%, ${c(0.95)}, ${c(0.3)} 55%, transparent 85%)`,
          }}
        />
        <motion.div
          aria-hidden
          animate={{ opacity: engaged ? 0.5 : 0, rotate: engaged ? 360 : 0 }}
          transition={{
            opacity: { duration: 0.6 },
            rotate: { duration: 24, ease: "linear", repeat: Infinity },
          }}
          className="absolute left-1/2 size-[200%] -translate-x-1/2 -translate-y-1/2"
          style={{
            top: `${WAIST * 100 - 6}%`,
            background:
              "repeating-conic-gradient(from 0deg, rgba(255,255,255,0.22) 0deg 4deg, transparent 4deg 18deg)",
            maskImage: "radial-gradient(closest-side, #000, transparent 70%)",
            WebkitMaskImage: "radial-gradient(closest-side, #000, transparent 70%)",
          }}
        />
      </div>

      {/* Content */}
      <div className="absolute inset-x-0 top-[15%] flex flex-col items-center gap-5 text-center">
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
  );
}
