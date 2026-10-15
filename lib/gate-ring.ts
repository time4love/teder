/**
 * Geometry and color math for the home gate ring.
 *
 * Angles are in degrees in "world" space: φ = 0 is the front of the ring (closest to the
 * viewer, bottom of the ellipse on screen), φ = 90 is screen-right, φ = 180 is the back.
 * Gate `i` sits at φ = θ + i·STEP, where θ is the ring rotation.
 */

import { GATES, rgbString } from "@/lib/gates";

export const GATE_STEP_DEG = 360 / GATES.length;

/** Vertical squash of the ring ellipse — how far the viewer looks down onto it. */
export const RING_TILT = 0.3;

const DEG = Math.PI / 180;

type Rgb = readonly [number, number, number];

export function normalizeDeg(a: number): number {
  return ((a % 360) + 360) % 360;
}

/** Shortest signed distance of `a` from 0, in (-180, 180]. */
export function signedDeg(a: number): number {
  const n = normalizeDeg(a);
  return n > 180 ? n - 360 : n;
}

/** World angle of gate `index` for ring rotation `theta`. */
export function gateAngle(theta: number, index: number): number {
  return theta + index * GATE_STEP_DEG;
}

/** 0 at the back of the ring, 1 at the front. */
export function depthAt(phi: number): number {
  return (Math.cos(phi * DEG) + 1) / 2;
}

/** Screen offset from the ring center for a point on the ring of the given radius. */
export function ringPoint(phi: number, radius: number): { x: number; y: number } {
  return {
    x: Math.sin(phi * DEG) * radius,
    y: Math.cos(phi * DEG) * radius * RING_TILT,
  };
}

/** Index of the gate currently closest to the front. */
export function frontGateIndex(theta: number): number {
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < GATES.length; i++) {
    const d = Math.abs(signedDeg(gateAngle(theta, i)));
    if (d < bestDist) {
      best = i;
      bestDist = d;
    }
  }
  return best;
}

/** Ring rotation that brings gate `index` to the front by the shortest path from `theta`. */
export function thetaToFront(theta: number, index: number): number {
  return theta - signedDeg(gateAngle(theta, index));
}

/**
 * Ring color at world angle `phi`: each gate owns a plateau of its color, blending
 * smoothly into its neighbours halfway between them.
 */
export function ringColorAt(phi: number, theta: number): Rgb {
  const u = normalizeDeg(phi - theta) / GATE_STEP_DEG;
  const i = Math.floor(u) % GATES.length;
  const j = (i + 1) % GATES.length;
  const t = u - Math.floor(u);
  // Smoothstep twice: wide solid plateaus around each gate, short blends between them.
  let s = t * t * (3 - 2 * t);
  s = s * s * (3 - 2 * s);
  const a = GATES[i].rgb;
  const b = GATES[j].rgb;
  return [a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s, a[2] + (b[2] - a[2]) * s];
}

const CONIC_SAMPLES = 36;

/**
 * Conic gradient painting the ring. Conic angle α (clockwise from top) maps to world
 * angle φ = 180 − α once the square ring is squashed by {@link RING_TILT}.
 */
export function ringConicGradient(theta: number): string {
  const stops: string[] = [];
  for (let k = 0; k <= CONIC_SAMPLES; k++) {
    const alpha = (k * 360) / CONIC_SAMPLES;
    stops.push(`${rgbString(ringColorAt(180 - alpha, theta))} ${alpha}deg`);
  }
  return `conic-gradient(from 0deg, ${stops.join(", ")})`;
}

/**
 * Ambient page background: each side of the screen glows with the ring color the viewer
 * sees on that side — front below, left and right flanks, the far arc above.
 */
export function ambientBackground(theta: number): string {
  const front = ringColorAt(0, theta);
  const right = ringColorAt(90, theta);
  const left = ringColorAt(-90, theta);
  const back = ringColorAt(180, theta);
  return [
    `radial-gradient(60% 55% at 50% 100%, ${rgbString(front, 0.55)}, transparent 70%)`,
    `radial-gradient(45% 60% at 100% 55%, ${rgbString(right, 0.38)}, transparent 70%)`,
    `radial-gradient(45% 60% at 0% 55%, ${rgbString(left, 0.38)}, transparent 70%)`,
    `radial-gradient(55% 40% at 50% 0%, ${rgbString(back, 0.22)}, transparent 75%)`,
    "#06060b",
  ].join(", ");
}

/** Soft colored floor inside the ring, lit by the gate in front. */
export function ringFloorGradient(theta: number): string {
  const front = ringColorAt(0, theta);
  return `radial-gradient(closest-side at 50% 62%, ${rgbString(front, 0.28)}, transparent 85%)`;
}
