"use client";

import type { ReactElement, ReactNode } from "react";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Play } from "lucide-react";

import { ShareButton } from "@/components/shared/ShareButton";
import { cn } from "@/lib/utils";
import { getYouTubeVideoId } from "@/utils/youtube";

export type VideoFocusRoomVideo = {
  id: string;
  title: string;
  description: string | null;
  youtube_url: string;
  thumb: string;
};

export interface PlaylistEpisodeRef {
  id: string;
  title: string;
  thumb: string;
}

/** A playlist this video belongs to, with everything needed to show where it sits. */
export interface VideoPlaylistContext {
  id: string;
  title: string;
  /** Category accent as `r, g, b`. */
  rgb: string;
  categoryName: string | null;
  episodes: PlaylistEpisodeRef[];
}

export interface VideoFocusRoomProps {
  video: VideoFocusRoomVideo;
  /** Playlists containing the video; `?playlist=` picks one, otherwise the first. */
  playlists: VideoPlaylistContext[];
  shareUrl: string;
  shareText: string;
}

const NEUTRAL_RGB = "185, 180, 215";

/**
 * Renders `children` with the playlist the visitor came from (`?playlist=`), falling back
 * to the video's first playlist. Reading the URL happens in the browser, so the page stays
 * static; the boundary keeps the player itself out of the re-render.
 */
function WithPlaylist({
  playlists,
  children,
}: {
  playlists: VideoPlaylistContext[];
  children: (p: VideoPlaylistContext | null) => ReactNode;
}): ReactElement {
  return (
    <Suspense fallback={children(playlists[0] ?? null)}>
      <FromSearchParams playlists={playlists}>{children}</FromSearchParams>
    </Suspense>
  );
}

function FromSearchParams({
  playlists,
  children,
}: {
  playlists: VideoPlaylistContext[];
  children: (p: VideoPlaylistContext | null) => ReactNode;
}): ReactElement {
  const id = useSearchParams().get("playlist");
  const p = playlists.find((x) => x.id === id) ?? playlists[0] ?? null;
  return <>{children(p)}</>;
}

function episodeHref(episodeId: string, playlistId: string): string {
  return `/video/${episodeId}?playlist=${playlistId}`;
}

/**
 * The watch page: a dark screening room. The video's own colors glow around the player;
 * below it the episode's place in its playlist, its story, and the way to the next one.
 * On wide screens the playlist runs alongside as a rail, the current episode lit.
 */
export function VideoFocusRoom({
  video,
  playlists,
  shareUrl,
  shareText,
}: VideoFocusRoomProps): ReactElement {
  const reduceMotion = useReducedMotion() === true;
  const [expanded, setExpanded] = useState(false);

  const ytId = getYouTubeVideoId(video.youtube_url);
  const embedSrc = ytId !== null ? `https://www.youtube.com/embed/${ytId}?rel=0` : null;
  const description = video.description?.trim() ?? "";

  return (
    <div dir="rtl" className="relative isolate min-h-[calc(100dvh-4rem)] w-full overflow-x-clip pb-20 text-white">
      {/* The room: dark, lit by the video */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-20 bg-[#07060f]" />
      {/* eslint-disable-next-line @next/next/no-img-element -- YouTube / editorial thumbnail */}
      <img
        src={video.thumb}
        alt=""
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 h-full w-full scale-125 object-cover opacity-25 blur-[90px] saturate-150"
      />

      {/* Top bar */}
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 pt-5 md:px-8">
        <WithPlaylist playlists={playlists}>
          {(p) => (
            <Link
              href={p !== null ? `/playlist/${p.id}` : "/revelations"}
              className="inline-flex min-w-0 items-center gap-2 text-sm font-medium text-white/60 transition hover:text-white"
            >
              <ArrowRight className="size-4 shrink-0" aria-hidden />
              <span className="truncate">
                {p !== null ? `חזרה אל: ${p.title}` : "חזרה לחשיפות אמת"}
              </span>
            </Link>
          )}
        </WithPlaylist>
        <ShareButton title={video.title} text={shareText} url={shareUrl} appearance="onDark" />
      </div>

      <div className="mx-auto mt-4 flex max-w-7xl flex-col gap-8 px-0 md:mt-6 md:px-8 xl:flex-row xl:items-start">
        {/* Player and the episode */}
        <div className="min-w-0 flex-1">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            {/* Ambilight: the thumbnail glowing out from behind the screen */}
            {/* eslint-disable-next-line @next/next/no-img-element -- YouTube / editorial thumbnail */}
            <img
              src={video.thumb}
              alt=""
              aria-hidden
              className="pointer-events-none absolute inset-0 -z-10 hidden h-full w-full scale-105 rounded-3xl object-cover opacity-70 blur-3xl md:block"
            />
            <div className="relative aspect-video w-full overflow-hidden bg-black md:rounded-2xl md:border md:border-white/10 md:shadow-2xl">
              {embedSrc !== null ? (
                <iframe
                  title={video.title}
                  src={embedSrc}
                  className="absolute inset-0 h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <div className="flex h-full items-center justify-center p-6 text-center text-sm text-zinc-400">
                  לא ניתן לטעון את הווידאו — כתובת YouTube לא תקינה.
                </div>
              )}
            </div>
          </motion.div>

          <div className="px-4 md:px-0">
            <WithPlaylist playlists={playlists}>
              {(p) => <EpisodePlace playlist={p} videoId={video.id} />}
            </WithPlaylist>

            <h1 className="mt-2 font-heading text-3xl font-bold leading-tight md:text-5xl">
              {video.title}
            </h1>

            {description !== "" ? (
              <div className="mt-4 max-w-3xl">
                <p
                  className={cn(
                    "whitespace-pre-line text-base leading-relaxed text-white/70 md:text-lg",
                    !expanded && "line-clamp-3",
                  )}
                >
                  {description}
                </p>
                {description.length > 180 ? (
                  <button
                    type="button"
                    onClick={() => setExpanded((v) => !v)}
                    className="mt-1 text-sm font-medium text-white/85 underline-offset-4 hover:underline"
                  >
                    {expanded ? "פחות" : "קראו עוד"}
                  </button>
                ) : null}
              </div>
            ) : null}

            <WithPlaylist playlists={playlists}>
              {(p) => <PrevNext playlist={p} videoId={video.id} />}
            </WithPlaylist>
          </div>
        </div>

        {/* The playlist alongside */}
        <WithPlaylist playlists={playlists}>
          {(p) =>
            p !== null && p.episodes.length > 1 ? (
              <aside className="px-4 md:px-0 xl:sticky xl:top-24 xl:w-[22rem] xl:shrink-0">
                <h2 className="mb-3 font-heading text-2xl font-bold">
                  {p.title}
                  <span className="ms-2 font-sans text-sm font-medium text-white/45">
                    {p.episodes.length} פרקים
                  </span>
                </h2>
                <ol className="flex flex-col gap-2 xl:max-h-[calc(100dvh-10rem)] xl:overflow-y-auto xl:pe-1">
                  {p.episodes.map((ep, i) => {
                    const current = ep.id === video.id;
                    return (
                      <li key={ep.id}>
                        <Link
                          href={episodeHref(ep.id, p.id)}
                          aria-current={current ? "page" : undefined}
                          className={cn(
                            "group flex items-center gap-3 rounded-xl border p-2 transition",
                            current
                              ? "bg-white/[0.08]"
                              : "border-transparent hover:bg-white/[0.05]",
                          )}
                          style={
                            current
                              ? {
                                  borderColor: `rgba(${p.rgb}, 0.6)`,
                                  boxShadow: `0 0 24px rgba(${p.rgb}, 0.2)`,
                                }
                              : undefined
                          }
                        >
                          <span
                            className="w-5 shrink-0 text-center text-sm font-bold"
                            style={{ color: current ? `rgb(${p.rgb})` : "rgba(255,255,255,0.45)" }}
                          >
                            {current ? <Play className="mx-auto size-3.5 fill-current" aria-hidden /> : i + 1}
                          </span>
                          <span className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-lg bg-zinc-900">
                            {/* eslint-disable-next-line @next/next/no-img-element -- YouTube / editorial thumbnail */}
                            <img
                              src={ep.thumb}
                              alt=""
                              loading="lazy"
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          </span>
                          <span
                            className={cn(
                              "line-clamp-2 text-sm leading-snug",
                              current ? "font-semibold text-white" : "text-white/75",
                            )}
                          >
                            {ep.title}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ol>
              </aside>
            ) : null
          }
        </WithPlaylist>
      </div>
    </div>
  );
}

/** "פרק 2 מתוך 5 · <category>" above the title. */
function EpisodePlace({
  playlist,
  videoId,
}: {
  playlist: VideoPlaylistContext | null;
  videoId: string;
}): ReactElement | null {
  if (playlist === null) return null;
  const index = playlist.episodes.findIndex((e) => e.id === videoId);
  const rgb = playlist.rgb;
  return (
    <p className="mt-5 flex flex-wrap items-center gap-2 text-sm text-white/60">
      {index >= 0 && playlist.episodes.length > 1 ? (
        <span className="font-medium" style={{ color: `rgb(${rgb})` }}>
          פרק {index + 1} מתוך {playlist.episodes.length}
        </span>
      ) : null}
      {playlist.categoryName !== null ? (
        <span
          className="rounded-full border px-2.5 py-0.5 text-xs"
          style={{ borderColor: `rgba(${rgb}, 0.5)`, background: `rgba(${rgb}, 0.12)` }}
        >
          {playlist.categoryName}
        </span>
      ) : null}
    </p>
  );
}

/** Previous and next episode in the playlist. */
function PrevNext({
  playlist,
  videoId,
}: {
  playlist: VideoPlaylistContext | null;
  videoId: string;
}): ReactElement | null {
  if (playlist === null) return null;
  const i = playlist.episodes.findIndex((e) => e.id === videoId);
  if (i < 0) return null;
  const prev = playlist.episodes[i - 1];
  const next = playlist.episodes[i + 1];
  if (prev === undefined && next === undefined) return null;
  const rgb = playlist.rgb ?? NEUTRAL_RGB;

  return (
    <nav aria-label="ניווט בין פרקים" className="mt-8 grid gap-3 sm:grid-cols-2">
      {next !== undefined ? (
        <Link
          href={episodeHref(next.id, playlist.id)}
          className="group flex items-center gap-4 rounded-2xl border p-3 transition hover:bg-white/[0.06] sm:order-2"
          style={{ borderColor: `rgba(${rgb}, 0.5)`, boxShadow: `0 0 30px rgba(${rgb}, 0.15)` }}
        >
          <span className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-lg bg-zinc-900">
            {/* eslint-disable-next-line @next/next/no-img-element -- YouTube / editorial thumbnail */}
            <img src={next.thumb} alt="" loading="lazy" className="h-full w-full object-cover" />
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="text-xs font-medium" style={{ color: `rgb(${rgb})` }}>
              הפרק הבא
            </span>
            <span className="line-clamp-2 text-sm font-semibold">{next.title}</span>
          </span>
          <ArrowLeft className="ms-auto size-5 shrink-0 text-white/50 transition group-hover:-translate-x-1 group-hover:text-white" aria-hidden />
        </Link>
      ) : null}
      {prev !== undefined ? (
        <Link
          href={episodeHref(prev.id, playlist.id)}
          className="group flex items-center gap-3 rounded-2xl border border-white/10 p-3 text-white/70 transition hover:bg-white/[0.05] hover:text-white sm:order-1"
        >
          <ArrowRight className="size-4 shrink-0" aria-hidden />
          <span className="flex min-w-0 flex-col">
            <span className="text-xs text-white/45">הפרק הקודם</span>
            <span className="line-clamp-1 text-sm">{prev.title}</span>
          </span>
        </Link>
      ) : null}
    </nav>
  );
}
