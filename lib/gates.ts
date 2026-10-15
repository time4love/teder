/**
 * The three gates of the home portal, in ring order. Each gate owns one hue that tints
 * the ring segment, the gate frame and the ambient background when it comes into focus.
 */

export type GateId = "justice" | "revelations" | "medicine";

export interface Gate {
  id: GateId;
  title: string;
  tagline: string;
  href: string;
  /** Base hue as `[r, g, b]` — interpolated around the ring, so it must stay numeric. */
  rgb: readonly [number, number, number];
}

export const GATES: readonly Gate[] = [
  {
    id: "justice",
    title: "דיני צדק",
    tagline: "צדק לעם - תיק הקורונה",
    href: "/justice",
    rgb: [233, 178, 76],
  },
  {
    id: "revelations",
    title: "חשיפות אמת",
    tagline: "ארכיון דוקומנטרי של עדויות וחשיפות",
    href: "/revelations",
    rgb: [124, 108, 255],
  },
  {
    id: "medicine",
    title: "רפואת אמת",
    tagline: "ריפוי, מידע ובריאות שלמה",
    href: "/medicine",
    rgb: [46, 196, 160],
  },
] as const;

/** The protocol is a video in the "הונאת האנושות הגדולה" playlist (episode 4). */
export const FREEDOM_PROTOCOL_HREF =
  "/video/5dcf523a-2d3c-4c00-ab7b-608085fa9ea7?playlist=5777d90b-4a32-4f34-9001-453a7b89266e" as const;
export const FREEDOM_PROTOCOL_TITLE = "פרוטוקול יציאה לחופשי" as const;

/** CSS `rgb()` / `rgba()` string for a gate color. */
export function rgbString(
  rgb: readonly [number, number, number],
  alpha = 1,
): string {
  const [r, g, b] = rgb.map((c) => Math.round(c));
  return alpha >= 1 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
