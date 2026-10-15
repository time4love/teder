"use client";

import type { KeyboardEvent, MouseEvent, PointerEvent, ReactElement, ReactNode } from "react";
import { Fragment, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";

import { BURST_MS, LightBursts, makeBurst } from "@/components/about/LightBurst";
import type { Burst } from "@/components/about/LightBurst";
import { BLAZE_FILTER } from "@/components/shared/blaze";
import { FrequencyWaves } from "@/components/shared/FrequencyWaves";
import type { Ribbon, WavePalette } from "@/components/shared/FrequencyWaves";

/** The logo's colors: blue field on the left, red on the right, violet where they meet. */
const LOGO_PALETTE: WavePalette = {
  left: [52, 92, 255],
  front: [178, 120, 255],
  right: [255, 64, 72],
};
const logoPalette = (): WavePalette => LOGO_PALETTE;

/** Wide ribbons crossing behind the dove's body, as behind the words in the logo. */
const ABOUT_RIBBONS: readonly Ribbon[] = [
  { y: 0.5, amp: 0.15, freq: 1.0, freq2: 2.4, speed: 0.4, twist: 1.9, strands: 48, alpha: 0.24 },
  { y: 0.48, amp: 0.1, freq: 0.75, freq2: 3.1, speed: -0.3, twist: 2.6, strands: 34, alpha: 0.15 },
];

/**
 * Motes of light rising from the waves, in two depths: small faint ones behind the dove and
 * larger, softer ones drifting in front of it. Values are fixed so server and client agree.
 */
const BACK_MOTES = Array.from({ length: 24 }, (_, i) => ({
  color: "255,255,255",
  left: (i * 37.3) % 100,
  bottom: 30,
  size: 2 + ((i * 7) % 3),
  blur: 0,
  peak: 0.85,
  rise: 420,
  drift: 0,
  duration: 7 + ((i * 13) % 6),
  delay: (i * 0.71) % 7,
}));
const FRONT_MOTES = Array.from({ length: 16 }, (_, i) => ({
  /** Warm gold so the near motes read against the white dove. */
  color: "255,214,140",
  left: 14 + ((i * 29.7) % 72),
  bottom: 18 + ((i * 17) % 34),
  size: 6 + ((i * 5) % 6),
  blur: 0.6 + ((i * 3) % 4) * 0.5,
  peak: 0.8 + ((i * 7) % 3) * 0.1,
  rise: 300 + ((i * 41) % 220),
  drift: ((i % 2 === 0 ? 1 : -1) * (10 + ((i * 11) % 20))),
  duration: 6 + ((i * 7) % 5),
  delay: (i * 0.93) % 6,
}));

type Mote = (typeof BACK_MOTES)[number];

/** The heading, word by word — each word lights up when touched. */
const HEADING_WORDS = ["להתחבר", "לתדר", "אמת"] as const;

/** How far each depth layer shifts with the pointer — nearer layers move more. */
const BACK_PARALLAX_PX = 8;
const FRONT_PARALLAX_PX = 34;

/**
 * About page scene: the dove from the logo, still, above flowing frequency waves in the
 * logo's blue and red. Motes of light rise behind and in front of it for depth; the near
 * ones shift more with the pointer. Touching the dove turns it into a silhouette of light
 * that floods the screen for a moment (with a ripple and a surge through the waves);
 * touching a word of the heading lights it up the same way and releases points of light
 * that rise to join the motes.
 */
export function DoveScene(): ReactElement {
  const reduceMotion = useReducedMotion() === true;
  const [pulse, setPulse] = useState(0);

  const pointerX = useSpring(0, { stiffness: 40, damping: 16 });
  const pointerY = useSpring(0, { stiffness: 40, damping: 16 });
  const backX = useTransform(pointerX, (v) => v * BACK_PARALLAX_PX);
  const backY = useTransform(pointerY, (v) => v * BACK_PARALLAX_PX * 0.5);
  const frontX = useTransform(pointerX, (v) => v * FRONT_PARALLAX_PX);
  const frontY = useTransform(pointerY, (v) => v * FRONT_PARALLAX_PX * 0.5);

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>): void => {
    const rect = e.currentTarget.getBoundingClientRect();
    pointerX.set(((e.clientX - rect.left) / rect.width) * 2 - 1);
    pointerY.set(((e.clientY - rect.top) / rect.height) * 2 - 1);
  };

  const [bursts, setBursts] = useState<Burst[]>([]);
  const burstIdRef = useRef(0);
  const burstTimersRef = useRef<number[]>([]);

  useEffect(
    () => () => burstTimersRef.current.forEach((t) => window.clearTimeout(t)),
    [],
  );

  /** The dove blazes into light: ripple, wave surge and the illumination all share `pulse`. */
  const illuminate = (): void => setPulse((p) => p + 1);

  const releaseLightAt = (x: number, y: number): void => {
    if (reduceMotion) return;
    const id = ++burstIdRef.current;
    setBursts((prev) => [...prev, makeBurst(id, x, y)]);
    burstTimersRef.current.push(
      window.setTimeout(() => setBursts((prev) => prev.filter((b) => b.id !== id)), BURST_MS),
    );
  };


  return (
    <div
      onPointerMove={handlePointerMove}
      onPointerLeave={() => {
        pointerX.set(0);
        pointerY.set(0);
      }}
      className="relative isolate flex min-h-[calc(100dvh-4rem)] w-full flex-col items-center overflow-x-clip text-white"
    >
      {/* Night sky with the logo's two color fields */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-20 bg-[#05050a]" />
      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-[22%] top-[42%] -z-20 size-[55vmax] rounded-full blur-[110px]"
        style={{
          x: "-50%",
          y: "-50%",
          background: "radial-gradient(closest-side, rgba(52,92,255,0.55), transparent)",
        }}
        animate={reduceMotion ? undefined : { scale: [1, 1.12, 1], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-[78%] top-[42%] -z-20 size-[55vmax] rounded-full blur-[110px]"
        style={{
          x: "-50%",
          y: "-50%",
          background: "radial-gradient(closest-side, rgba(255,64,72,0.5), transparent)",
        }}
        animate={reduceMotion ? undefined : { scale: [1.12, 1, 1.12], opacity: [1, 0.8, 1] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />

      <FrequencyWaves
        colors={logoPalette}
        pointerX={pointerX}
        energized={false}
        still={reduceMotion}
        ribbons={ABOUT_RIBBONS}
        pulseKey={pulse}
      />

      {/* Opening: dove and heading, with the text starting right below so it shows it's there */}
      <section className="relative flex w-full flex-col items-center">
        {/* Motes behind the dove */}
        {!reduceMotion ? (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10"
            style={{ x: backX, y: backY }}
          >
            <MoteLayer motes={BACK_MOTES} />
          </motion.div>
        ) : null}

        {/* Dove */}
        <div className="relative mt-[4vh] flex w-full justify-center md:mt-[5vh]">
          {/* Halo and slow light rays behind the dove */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 -z-10 size-[min(620px,95vw)] rounded-full"
            style={{
              x: "-50%",
              y: "-50%",
              background:
                "radial-gradient(closest-side, rgba(255,247,225,0.5), rgba(255,220,170,0.16) 45%, transparent 72%)",
            }}
            animate={reduceMotion ? undefined : { scale: [1, 1.08, 1], opacity: [0.75, 1, 0.75] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 -z-10 size-[min(900px,140vw)]"
            style={{
              x: "-50%",
              y: "-50%",
              background:
                "repeating-conic-gradient(from 0deg, rgba(255,240,210,0.14) 0deg 3deg, transparent 3deg 14deg)",
              maskImage: "radial-gradient(closest-side, #000 10%, transparent 70%)",
              WebkitMaskImage: "radial-gradient(closest-side, #000 10%, transparent 70%)",
            }}
            animate={reduceMotion ? undefined : { rotate: 360 }}
            transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
          />

          {/* Ripple sent out by a touch */}
          <AnimatePresence>
            {pulse > 0 ? (
              <motion.div
                key={pulse}
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-1/2 -z-10 size-[260px] rounded-full border border-white/60"
                style={{ x: "-50%", y: "-50%" }}
                initial={{ scale: 0.4, opacity: 0.8 }}
                animate={{ scale: 4, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.6, ease: "easeOut" }}
              />
            ) : null}
          </AnimatePresence>

          {/* The dove stands still; it only fades in out of the light */}
          <motion.div
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.8, ease: "easeOut" }}
            className="w-[min(600px,86vw)]"
          >
            <button
              type="button"
              onClick={illuminate}
              aria-label="היונה של תדר-ישר-אל"
              className="relative block w-full cursor-pointer drop-shadow-[0_0_28px_rgba(255,244,214,0.55)] focus-visible:outline-none"
            >
              <Image
                src="/dove.png"
                alt=""
                width={1551}
                height={1008}
                priority
                draggable={false}
                className="h-auto w-full select-none"
              />
              {/* The dove as a silhouette of blazing light */}
              <AnimatePresence>
                {pulse > 0 ? (
                  <motion.span
                    key={pulse}
                    aria-hidden
                    className="pointer-events-none absolute inset-0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 1, 0] }}
                    transition={{ duration: 1.5, times: [0, 0.12, 0.45, 1], ease: "easeOut" }}
                    style={{ filter: BLAZE_FILTER }}
                  >
                    <Image
                      src="/dove.png"
                      alt=""
                      width={1551}
                      height={1008}
                      draggable={false}
                      className="h-auto w-full select-none [filter:brightness(0)_invert(1)]"
                    />
                  </motion.span>
                ) : null}
              </AnimatePresence>
            </button>
          </motion.div>
        </div>

        {/* Motes in front of the dove */}
        {!reduceMotion ? (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-10"
            style={{ x: frontX, y: frontY }}
          >
            <MoteLayer motes={FRONT_MOTES} />
          </motion.div>
        ) : null}

        {/* The light floods the screen for a moment */}
        <AnimatePresence>
          {pulse > 0 && !reduceMotion ? (
            <motion.div
              key={pulse}
              aria-hidden
              className="pointer-events-none fixed inset-0 z-[70]"
              style={{
                background:
                  "radial-gradient(circle at 50% 32%, rgba(255,255,255,0.95), rgba(255,240,205,0.6) 35%, rgba(255,230,190,0.15) 75%)",
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.9, 0] }}
              transition={{ duration: 1.1, times: [0, 0.15, 1], ease: "easeOut" }}
            />
          ) : null}
        </AnimatePresence>

        <LightBursts bursts={bursts} />

        {/* Words */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, delay: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative mb-2 mt-6 flex flex-col items-center gap-4 px-6 text-center md:mt-8"
        >
          <h1 className="bg-gradient-to-l from-[#ff5a64] via-[#c08bff] to-[#5b84ff] bg-clip-text font-heading text-5xl font-bold leading-tight tracking-tight text-transparent drop-shadow-[0_0_30px_rgba(192,139,255,0.35)] md:text-7xl">
            {HEADING_WORDS.map((word, i) => (
              <Fragment key={word}>
                {i > 0 ? " " : null}
                <WordOfLight word={word} onRelease={releaseLightAt} still={reduceMotion} />
              </Fragment>
            ))}
            .
          </h1>
        </motion.div>
      </section>

      <AboutText still={reduceMotion} />
    </div>
  );
}

/** One depth layer of rising motes of light. */
function MoteLayer({ motes }: { motes: readonly Mote[] }): ReactElement {
  return (
    <>
      {motes.map((m, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${m.left}%`,
            bottom: `${m.bottom}%`,
            width: m.size,
            height: m.size,
            background: `rgb(${m.color})`,
            filter: m.blur > 0 ? `blur(${m.blur}px)` : undefined,
            boxShadow: `0 0 ${m.size * 2}px rgba(${m.color},0.95)`,
          }}
          animate={{ y: [0, -m.rise], x: [0, m.drift], opacity: [0, m.peak, 0] }}
          transition={{ duration: m.duration, delay: m.delay, repeat: Infinity, ease: "easeOut" }}
        />
      ))}
    </>
  );
}

interface WordOfLightProps {
  word: string;
  /** Releases rising points of light from a screen position. */
  onRelease: (x: number, y: number) => void;
  still: boolean;
}

/**
 * A heading word that, when touched, blazes into white light like the dove and releases
 * points of light from where it was touched.
 */
function WordOfLight({ word, onRelease, still }: WordOfLightProps): ReactElement {
  /** Counts touches (keys a fresh glow each time); 0 while the word is not glowing. */
  const [lit, setLit] = useState(0);
  const touchesRef = useRef(0);

  const blaze = (x: number, y: number): void => {
    setLit(++touchesRef.current);
    onRelease(x, y);
  };

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={(e: MouseEvent<HTMLSpanElement>) => blaze(e.clientX, e.clientY)}
      onKeyDown={(e: KeyboardEvent<HTMLSpanElement>) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        const r = e.currentTarget.getBoundingClientRect();
        blaze(r.left + r.width / 2, r.top + r.height / 2);
      }}
      className="relative inline-block cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
    >
      {word}
      {/* The word as white light, over its gradient */}
      {lit > 0 ? (
        <motion.span
          key={lit}
          aria-hidden
          // Removed once it fades, so the word isn't read or copied twice.
          onAnimationComplete={() => setLit((n) => (n === lit ? 0 : n))}
          className="pointer-events-none absolute inset-0 text-white"
          style={{ filter: BLAZE_FILTER }}
          initial={{ opacity: 0 }}
          animate={{ opacity: still ? [0, 1, 0] : [0, 1, 1, 0] }}
          transition={{
            duration: still ? 0.8 : 1.6,
            times: still ? [0, 0.3, 1] : [0, 0.1, 0.45, 1],
            ease: "easeOut",
          }}
        >
          {word}
        </motion.span>
      ) : null}
    </span>
  );
}

/** The about text, paragraph by paragraph, as written by the site's author. */
const ABOUT_PARAGRAPHS: readonly string[] = [
  "אנו נמצאים בתקופת שינויים מורכבת שעובר העולם כולו - תקופת הגאולה.",
  '"הגאולה" אינה מונח דתי אלא תהליך של שיחרור- יציאה לחופשי מהמישטר תחתיו אנו חיים:',
  'ב-250 שנים האחרונות האנושות חיה בעולם שקר (עלמא דה-שיקרא) מהונדס ותחום, שיצרו האילומינטים/אנשי "סדר עולמי חדש"/הבונים החופשיים. - זוהי "הונאת האנושות הגדולה".',
  "היציאה לחופשי מעול המישטר העולמי הצורר היא יציאת מצריים הלכה למעשה.",
  "כחלק מעולם השקר שנוצר בהונאה, תחומים רבים  כמו רפואת אמת,נישכחו, ושקרים הוצגו כאמת.",
  "חשיפות האמת בתחומים השונים, היזכרות ברפואת האמת והנגשתה ועשיית דיני צדק על הפשעים שנעשו בעולם, הינם תהליך הגאולה השלם,",
];

/** The closing lines, rising in one after another. */
const ABOUT_CLOSING: readonly string[] = ["הפועם בתדר האמת -", "תדר ישר עם האלוהות -"];
const ABOUT_SIGNATURE = "תדר ישר-אל.";

/** Paragraphs fade up as they scroll into view. */
function Reveal({
  children,
  still,
  delay = 0,
  className,
}: {
  children: ReactNode;
  still: boolean;
  delay?: number;
  className?: string;
}): ReactElement {
  return (
    <motion.p
      initial={still ? false : { opacity: 0, y: 18, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.p>
  );
}

function AboutText({ still }: { still: boolean }): ReactElement {
  return (
    <section className="relative z-10 w-full max-w-2xl px-6 pb-[16vh] pt-6 text-center">
      {/* A soft veil so the words stay readable over the waves */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -inset-y-10 -z-10 rounded-[3rem] bg-[#05050a]/45 blur-2xl"
      />
      <div className="flex flex-col gap-6 text-lg leading-loose text-white/85 md:text-xl">
        {ABOUT_PARAGRAPHS.map((text) => (
          <Reveal key={text} still={still}>
            {text}
          </Reveal>
        ))}
      </div>

      <div className="mt-12 flex flex-col items-center gap-3 font-heading">
        {ABOUT_CLOSING.map((line, i) => (
          <Reveal
            key={line}
            still={still}
            delay={i * 0.35}
            className="text-2xl font-bold text-white/90 md:text-3xl"
          >
            {line}
          </Reveal>
        ))}
        <Reveal
          still={still}
          delay={ABOUT_CLOSING.length * 0.35}
          className="mt-2 bg-gradient-to-l from-[#ff5a64] via-[#c08bff] to-[#5b84ff] bg-clip-text text-5xl font-bold text-transparent drop-shadow-[0_0_30px_rgba(192,139,255,0.45)] md:text-6xl"
        >
          {ABOUT_SIGNATURE}
        </Reveal>
      </div>
    </section>
  );
}
