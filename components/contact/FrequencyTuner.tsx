"use client";

import type { KeyboardEvent, PointerEvent, ReactElement, WheelEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import type { AnimationPlaybackControls } from "framer-motion";
import { ArrowLeft, Volume2, VolumeX } from "lucide-react";

import { SignalCanvas } from "@/components/contact/SignalCanvas";
import { TunerSound } from "@/components/contact/tunerSound";
import { rgbString } from "@/lib/gates";
import {
  FREQ_MAX,
  FREQ_MIN,
  SNAP_RANGE,
  STATIONS,
  frequencyAt,
  nearestStation,
  signalRgb,
  tuningAt,
} from "@/lib/tuner";
import type { Station, StationId } from "@/lib/tuner";

/** Dial geometry in SVG units: an arc around a pivot at the bottom center. */
const VB_W = 600;
const VB_H = 330;
const PIVOT_X = 300;
const PIVOT_Y = 305;
const RADIUS = 255;
/** The arc spans ±SWEEP degrees from vertical. */
const SWEEP = 68;

/** Inner end of the needle — it spans the outer band of the dial only. */
const NEEDLE_INNER = 150;

/** Where the needle settles after the opening sweep: between stations, in the static. */
const START_TUNE = 0.35;
/** Fraction of the dial's width a drag must cover to sweep the whole scale. */
const DRAG_SPAN = 0.85;
const WHEEL_TUNE_PER_PX = 0.0005;
const WHEEL_SETTLE_MS = 220;
const KEY_STEP = 0.01;
/** Length of the dove's flight before the channel opens. */
const FLIGHT_MS = 1100;

const DEG = Math.PI / 180;

function angleAt(t: number): number {
  return -SWEEP + 2 * SWEEP * t;
}

function arcPoint(t: number, r: number): { x: number; y: number } {
  const a = angleAt(t) * DEG;
  return { x: PIVOT_X + r * Math.sin(a), y: PIVOT_Y - r * Math.cos(a) };
}

function arcPath(r: number): string {
  const a = arcPoint(0, r);
  const b = arcPoint(1, r);
  return `M ${a.x} ${a.y} A ${r} ${r} 0 0 1 ${b.x} ${b.y}`;
}

const TICKS = Array.from({ length: 81 }, (_, k) => k / 80);


const STATIC_TEXTURE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.1' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

function openChannel(station: Station): void {
  if (!station.external) {
    window.location.href = station.href;
    return;
  }
  const tab = window.open(station.href, "_blank");
  if (tab === null) {
    // Blocked (e.g. Safari after the flight's delay): go there in this tab instead.
    window.location.href = station.href;
  } else {
    tab.opener = null;
  }
}

/**
 * Contact page as a radio: a dial in Hz with three stations (email, WhatsApp, Telegram). Between
 * stations the screen is static; as the needle nears one the noise clears into its clean,
 * colored wave, and once locked in the dove carries the visitor's call to that channel.
 */
export function FrequencyTuner(): ReactElement {
  const reduceMotion = useReducedMotion() === true;
  const tune = useMotionValue(reduceMotion ? START_TUNE : 0.02);

  const [lockedId, setLockedId] = useState<StationId | null>(null);
  const [nearId, setNearId] = useState<StationId>(nearestStation(START_TUNE).id);
  const [touched, setTouched] = useState(false);
  const [flight, setFlight] = useState<Station | null>(null);
  const [soundOn, setSoundOn] = useState(false);

  const dialRef = useRef<HTMLDivElement>(null);
  const tuneAnimRef = useRef<AnimationPlaybackControls | null>(null);
  const dragRef = useRef<{ pointerId: number; startX: number; startTune: number } | null>(
    null,
  );
  const wheelTimerRef = useRef<number | null>(null);
  const soundRef = useRef<TunerSound | null>(null);

  const lockedStation = STATIONS.find((s) => s.id === lockedId) ?? null;

  // Derived looks, recomputed straight from the needle without re-rendering.
  const signalColor = useTransform(tune, (t) => rgbString(signalRgb(tuningAt(t))));
  const backdrop = useTransform(tune, (t) => {
    const tuning = tuningAt(t);
    const rgb = tuning.station.rgb;
    return `radial-gradient(70% 55% at 50% 42%, ${rgbString(rgb, 0.38 * tuning.clarity)}, transparent 75%), #05050a`;
  });
  const staticOpacity = useTransform(tune, (t) => 0.06 + (1 - tuningAt(t).clarity) * 0.22);
  // The needle is drawn from its endpoint rather than rotated: SVG transform origins are
  // unreliable across browsers and motion libraries.
  const needleX = useTransform(tune, (t) => arcPoint(t, RADIUS + 14).x);
  const needleY = useTransform(tune, (t) => arcPoint(t, RADIUS + 14).y);
  // Only the outer part of the needle is drawn, leaving the dial's center to the readout.
  const needleBaseX = useTransform(tune, (t) => arcPoint(t, NEEDLE_INNER).x);
  const needleBaseY = useTransform(tune, (t) => arcPoint(t, NEEDLE_INNER).y);
  const glowOpacity = useTransform(tune, (t) => tuningAt(t).clarity);
  const readout = useTransform(tune, (t) => frequencyAt(t).toFixed(0));

  useMotionValueEvent(tune, "change", (t) => {
    const tuning = tuningAt(t);
    const locked = tuning.locked ? tuning.station.id : null;
    setLockedId((prev) => (prev === locked ? prev : locked));
    setNearId((prev) => (prev === tuning.station.id ? prev : tuning.station.id));
    soundRef.current?.update(tuning.clarity, tuning.station.hz);
  });

  const tuneTo = useCallback(
    (target: number, kind: "snap" | "sweep" = "snap"): void => {
      tuneAnimRef.current?.stop();
      tuneAnimRef.current = animate(
        tune,
        target,
        kind === "snap"
          ? { type: "spring", stiffness: 140, damping: 20 }
          : { duration: 1.6, ease: [0.22, 1, 0.36, 1] },
      );
    },
    [tune],
  );

  /** Released near a station: let it pull the needle in. */
  const settle = useCallback((): void => {
    const t = tune.get();
    const station = nearestStation(t);
    if (Math.abs(station.at - t) <= SNAP_RANGE) tuneTo(station.at);
  }, [tune, tuneTo]);

  const setTune = (t: number): void => {
    tuneAnimRef.current?.stop();
    tune.set(Math.min(1, Math.max(0, t)));
    setTouched(true);
  };

  // Opening sweep across the dial, so it's clear the needle moves.
  useEffect(() => {
    if (reduceMotion) return;
    tuneTo(START_TUNE, "sweep");
  }, [reduceMotion, tuneTo]);

  useEffect(
    () => () => {
      if (wheelTimerRef.current !== null) window.clearTimeout(wheelTimerRef.current);
      soundRef.current?.close();
    },
    [],
  );

  const toggleSound = (): void => {
    if (soundRef.current !== null) {
      soundRef.current.close();
      soundRef.current = null;
      setSoundOn(false);
      return;
    }
    const sound = new TunerSound();
    const tuning = tuningAt(tune.get());
    sound.update(tuning.clarity, tuning.station.hz);
    soundRef.current = sound;
    setSoundOn(true);
  };

  const transmit = (station: Station): void => {
    if (flight !== null) return;
    if (reduceMotion) {
      openChannel(station);
      return;
    }
    setFlight(station);
    window.setTimeout(() => {
      openChannel(station);
      setFlight(null);
    }, FLIGHT_MS);
  };

  // --- Dial input ---------------------------------------------------------------------

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>): void => {
    if (!e.isPrimary || (e.target as Element).closest("[data-station]") !== null) return;
    dragRef.current = { pointerId: e.pointerId, startX: e.clientX, startTune: tune.get() };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>): void => {
    const drag = dragRef.current;
    const dial = dialRef.current;
    if (drag === null || dial === null || drag.pointerId !== e.pointerId) return;
    const span = dial.clientWidth * DRAG_SPAN;
    setTune(drag.startTune + (e.clientX - drag.startX) / span);
  };

  const handlePointerUp = (e: PointerEvent<HTMLDivElement>): void => {
    const drag = dragRef.current;
    if (drag === null || drag.pointerId !== e.pointerId) return;
    dragRef.current = null;
    settle();
  };

  const handleWheel = (e: WheelEvent<HTMLDivElement>): void => {
    setTune(tune.get() + (e.deltaY + e.deltaX) * WHEEL_TUNE_PER_PX);
    if (wheelTimerRef.current !== null) window.clearTimeout(wheelTimerRef.current);
    wheelTimerRef.current = window.setTimeout(() => {
      wheelTimerRef.current = null;
      settle();
    }, WHEEL_SETTLE_MS);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
    const t = tune.get();
    if (e.key === "ArrowRight" || e.key === "ArrowUp") setTune(t + KEY_STEP);
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") setTune(t - KEY_STEP);
    else if (e.key === "Home") setTune(0);
    else if (e.key === "End") setTune(1);
    else if (e.key === "Enter" && lockedStation !== null) transmit(lockedStation);
    else return;
    e.preventDefault();
  };

  const nearStation = STATIONS.find((s) => s.id === nearId) ?? STATIONS[0];

  return (
    <div
      onWheel={handleWheel}
      className="relative isolate flex h-[calc(100dvh-4rem)] min-h-[600px] w-full flex-col items-center overflow-clip px-4 text-white"
    >
      {/* Sky tinted by the station coming through */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-20"
        style={{ background: backdrop }}
      />
      {/* Static */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 mix-blend-screen motion-safe:animate-[static-shift_0.5s_steps(5)_infinite]"
        style={{ backgroundImage: STATIC_TEXTURE, opacity: staticOpacity }}
      />

      <SignalCanvas tune={tune} centerY={0.31} still={reduceMotion} />

      {/* Heading */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="mt-[5vh] flex flex-col items-center gap-3 text-center"
      >
        <h1 className="font-heading text-5xl font-bold tracking-tight md:text-6xl">
          כוונו לתדר
        </h1>
      </motion.div>

      <div className="flex-1" />

      {/* Call to action once a station is locked in */}
      <div className="flex min-h-[112px] flex-col items-center justify-end gap-3">
        <AnimatePresence mode="wait">
          {lockedStation !== null ? (
            <motion.div
              key={lockedStation.id}
              initial={{ opacity: 0, y: 14, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
              className="flex flex-col items-center gap-3 text-center"
            >
              <p className="text-sm text-white/70">{lockedStation.blurb}</p>
              <button
                type="button"
                onClick={() => transmit(lockedStation)}
                className="group inline-flex items-center gap-3 rounded-full px-7 py-3 text-base font-semibold text-[#05050a] transition hover:brightness-110"
                style={{
                  background: rgbString(lockedStation.rgb),
                  boxShadow: `0 0 40px ${rgbString(lockedStation.rgb, 0.6)}`,
                }}
              >
                {lockedStation.cta}
                <ArrowLeft
                  className="size-5 transition-transform group-hover:-translate-x-1"
                  aria-hidden
                />
              </button>
            </motion.div>
          ) : (
            <motion.p
              key="hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-sm text-white/55"
            >
              {touched ? "עוד קצת…" : "גללו, גררו את החוגה או הקישו על תחנה"}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Dial */}
      <div
        ref={dialRef}
        role="slider"
        tabIndex={0}
        aria-label="חוגת תדר"
        aria-valuemin={FREQ_MIN}
        aria-valuemax={FREQ_MAX}
        aria-valuenow={Math.round(frequencyAt(tune.get()))}
        aria-valuetext={lockedStation !== null ? lockedStation.name : "רעש"}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
        className="relative mt-2 w-full max-w-[680px] cursor-grab touch-none select-none rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 active:cursor-grabbing"
      >
        <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="block w-full" direction="ltr">
          <defs>
            <filter id="dial-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="5" />
            </filter>
          </defs>

          {/* Track and its glow in the incoming station's color */}
          <path d={arcPath(RADIUS)} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth={2} />
          <motion.path
            d={arcPath(RADIUS)}
            fill="none"
            strokeWidth={6}
            filter="url(#dial-glow)"
            style={{ stroke: signalColor, opacity: glowOpacity }}
          />

          {/* Scale */}
          {TICKS.map((t) => {
            const a = arcPoint(t, RADIUS - 4);
            const b = arcPoint(t, RADIUS - 12);
            return (
              <line
                key={t}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="rgba(255,255,255,0.28)"
                strokeWidth={1}
              />
            );
          })}
          {/* Each station's frequency: a major mark and its number */}
          {STATIONS.map(({ hz, at }) => {
            const a = arcPoint(at, RADIUS - 4);
            const b = arcPoint(at, RADIUS - 22);
            return (
              <line
                key={`major-${hz}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="rgba(255,255,255,0.65)"
                strokeWidth={2}
              />
            );
          })}
          {STATIONS.map(({ hz: f, at }) => {
            const p = arcPoint(at, RADIUS - 42);
            return (
              <text
                key={f}
                x={p.x}
                y={p.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="rgba(255,255,255,0.45)"
                fontFamily="ui-monospace, monospace"
                // CSS sizes here are in dial units: larger on phones, where the dial shrinks.
                className="text-[22px] md:text-[15px]"
              >
                {f}
              </text>
            );
          })}

          {/* Stations */}
          {STATIONS.map((s) => {
            const dot = arcPoint(s.at, RADIUS);
            const label = arcPoint(s.at, RADIUS + 30);
            const isLocked = s.id === lockedId;
            return (
              <g
                key={s.id}
                data-station={s.id}
                role="button"
                aria-label={`כוונו ל${s.name}`}
                onClick={() => {
                  setTouched(true);
                  tuneTo(s.at);
                }}
                className="cursor-pointer"
              >
                <circle cx={label.x} cy={label.y} r={30} fill="transparent" />
                <circle
                  cx={dot.x}
                  cy={dot.y}
                  r={isLocked ? 8 : 5.5}
                  fill={rgbString(s.rgb)}
                  style={{ filter: `drop-shadow(0 0 ${isLocked ? 10 : 5}px ${rgbString(s.rgb)})` }}
                />
                <text
                  x={label.x}
                  y={label.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={rgbString(s.rgb, isLocked ? 1 : 0.75)}
                  fontWeight={700}
                  direction="rtl"
                  className={isLocked ? "text-[31px] md:text-[21px]" : "text-[27px] md:text-[18px]"}
                >
                  {s.name}
                </text>
              </g>
            );
          })}

          {/* Needle */}
          <motion.line
            x1={needleBaseX}
            y1={needleBaseY}
            x2={needleX}
            y2={needleY}
            stroke="white"
            strokeWidth={3}
            strokeLinecap="round"
            style={{ filter: "drop-shadow(0 0 6px rgba(255,255,255,0.9))" }}
          />
          <motion.circle cx={needleX} cy={needleY} r={5} style={{ fill: signalColor }} />
        </svg>

        {/* Readout inside the arc */}
        <div className="pointer-events-none absolute inset-x-0 bottom-[8%] flex flex-col items-center" dir="ltr">
          <div className="flex items-baseline gap-2 font-mono">
            <motion.span
              className="text-4xl font-bold tabular-nums tracking-wider md:text-5xl"
              style={{ color: signalColor, textShadow: "0 0 18px currentColor" }}
            >
              {readout}
            </motion.span>
            <span className="text-sm text-white/50">Hz</span>
          </div>
          <span
            dir="rtl"
            className="mt-1 text-xs tracking-[0.3em] text-white/50 transition-opacity"
            style={{ opacity: lockedStation !== null ? 1 : 0.6 }}
          >
            {lockedStation !== null ? `● ${lockedStation.name}` : `מתקרבים: ${nearStation.name}`}
          </span>
        </div>
      </div>

      {/* Footer: direct links, sound */}
      <div className="mb-6 mt-4 flex w-full max-w-[680px] flex-col items-center gap-3 text-center">
        <nav aria-label="ערוצי קשר ישירים" className="flex flex-wrap items-center justify-center gap-2">
          {STATIONS.map((s) => (
            <a
              key={s.id}
              href={s.href}
              {...(s.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/60 transition hover:border-white/40 hover:text-white"
            >
              {s.name}
            </a>
          ))}
          <button
            type="button"
            onClick={toggleSound}
            aria-pressed={soundOn}
            aria-label={soundOn ? "השתקת צליל החוגה" : "הפעלת צליל החוגה"}
            className="inline-flex size-7 items-center justify-center rounded-full border border-white/15 text-white/60 transition hover:border-white/40 hover:text-white"
          >
            {soundOn ? <Volume2 className="size-3.5" /> : <VolumeX className="size-3.5" />}
          </button>
        </nav>
      </div>

      {/* The dove carries the call to the channel */}
      <AnimatePresence>
        {flight !== null ? (
          <motion.div
            key={flight.id}
            aria-hidden
            className="pointer-events-none fixed inset-0 z-[80] flex items-end justify-center"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Beam rising from the dial */}
            <motion.div
              className="absolute bottom-[22%] left-1/2 w-1 -translate-x-1/2 rounded-full"
              style={{
                background: `linear-gradient(to top, ${rgbString(flight.rgb, 0)}, ${rgbString(flight.rgb, 0.9)}, ${rgbString(flight.rgb, 0)})`,
                boxShadow: `0 0 24px ${rgbString(flight.rgb, 0.8)}`,
              }}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "80vh", opacity: [0, 1, 0] }}
              transition={{ duration: FLIGHT_MS / 1000, ease: "easeOut" }}
            />
            <motion.div
              className="absolute bottom-[20%] w-[min(260px,55vw)]"
              initial={{ y: 0, scale: 0.35, opacity: 0 }}
              animate={{ y: "-70vh", scale: [0.35, 1, 0.55], opacity: [0, 1, 1, 0] }}
              transition={{ duration: FLIGHT_MS / 1000, ease: [0.45, 0, 0.2, 1] }}
            >
              <Image
                src="/dove.png"
                alt=""
                width={1551}
                height={1008}
                className="h-auto w-full"
                style={{ filter: `drop-shadow(0 0 24px ${rgbString(flight.rgb, 0.9)})` }}
              />
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
