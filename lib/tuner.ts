/**
 * The contact page's radio dial: three stations (contact channels) on a 0…1 tuning scale,
 * and the math that turns the needle's position into how clearly a station comes through.
 */

export type StationId = "email" | "whatsapp" | "telegram";

export interface Station {
  id: StationId;
  /** The station's frequency in Hz — also the tone the dial plays on it. */
  hz: number;
  /** Position on the dial, 0…1. */
  at: number;
  name: string;
  /** Call to action once the station is locked in. */
  cta: string;
  /** One line describing the channel. */
  blurb: string;
  href: string;
  /** Opens in a new tab (external apps) rather than in place (mailto). */
  external: boolean;
  rgb: readonly [number, number, number];
}

/** The dial spans 345–711 Hz: centered on 528 so the stations, 111 Hz apart, sit evenly. */
export const FREQ_MIN = 345;
export const FREQ_MAX = 711;

export function frequencyAt(t: number): number {
  return FREQ_MIN + (FREQ_MAX - FREQ_MIN) * t;
}

function dialPosition(hz: number): number {
  return (hz - FREQ_MIN) / (FREQ_MAX - FREQ_MIN);
}

export const STATIONS: readonly Station[] = [
  {
    id: "email",
    hz: 417,
    at: dialPosition(417),
    name: "אימייל",
    cta: "שלחו לנו אימייל",
    blurb: "הודעה ישירה לתיבת הדואר שלנו.",
    href: `mailto:teder.yesharel@gmail.com?subject=${encodeURIComponent("פנייה מהאתר תדר-ישר-אל")}`,
    external: false,
    rgb: [240, 186, 84],
  },
  {
    id: "whatsapp",
    hz: 528,
    at: dialPosition(528),
    name: "וואטסאפ",
    cta: "התחברו בוואטסאפ",
    blurb: "הודעה מהירה ומאובטחת בקבוצת הוואטסאפ.",
    href: "https://chat.whatsapp.com/Iq8QddwEdkCGjSodHfaGLK?mode=gi_t",
    external: true,
    rgb: [37, 211, 102],
  },
  {
    id: "telegram",
    hz: 639,
    at: dialPosition(639),
    name: "טלגרם",
    cta: "התחברו בטלגרם",
    blurb: "עקבו אחרינו או שלחו הודעה בטלגרם.",
    href: "https://t.me/tederyesharel",
    external: true,
    rgb: [42, 171, 238],
  },
] as const;

/** Signal starts to come through within this distance of a station. */
const CAPTURE_RANGE = 0.12;
/** Within this distance the station is locked in. */
export const LOCK_RANGE = 0.006;
/** Releasing the needle this close to a station pulls it in. */
export const SNAP_RANGE = 0.06;

/** Grey of the static between stations. */
export const NOISE_RGB: readonly [number, number, number] = [150, 150, 170];

export interface Tuning {
  station: Station;
  /** Distance to the nearest station on the dial. */
  distance: number;
  /** 0 = pure static, 1 = clean signal. */
  clarity: number;
  locked: boolean;
}

export function nearestStation(t: number): Station {
  let best = STATIONS[0];
  for (const s of STATIONS) {
    if (Math.abs(s.at - t) < Math.abs(best.at - t)) best = s;
  }
  return best;
}

export function tuningAt(t: number): Tuning {
  const station = nearestStation(t);
  const distance = Math.abs(station.at - t);
  const raw = Math.max(0, 1 - distance / CAPTURE_RANGE);
  // Ease so the signal clears quickly at the end, like a station coming into focus.
  const clarity = raw * raw * (3 - 2 * raw);
  return { station, distance, clarity, locked: distance <= LOCK_RANGE };
}

/** Color of the signal: the station's color emerging from the grey static. */
export function signalRgb(tuning: Tuning): [number, number, number] {
  const c = tuning.clarity;
  const s = tuning.station.rgb;
  return [
    NOISE_RGB[0] + (s[0] - NOISE_RGB[0]) * c,
    NOISE_RGB[1] + (s[1] - NOISE_RGB[1]) * c,
    NOISE_RGB[2] + (s[2] - NOISE_RGB[2]) * c,
  ];
}
