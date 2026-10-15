/**
 * Geometry and color math for the home gate ring.
 *
 * Angles are in degrees in "world" space: φ = 0 is the front of the ring (closest to the
 * viewer), φ = 180 is the back. Gate `i` sits at φ = θ + i·STEP, where θ is the ring
 * rotation.
 *
 * The ring lies flat on desktop ("horizontal": front at the bottom of the ellipse, φ = 90
 * screen-right) and stands up like a wheel on mobile ("vertical": a tall ellipse around the
 * gates; the front gate at screen center, φ = 90 at the bottom, φ = −90 at the top, the
 * front arc on the right and the far arc on the left).
 */

import { GATES, rgbString } from "@/lib/gates";

export const GATE_STEP_DEG = 360 / GATES.length;

export type RingOrientation = "horizontal" | "vertical";

/** Vertical squash of the flat ring — how far the viewer looks down onto it. */
export const RING_TILT = 0.3;
/** Width of the standing ring relative to its height. */
export const RING_TILT_VERTICAL = 0.55;
/** How far gates on the standing ring bow toward its far side as they leave the front. */
const VERTICAL_BOW = 0.08;

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

/**
 * Screen offset from the ring center for a gate on the ring of the given radius. On the
 * standing ring gates run up and down its middle, bowing slightly as they turn away.
 */
export function ringPoint(
  phi: number,
  radius: number,
  orientation: RingOrientation = "horizontal",
): { x: number; y: number } {
  if (orientation === "vertical") {
    return {
      x: (Math.cos(phi * DEG) - 1) * radius * VERTICAL_BOW,
      y: Math.sin(phi * DEG) * radius,
    };
  }
  return {
    x: Math.sin(phi * DEG) * radius,
    y: Math.cos(phi * DEG) * radius * RING_TILT,
  };
}

/** Horizontal offset of the ring's center from the stage center. */
export function ringCenterOffsetX(radius: number, orientation: RingOrientation): number {
  return orientation === "vertical" ? -radius * VERTICAL_BOW : 0;
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
 * angle φ = 180 − α on the flat ring and φ = α − 90 on the standing one, once the square
 * ring is squashed to its ellipse.
 */
export function ringConicGradient(
  theta: number,
  orientation: RingOrientation = "horizontal",
): string {
  const stops: string[] = [];
  for (let k = 0; k <= CONIC_SAMPLES; k++) {
    const alpha = (k * 360) / CONIC_SAMPLES;
    const phi = orientation === "vertical" ? alpha - 90 : 180 - alpha;
    stops.push(`${rgbString(ringColorAt(phi, theta))} ${alpha}deg`);
  }
  return `conic-gradient(from 0deg, ${stops.join(", ")})`;
}

/**
 * Ambient page background: each side of the screen glows with the ring color the viewer
 * sees on that side. Flat ring: front below, flanks left and right, far arc above.
 * Standing ring: front at the center, top and bottom arcs above and below.
 */
export function ambientBackground(
  theta: number,
  orientation: RingOrientation = "horizontal",
): string {
  if (orientation === "vertical") {
    const front = ringColorAt(0, theta);
    const top = ringColorAt(-90, theta);
    const bottom = ringColorAt(90, theta);
    const back = ringColorAt(180, theta);
    return [
      `radial-gradient(70% 40% at 50% 48%, ${rgbString(front, 0.5)}, transparent 75%)`,
      `radial-gradient(90% 35% at 50% 0%, ${rgbString(top, 0.4)}, transparent 75%)`,
      `radial-gradient(90% 35% at 50% 100%, ${rgbString(bottom, 0.4)}, transparent 75%)`,
      `radial-gradient(40% 60% at 0% 50%, ${rgbString(back, 0.18)}, transparent 75%)`,
      "#06060b",
    ].join(", ");
  }
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
export function ringFloorGradient(
  theta: number,
  orientation: RingOrientation = "horizontal",
): string {
  const front = ringColorAt(0, theta);
  const at = orientation === "vertical" ? "62% 50%" : "50% 62%";
  return `radial-gradient(closest-side at ${at}, ${rgbString(front, 0.28)}, transparent 85%)`;
}
