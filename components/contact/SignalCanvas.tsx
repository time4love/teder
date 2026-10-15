"use client";

import type { ReactElement } from "react";
import { useEffect, useRef } from "react";
import type { MotionValue } from "framer-motion";

import { rgbString } from "@/lib/gates";
import { signalRgb, tuningAt } from "@/lib/tuner";

const STRANDS = 34;
/** Horizontal sampling step in CSS px. */
const STEP = 5;

/** Per-strand chaos: each strand wanders on its own mix of frequencies while untuned. */
interface StrandNoise {
  f1: number;
  f2: number;
  f3: number;
  p1: number;
  p2: number;
  p3: number;
  speed: number;
}

function makeNoise(): StrandNoise[] {
  return Array.from({ length: STRANDS }, () => ({
    f1: 2 + Math.random() * 6,
    f2: 7 + Math.random() * 14,
    f3: 18 + Math.random() * 30,
    p1: Math.random() * Math.PI * 2,
    p2: Math.random() * Math.PI * 2,
    p3: Math.random() * Math.PI * 2,
    speed: 0.6 + Math.random() * 1.6,
  }));
}

export interface SignalCanvasProps {
  /** Needle position 0…1; read every frame. */
  tune: MotionValue<number>;
  /** Vertical center of the signal, as a fraction of the canvas height. */
  centerY: number;
  still: boolean;
}

/**
 * The broadcast as seen on an oscilloscope: between stations a tangle of jittering grey
 * strands; as the needle nears a station they calm, gather and take its color, until locked
 * in they become one clean glowing sine wave that beats.
 */
export function SignalCanvas({ tune, centerY, still }: SignalCanvasProps): ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas === null || ctx === null || ctx === undefined) return;

    const noise = makeNoise();
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

    let time = 0;
    let last = performance.now();
    let raf = 0;

    const draw = (now: number): void => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      time += dt;

      const tuning = tuningAt(tune.get());
      const c = tuning.clarity;
      const chaos = 1 - c;
      const rgb = signalRgb(tuning);
      // Locked in: the wave beats like a carrier signal.
      const beat = tuning.locked ? 1 + 0.1 * Math.sin(time * 5.5) : 1;

      const cy = height * centerY;
      const amp = Math.min(height * 0.07, width * 0.13, 72) * beat;
      // Each station has its own carrier frequency on screen.
      const carrier = 1.4 + tuning.station.at * 2.2;

      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = "lighter";

      for (let i = 0; i < STRANDS; i++) {
        const n = noise[i];
        const u = i / (STRANDS - 1) - 0.5;
        // Untuned strands scatter; tuned ones gather into a tight glowing band.
        const spread = u * (chaos * 1.4 + 0.12);
        ctx.strokeStyle = rgbString(rgb, 0.1 + c * 0.22);
        ctx.lineWidth = 1 + c * 0.6;
        ctx.beginPath();
        for (let x = 0; x <= width + STEP; x += STEP) {
          const nx = x / width;
          const env = Math.pow(Math.sin(Math.PI * nx), 0.8);
          const clean = Math.sin(nx * carrier * Math.PI * 2 - time * 2.2 + u * 0.6);
          const tangled =
            0.55 * Math.sin(nx * n.f1 + time * n.speed + n.p1) +
            0.3 * Math.sin(nx * n.f2 - time * n.speed * 1.7 + n.p2) +
            0.25 * Math.sin(nx * n.f3 + time * n.speed * 3.1 + n.p3) +
            (Math.random() - 0.5) * 0.5 * chaos;
          const y = cy + amp * env * (c * clean + chaos * tangled + spread);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      if (!still) raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    // A still frame still has to follow the needle.
    const unsubscribe = still ? tune.on("change", () => requestAnimationFrame(draw)) : undefined;
    return () => {
      cancelAnimationFrame(raf);
      unsubscribe?.();
      ro.disconnect();
    };
  }, [tune, centerY, still]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full"
    />
  );
}
