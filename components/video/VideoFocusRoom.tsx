"use client";

import type { ReactElement } from "react";
import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { AlignRight, ArrowRight, Play } from "lucide-react";

import { ShareButton } from "@/components/shared/ShareButton";
import { cn } from "@/lib/utils";
import { getYouTubeVideoId } from "@/utils/youtube";

export type VideoFocusRoomVideo = {
  id: string;
  title: string;
  description: string | null;
  youtube_url: string;
};

export interface VideoFocusRoomProps {
  video: VideoFocusRoomVideo;
  backHref: string;
  backText: string;
  shareUrl: string;
  shareText: string;
}

/**
 * Toggle between cinematic watch layout and editorial read layout for a single video.
 */
export function VideoFocusRoom({
  video,
  backHref,
  backText,
  shareUrl,
  shareText,
}: VideoFocusRoomProps): ReactElement {
  const [mode, setMode] = useState<"watch" | "read">("watch");

  const ytId = getYouTubeVideoId(video.youtube_url);
  const embedSrc =
    ytId !== null
      ? `https://www.youtube.com/embed/${ytId}?rel=0`
      : null;

  return (
    <div
      dir="rtl"
      className={cn(
        "flex min-h-[calc(100vh-4rem)] flex-col transition-colors duration-700",
        mode === "watch"
          ? "bg-zinc-950"
          : "bg-[#F9F9F7]",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200/80 bg-white/90 p-4 backdrop-blur-sm md:px-8">
        <Link
          href={backHref}
          className="inline-flex items-center text-sm font-medium text-zinc-700 transition hover:text-zinc-900"
        >
          <ArrowRight className="ms-2 size-4 shrink-0" aria-hidden />
          {backText}
        </Link>

        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
          <ShareButton
            title={video.title}
            text={shareText}
            url={shareUrl}
            className="border-zinc-300 bg-white/80"
          />
          <div
            className="flex rounded-full border border-zinc-200 bg-zinc-200/50 p-1"
            role="group"
            aria-label="מצב תצוגה"
          >
            <button
              type="button"
              onClick={() => setMode("watch")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition",
                mode === "watch"
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-600 hover:text-zinc-800",
              )}
            >
              <Play className="size-3.5" aria-hidden />
              צפייה
            </button>
            <button
              type="button"
              onClick={() => setMode("read")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition",
                mode === "read"
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-600 hover:text-zinc-800",
              )}
            >
              <AlignRight className="size-3.5" aria-hidden />
              קריאה
            </button>
          </div>
        </div>
      </div>

      <motion.div
        layout
        className="mx-auto flex w-full max-w-7xl flex-col items-center gap-8 p-4 md:p-8"
        transition={{ layout: { duration: 0.55, ease: [0.21, 0.47, 0.32, 0.98] } }}
      >
        <motion.div
          layout
          animate={{
            maxWidth: mode === "watch" ? 1200 : 768,
          }}
          transition={{ layout: { duration: 0.55, ease: [0.21, 0.47, 0.32, 0.98] } }}
          className="relative aspect-video w-full overflow-hidden rounded-xl bg-black shadow-2xl"
        >
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
        </motion.div>

        <motion.article
          layout
          animate={{
            maxWidth: mode === "watch" ? 1200 : 768,
            opacity: mode === "watch" ? 0.6 : 1,
          }}
          transition={{ layout: { duration: 0.55, ease: [0.21, 0.47, 0.32, 0.98] } }}
          className={cn(
            "flex w-full flex-col gap-4",
            mode === "watch" ? "text-zinc-300" : "text-zinc-900",
          )}
        >
          <motion.h1
            layout
            className={cn(
              "font-heading font-bold",
              mode === "watch"
                ? "text-2xl text-zinc-100"
                : "text-4xl leading-tight text-zinc-900 md:text-5xl",
            )}
          >
            {video.title}
          </motion.h1>
          <motion.div
            layout
            className={cn(
              "whitespace-pre-wrap leading-relaxed",
              mode === "watch"
                ? "line-clamp-3 text-base text-zinc-400"
                : "mt-4 font-serif text-lg text-zinc-800 md:text-xl",
            )}
          >
            {video.description !== null && video.description.trim() !== ""
              ? video.description
              : "—"}
          </motion.div>
        </motion.article>
      </motion.div>
    </div>
  );
}
