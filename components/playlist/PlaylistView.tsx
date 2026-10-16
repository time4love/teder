"use client";

import type { ReactElement } from "react";
import { useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";

import { ShareButton } from "@/components/shared/ShareButton";
import { cn } from "@/lib/utils";

export interface PlaylistEpisode {
  id: string;
  title: string;
  description: string | null;
  thumb: string;
}

export interface PlaylistViewProps {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  cover: string;
  category: { name: string; rgb: string } | null;
  episodes: PlaylistEpisode[];
  shareUrl: string;
  shareText: string;
}

/** Neutral accent when the playlist has no category. */
const NEUTRAL_RGB = "185, 180, 215";
const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * A playlist's page: its cover as a poster over a night sky tinted by the cover and the
 * category's color, the playlist's story, and its episodes strung along a glowing line.
 */
export function PlaylistView({
  id,
  title,
  subtitle,
  description,
  cover,
  category,
  episodes,
  shareUrl,
  shareText,
}: PlaylistViewProps): ReactElement {
  const reduceMotion = useReducedMotion() === true;
  const [expanded, setExpanded] = useState(false);
  const rgb = category?.rgb ?? NEUTRAL_RGB;
  const first = episodes[0];
  const enter = (delay: number) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.9, delay, ease: EASE },
        };

  return (
    <div className="relative isolate min-h-[calc(100dvh-4rem)] w-full overflow-x-clip px-4 pb-24 text-white md:px-8">
      {/* Night sky: the cover, blurred, under the category's color */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-20 bg-[#07060f]" />
      {/* eslint-disable-next-line @next/next/no-img-element -- editorial URLs may be external */}
      <img
        src={cover}
        alt=""
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 h-full w-full scale-125 object-cover opacity-30 blur-[80px] saturate-150"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background: `radial-gradient(70% 50% at 50% 15%, rgba(${rgb}, 0.18), transparent 70%), linear-gradient(to bottom, transparent, #07060f 85%)`,
        }}
      />

      <div className="mx-auto max-w-6xl">
        <Link
          href="/revelations"
          className="inline-flex items-center gap-2 pt-6 text-sm font-medium text-white/60 transition hover:text-white"
        >
          <ArrowRight className="size-4" aria-hidden />
          חזרה לחשיפות אמת
        </Link>

        {/* Hero */}
        <section className="mt-6 grid items-center gap-8 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:gap-12">
          <motion.div
            {...enter(0)}
            className="relative mx-auto aspect-[4/5] w-full max-w-[420px] overflow-hidden rounded-3xl border border-white/10"
            style={{ boxShadow: `0 30px 90px rgba(${rgb}, 0.35), 0 0 0 1px rgba(${rgb}, 0.25)` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- editorial URLs may be external */}
            <img src={cover} alt={title} className="h-full w-full object-cover" />
            <div
              aria-hidden
              className="absolute inset-x-0 bottom-0 h-1.5"
              style={{ background: `linear-gradient(to left, transparent, rgb(${rgb}), transparent)` }}
            />
          </motion.div>

          <div className="flex flex-col items-start gap-4">
            {category !== null ? (
              <motion.span
                {...enter(0.1)}
                className="rounded-full border px-3 py-1 text-sm font-medium"
                style={{ borderColor: `rgba(${rgb}, 0.6)`, background: `rgba(${rgb}, 0.16)` }}
              >
                {category.name}
              </motion.span>
            ) : null}
            <motion.h1
              {...enter(0.15)}
              className="font-heading text-5xl font-bold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl"
              style={{ textShadow: `0 0 40px rgba(${rgb}, 0.35)` }}
            >
              {title}
            </motion.h1>
            {subtitle !== null ? (
              <motion.p {...enter(0.22)} className="text-xl text-white/80 md:text-2xl">
                {subtitle}
              </motion.p>
            ) : null}
            {description !== null ? (
              <motion.div {...enter(0.28)} className="max-w-xl">
                <p
                  className={cn(
                    "whitespace-pre-line text-base leading-relaxed text-white/65 md:text-lg",
                    !expanded && "line-clamp-4",
                  )}
                >
                  {description}
                </p>
                {description.length > 220 ? (
                  <button
                    type="button"
                    onClick={() => setExpanded((v) => !v)}
                    className="mt-1 text-sm font-medium text-white/80 underline-offset-4 hover:underline"
                  >
                    {expanded ? "פחות" : "קראו עוד"}
                  </button>
                ) : null}
              </motion.div>
            ) : null}

            <motion.div {...enter(0.34)} className="mt-2 flex flex-wrap items-center gap-3">
              {first !== undefined ? (
                <Link
                  href={`/video/${first.id}?playlist=${id}`}
                  className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-base font-semibold text-[#07060f] transition hover:brightness-110"
                  style={{ background: `rgb(${rgb})`, boxShadow: `0 0 34px rgba(${rgb}, 0.55)` }}
                >
                  <Play className="size-4 fill-current" aria-hidden />
                  התחילו לצפות
                </Link>
              ) : null}
              <ShareButton title={title} text={shareText} url={shareUrl} appearance="onDark" />
              <span className="text-sm text-white/50">
                {episodes.length === 1 ? "פרק אחד" : `${episodes.length} פרקים`}
              </span>
            </motion.div>
          </div>
        </section>

        {/* Episodes along a glowing line */}
        <section className="mt-16 md:mt-20">
          <h2 className="mb-6 font-heading text-3xl font-bold md:text-4xl">פרקים</h2>
          {episodes.length === 0 ? (
            <p className="text-white/50">אין סרטונים בפלייליסט זה עדיין.</p>
          ) : (
            <ol className="relative flex flex-col gap-3">
              <span
                aria-hidden
                className="absolute bottom-6 right-[1.15rem] top-6 w-px md:right-[1.4rem]"
                style={{
                  background: `linear-gradient(to bottom, rgba(${rgb}, 0.9), rgba(${rgb}, 0.15))`,
                  boxShadow: `0 0 12px rgba(${rgb}, 0.6)`,
                }}
              />
              {episodes.map((ep, i) => (
                <motion.li
                  key={ep.id}
                  initial={reduceMotion ? false : { opacity: 0, x: 24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "0px 0px -8% 0px" }}
                  transition={{ duration: 0.6, delay: Math.min(i, 6) * 0.05, ease: EASE }}
                >
                  <Link
                    href={`/video/${ep.id}?playlist=${id}`}
                    className="group relative flex items-center gap-4 rounded-2xl p-2 transition hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 md:gap-6 md:p-3"
                  >
                    <span
                      className="relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full border text-sm font-bold md:size-11 md:text-base"
                      style={{
                        borderColor: `rgba(${rgb}, 0.8)`,
                        background: "#07060f",
                        boxShadow: `0 0 14px rgba(${rgb}, 0.45)`,
                      }}
                    >
                      {i + 1}
                    </span>
                    <span className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-xl bg-zinc-900 sm:w-44 md:w-60">
                      {/* eslint-disable-next-line @next/next/no-img-element -- YouTube / editorial thumbnails */}
                      <img
                        src={ep.thumb}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <span className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                        <span
                          className="flex size-11 items-center justify-center rounded-full"
                          style={{ background: `rgba(${rgb}, 0.9)` }}
                        >
                          <Play className="size-5 fill-[#07060f] text-[#07060f]" aria-hidden />
                        </span>
                      </span>
                    </span>
                    <span className="flex min-w-0 flex-col gap-1">
                      <span className="font-heading text-lg font-bold leading-snug md:text-2xl">
                        {ep.title}
                      </span>
                      {ep.description !== null ? (
                        <span className="line-clamp-1 text-sm text-white/55 md:line-clamp-2 md:text-base">
                          {ep.description}
                        </span>
                      ) : null}
                    </span>
                  </Link>
                </motion.li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}
