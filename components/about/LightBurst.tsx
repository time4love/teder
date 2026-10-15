"use client";

import type { ReactElement } from "react";
import { motion } from "framer-motion";

interface Spark {
  /** Where the initial burst throws it, relative to the touch. */
  bx: number;
  by: number;
  /** How far it then rises, and how much it sways on the way. */
  rise: number;
  drift: number;
  size: number;
  duration: number;
  /** Warm gold or white, matching the motes already rising on the page. */
  color: string;
}

export interface Burst {
  id: number;
  x: number;
  y: number;
  sparks: Spark[];
}

const SPARKS_PER_BURST = 22;

/** How long a burst lives before it is removed (its slowest spark has faded by then). */
export const BURST_MS = 5200;

export function makeBurst(id: number, x: number, y: number): Burst {
  const sparks = Array.from({ length: SPARKS_PER_BURST }, () => {
    const angle = Math.random() * Math.PI * 2;
    const reach = 24 + Math.random() * 70;
    return {
      bx: Math.cos(angle) * reach,
      by: Math.sin(angle) * reach * 0.7,
      rise: 260 + Math.random() * 380,
      drift: (Math.random() - 0.5) * 80,
      size: 3 + Math.random() * 5,
      duration: 3.2 + Math.random() * 1.8,
      color: Math.random() < 0.55 ? "255,214,140" : "255,250,235",
    };
  });
  return { id, x, y, sparks };
}

/**
 * Points of bright light released from a touch: they burst out around it, then rise slowly
 * and fade, joining the motes of light already drifting up the page.
 */
export function LightBursts({ bursts }: { bursts: Burst[] }): ReactElement {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[90]">
      {bursts.map((b) => (
        <div key={b.id} className="absolute" style={{ left: b.x, top: b.y }}>
          {/* Soft glow where the light was released */}
          <motion.span
            className="absolute size-28 rounded-full"
            style={{
              x: "-50%",
              y: "-50%",
              background:
                "radial-gradient(closest-side, rgba(255,250,235,0.85), rgba(255,214,140,0.35) 45%, transparent)",
            }}
            initial={{ scale: 0.2, opacity: 0 }}
            animate={{ scale: [0.2, 1.2, 1.6], opacity: [0, 1, 0] }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          />
          {b.sparks.map((s, i) => (
            <motion.span
              key={i}
              className="absolute rounded-full"
              style={{
                width: s.size,
                height: s.size,
                marginLeft: -s.size / 2,
                marginTop: -s.size / 2,
                background: `rgb(${s.color})`,
                boxShadow: `0 0 ${s.size * 2.5}px rgba(${s.color},0.95), 0 0 ${s.size * 6}px rgba(${s.color},0.45)`,
              }}
              initial={{ x: 0, y: 0, opacity: 0, scale: 0.3 }}
              animate={{
                x: [0, s.bx, s.bx + s.drift * 0.5, s.bx + s.drift],
                y: [0, s.by, s.by - s.rise * 0.45, s.by - s.rise],
                opacity: [0, 1, 0.85, 0],
                scale: [0.3, 1.5, 1, 0.7],
              }}
              transition={{
                duration: s.duration,
                times: [0, 0.08, 0.55, 1],
                ease: ["easeOut", "easeInOut", "easeIn"],
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
