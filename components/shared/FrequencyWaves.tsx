"use client";

import type { ReactElement } from "react";
import { useEffect, useRef } from "react";
import type { MotionValue } from "framer-motion";

import { rgbString } from "@/lib/gates";

type Rgb = readonly [number, number, number];

/** Strand colors across the screen: left edge, center, right edge. */
export interface WavePalette {
  left: Rgb;
  front: Rgb;
  right: Rgb;
}

export interface Ribbon {
  /** Vertical center as a fraction of the canvas height. */
  y: number;
  /** Peak amplitude as a fraction of the canvas height. */
  amp: number;
  /** Wave cycles across the width (primary and secondary component). */
  freq: number;
  freq2: number;
  /** Phase speed in radians per second; sign sets the direction of flow. */
  speed: number;
  /** Phase spread across the strands — how far the ribbon fans open. */
  twist: number;
  strands: number;
  alpha: number;
}

/**
 * Default: two ribbons of fine strands along the bottom of the screen, like the frequency
 * waves behind the words in the logo.
 */
export const BOTTOM_RIBBONS: readonly Ribbon[] = [
  { y: 0.86, amp: 0.1, freq: 1.15, freq2: 2.6, speed: 0.45, twist: 1.7, strands: 42, alpha: 0.2 },
  { y: 0.83, amp: 0.07, freq: 0.8, freq2: 3.4, speed: -0.32, twist: 2.4, strands: 30, alpha: 0.13 },
];

/** Horizontal sampling step in CSS px. */
const STEP = 6;

export interface FrequencyWavesProps {
  /** Read every frame — lets the strands follow live colors (e.g. the gate ring). */
  colors: () => WavePalette;
  /** Pointer position across the stage, -1…1 — the waves lean toward it. */
  pointerX?: MotionValue<number>;
  /** Something is engaged — the waves gather energy. */
  energized: boolean;
  /** Draw a single still frame instead of animating. */
  still: boolean;
  ribbons?: readonly Ribbon[];
  /** Change this value to send a surge through the waves. */
  pulseKey?: number;
}

/**
 * Full-screen canvas of flowing frequency ribbons: many thin phase-shifted strands that
 * fan open and close, tinted left-to-right by the given palette.
 */
export function FrequencyWaves({
  colors,
  pointerX,
  energized,
  still,
  ribbons = BOTTOM_RIBBONS,
  pulseKey,
}: FrequencyWavesProps): ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const energizedRef = useRef(energized);
  energizedRef.current = energized;
  const colorsRef = useRef(colors);
  colorsRef.current = colors;
  /** Surge level, kicked to 1 by a pulse and decaying back to 0. */
  const surgeRef = useRef(0);

  useEffect(() => {
    if (pulseKey !== undefined && pulseKey > 0) surgeRef.current = 1;
  }, [pulseKey]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas === null || ctx === null || ctx === undefined) return;

    let width = 0;
    let height = 0;
    const resize = (): void => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let energy = energizedRef.current ? 1 : 0;
    let time = 0;
    let last = performance.now();
    let raf = 0;

    const draw = (now: number): void => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      // Ease toward the engaged state so the waves swell and settle smoothly.
      energy += ((energizedRef.current ? 1 : 0) - energy) * Math.min(dt * 2.5, 1);
      surgeRef.current = Math.max(0, surgeRef.current - dt * 0.9);
      const surge = surgeRef.current * surgeRef.current;
      time += dt * (1 + energy * 0.6 + surge * 2.5);

      const lean = pointerX?.get() ?? 0;
      const { left, front, right } = colorsRef.current();

      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = "lighter";
      ctx.lineWidth = 1;

      for (const r of ribbons) {
        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, rgbString(left, 0));
        gradient.addColorStop(0.18, rgbString(left, r.alpha));
        gradient.addColorStop(0.5, rgbString(front, r.alpha * 1.2));
        gradient.addColorStop(0.82, rgbString(right, r.alpha));
        gradient.addColorStop(1, rgbString(right, 0));
        ctx.strokeStyle = gradient;

        const cy = height * r.y;
        const amp = height * r.amp * (1 + energy * 0.35 + surge * 0.9);
        const phase = time * r.speed;

        for (let i = 0; i < r.strands; i++) {
          const u = i / (r.strands - 1);
          const spread = 0.55 + 0.45 * Math.sin(u * Math.PI);
          ctx.beginPath();
          for (let x = 0; x <= width + STEP; x += STEP) {
            const nx = x / width;
            // Taper toward the edges; the ribbon leans a little toward the pointer.
            const env = Math.pow(Math.sin(Math.PI * nx), 1.2) * (1 + lean * (nx - 0.5) * 0.5);
            const a = nx * r.freq * Math.PI * 2 + phase + u * r.twist;
            const b = nx * r.freq2 * Math.PI * 2 - phase * 0.7 + u * 1.3;
            const y = cy + amp * env * (Math.sin(a) * spread + 0.3 * Math.sin(b));
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      }

      if (!still) raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [pointerX, ribbons, still]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full"
    />
  );
}
