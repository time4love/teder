"use client";

import type { ComponentType, ReactElement } from "react";
import { motion } from "framer-motion";

import type { GateId } from "@/lib/gates";

export interface GateIconProps {
  /** The gate is in focus — the symbol comes alive. */
  engaged: boolean;
  className?: string;
  /** Stroke weight multiplier — lighter lines when the symbol is drawn large. */
  weight?: number;
}

/** Shared stroke style for the hand-drawn gate symbols. */
const STROKE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

/** Stroke style scaled by a weight multiplier. */
function strokeStyle(
  w: number,
): Omit<typeof STROKE, "strokeWidth"> & { strokeWidth: number } {
  return { ...STROKE, strokeWidth: STROKE.strokeWidth * w };
}

/** Rotate leaves around the point where they meet the stem. */
const LEAF_PIVOT = { transformBox: "view-box", transformOrigin: "24px 25px" } as const;

/** Pollen motes drifting up from the sprout while the gate is engaged. */
const MOTES: readonly { cx: number; delay: number }[] = [
  { cx: 15, delay: 0 },
  { cx: 33, delay: 0.9 },
  { cx: 24, delay: 1.7 },
];

/**
 * רפואת אמת — a sprout rising from the earth, its two leaves forming a heart, roots
 * reaching down: healing that grows from nature. Leaves sway and pollen rises when engaged.
 */
function MedicineIcon({ engaged, className, weight = 1 }: GateIconProps): ReactElement {
  const w = weight;
  const st = strokeStyle(w);
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      {/* Earth */}
      <path {...st} d="M9 36.5 Q24 33 39 36.5" opacity={0.85} />
      {/* Roots */}
      <g {...st} strokeWidth={1.2 * w} opacity={0.6}>
        <path d="M24 35 C24 38.5 21.5 40.5 18 42" />
        <path d="M24 35 C24 38.5 26.5 40.5 30 42" />
        <path d="M24 35.5 V43" />
        <path d="M20.5 39.5 C19 40 17.5 39.8 16 39" />
        <path d="M27.5 39.5 C29 40 30.5 39.8 32 39" />
      </g>
      {/* Stem */}
      <path {...st} d="M24 35 C23.4 31.5 24.4 28.5 24 25" />

      {/* Left leaf — the left lobe of the heart */}
      <motion.g
        style={LEAF_PIVOT}
        animate={engaged ? { rotate: [0, -7, 0] } : { rotate: 0 }}
        transition={
          engaged
            ? { duration: 3.2, ease: "easeInOut", repeat: Infinity }
            : { duration: 0.6 }
        }
      >
        <path
          {...st}
          d="M24 25 C17.5 24.5 11 20 11 13.5 C11 9.5 14 7 17.5 7 C21 7 24 10 24 14"
        />
        <motion.path
          {...st}
          strokeWidth={1 * w}
          d="M23 23 C20 20.5 17.5 17 16.5 12.5"
          initial={false}
          animate={{ pathLength: engaged ? 1 : 0.55, opacity: engaged ? 0.8 : 0.5 }}
          transition={{ duration: 1.2 }}
        />
      </motion.g>

      {/* Right leaf — the right lobe of the heart */}
      <motion.g
        style={LEAF_PIVOT}
        animate={engaged ? { rotate: [0, 7, 0] } : { rotate: 0 }}
        transition={
          engaged
            ? { duration: 3.2, ease: "easeInOut", repeat: Infinity, delay: 0.4 }
            : { duration: 0.6 }
        }
      >
        <path
          {...st}
          d="M24 25 C30.5 24.5 37 20 37 13.5 C37 9.5 34 7 30.5 7 C27 7 24 10 24 14"
        />
        <motion.path
          {...st}
          strokeWidth={1 * w}
          d="M25 23 C28 20.5 30.5 17 31.5 12.5"
          initial={false}
          animate={{ pathLength: engaged ? 1 : 0.55, opacity: engaged ? 0.8 : 0.5 }}
          transition={{ duration: 1.2 }}
        />
      </motion.g>

      {/* Pollen */}
      {MOTES.map((m) => (
        <motion.circle
          key={m.cx}
          cx={m.cx}
          cy={30}
          r={0.9}
          fill="currentColor"
          initial={false}
          animate={
            engaged
              ? { cy: [30, 4], opacity: [0, 0.9, 0] }
              : { cy: 30, opacity: 0 }
          }
          transition={
            engaged
              ? { duration: 2.8, ease: "easeOut", repeat: Infinity, delay: m.delay }
              : { duration: 0.4 }
          }
        />
      ))}
    </svg>
  );
}

/** A ray of the light symbol, from `inner` to `outer` radius around the center. */
interface Ray {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

function ray(angleDeg: number, inner: number, outer: number): Ray {
  const a = (angleDeg * Math.PI) / 180;
  const round = (v: number): number => Math.round(v * 100) / 100;
  return {
    x1: round(24 + Math.sin(a) * inner),
    y1: round(24 - Math.cos(a) * inner),
    x2: round(24 + Math.sin(a) * outer),
    y2: round(24 - Math.cos(a) * outer),
  };
}

const LONG_RAYS: readonly Ray[] = Array.from({ length: 8 }, (_, i) => ray(i * 45, 11, 20.5));
const SHORT_RAYS: readonly Ray[] = Array.from({ length: 8 }, (_, i) =>
  ray(22.5 + i * 45, 11, 15.5),
);

const CENTER_PIVOT = { transformBox: "view-box", transformOrigin: "24px 24px" } as const;

/**
 * חשיפות אמת — a source of light radiating outward: what was hidden is brought to light.
 * While engaged the rays turn slowly and breathe, and the core brightens.
 */
function RevelationsIcon({ engaged, className, weight = 1 }: GateIconProps): ReactElement {
  const w = weight;
  const st = strokeStyle(w);
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <motion.g
        style={CENTER_PIVOT}
        animate={{ rotate: engaged ? 45 : 0 }}
        transition={
          engaged
            ? { duration: 12, ease: "linear", repeat: Infinity }
            : { duration: 0.8 }
        }
      >
        <motion.g
          {...st}
          style={CENTER_PIVOT}
          animate={engaged ? { scale: [1, 1.1, 1], opacity: 1 } : { scale: 1, opacity: 0.85 }}
          transition={
            engaged
              ? { duration: 2.4, ease: "easeInOut", repeat: Infinity }
              : { duration: 0.6 }
          }
        >
          {LONG_RAYS.map((r) => (
            <line key={`l${r.x2}-${r.y2}`} {...r} />
          ))}
        </motion.g>
        <motion.g
          {...st}
          strokeWidth={1.2 * w}
          style={CENTER_PIVOT}
          animate={engaged ? { scale: [1.1, 1, 1.1], opacity: 0.75 } : { scale: 1, opacity: 0.5 }}
          transition={
            engaged
              ? { duration: 2.4, ease: "easeInOut", repeat: Infinity }
              : { duration: 0.6 }
          }
        >
          {SHORT_RAYS.map((r) => (
            <line key={`s${r.x2}-${r.y2}`} {...r} />
          ))}
        </motion.g>
      </motion.g>

      {/* Halo */}
      <motion.circle
        {...st}
        strokeWidth={1 * w}
        cx={24}
        cy={24}
        r={8}
        initial={false}
        animate={{ opacity: engaged ? 0.7 : 0.4 }}
        transition={{ duration: 0.6 }}
      />
      {/* Core */}
      <motion.circle
        cx={24}
        cy={24}
        fill="currentColor"
        initial={false}
        animate={engaged ? { r: [4.2, 5.2, 4.2] } : { r: 4.2 }}
        transition={
          engaged
            ? { duration: 2.4, ease: "easeInOut", repeat: Infinity }
            : { duration: 0.6 }
        }
        style={{ filter: "drop-shadow(0 0 3px rgba(255,255,255,0.9))" }}
      />
    </svg>
  );
}

/** Beam tilt over one balancing cycle; the pans swing the opposite way to hang straight. */
const BEAM_TILT: number[] = [0, -4, 0, 3, 0];
const BALANCE_TRANSITION = { duration: 6, ease: "easeInOut", repeat: Infinity } as const;

const BEAM_PIVOT = { transformBox: "view-box", transformOrigin: "24px 14px" } as const;
const LEFT_PAN_PIVOT = { transformBox: "view-box", transformOrigin: "10px 14px" } as const;
const RIGHT_PAN_PIVOT = { transformBox: "view-box", transformOrigin: "38px 14px" } as const;

/** One hanging pan: two cords from the beam end and a shallow bowl. */
function Pan({ x, w }: { x: number; w: number }): ReactElement {
  const st = strokeStyle(w);
  return (
    <g {...st}>
      <path d={`M${x} 14 L${x - 5} 26 M${x} 14 L${x + 5} 26`} strokeWidth={1 * w} opacity={0.75} />
      <path d={`M${x - 6} 26 H${x + 6} Q${x} 32 ${x - 6} 26 Z`} />
    </g>
  );
}

/**
 * דיני צדק — balance scales. While engaged the beam weighs gently from side to side,
 * the pans keep hanging true, and the crown of the scales glows.
 */
function JusticeIcon({ engaged, className, weight = 1 }: GateIconProps): ReactElement {
  const w = weight;
  const st = strokeStyle(w);
  const balance = (sign: 1 | -1) =>
    engaged
      ? { rotate: BEAM_TILT.map((a) => a * sign) }
      : { rotate: 0 };
  const transition = engaged ? BALANCE_TRANSITION : { duration: 0.8 };

  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      {/* Pillar and base */}
      <path {...st} d="M24 14 V40" />
      <path {...st} d="M16 41.5 H32" />
      <path {...st} strokeWidth={1.2 * w} d="M19.5 41.5 Q24 37 28.5 41.5" opacity={0.7} />

      {/* Beam with hanging pans */}
      <motion.g style={BEAM_PIVOT} initial={false} animate={balance(1)} transition={transition}>
        <path {...st} d="M10 14 Q24 11.5 38 14" />
        <motion.g
          style={LEFT_PAN_PIVOT}
          initial={false}
          animate={balance(-1)}
          transition={transition}
        >
          <Pan x={10} w={w} />
        </motion.g>
        <motion.g
          style={RIGHT_PAN_PIVOT}
          initial={false}
          animate={balance(-1)}
          transition={transition}
        >
          <Pan x={38} w={w} />
        </motion.g>
      </motion.g>

      {/* Crown */}
      <motion.circle
        cx={24}
        cy={10}
        fill="currentColor"
        initial={false}
        animate={
          engaged
            ? { r: [1.7, 2.3, 1.7], opacity: [0.85, 1, 0.85] }
            : { r: 1.7, opacity: 0.85 }
        }
        transition={
          engaged
            ? { duration: 3, ease: "easeInOut", repeat: Infinity }
            : { duration: 0.6 }
        }
        style={{ filter: "drop-shadow(0 0 3px rgba(255,255,255,0.9))" }}
      />
    </svg>
  );
}

export const GATE_ICONS: Record<GateId, ComponentType<GateIconProps>> = {
  justice: JusticeIcon,
  revelations: RevelationsIcon,
  medicine: MedicineIcon,
};
