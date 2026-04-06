"use client";

import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import type { Video } from "@/types/database";
import { cn } from "@/lib/utils";
import { getYouTubeEmbedSrc, getYouTubeThumbnail } from "@/utils/youtube";

export interface VideoCardProps {
  video: Video;
  /** Playlist names (standalone feed only; omitted when inside a playlist strip). */
  playlistTitles?: string[];
  /** Hide playlist chips even when `playlistTitles` is set. */
  hidePlaylistChips?: boolean;
  /** Full viewport feed vs compact strip inside horizontal playlist row. */
  variant?: "feed" | "strip";
}

export function VideoCard({
  video,
  playlistTitles,
  hidePlaylistChips = false,
  variant = "feed",
}: VideoCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const trimmedCover = video.cover_image_url?.trim() ?? "";
  const imageSrc: string | null =
    trimmedCover !== ""
      ? trimmedCover
      : getYouTubeThumbnail(video.youtube_url);

  const embedSrc = getYouTubeEmbedSrc(video.youtube_url, isPlaying);

  const showPlaylists =
    !hidePlaylistChips &&
    playlistTitles !== undefined &&
    playlistTitles.length > 0;

  const isStrip = variant === "strip";

  return (
    <section
      className={cn(
        "relative w-full shrink-0 overflow-hidden bg-neutral-950",
        isStrip
          ? "h-[min(78dvh,720px)] min-h-[min(78dvh,720px)] rounded-lg border border-zinc-800"
          : "h-[100dvh] min-w-full snap-start",
      )}
      aria-label={video.title}
    >
      {!isPlaying && (
        <>
          {imageSrc !== null ? (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${imageSrc})` }}
            />
          ) : (
            <div
              className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-950 to-black"
              aria-hidden
            />
          )}
          <div
            className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/25 to-black/80"
            aria-hidden
          />
        </>
      )}

      {isPlaying && embedSrc !== null && (
        <div className="absolute inset-0 z-[1] bg-black">
          <iframe
            title={video.title}
            src={embedSrc}
            className="h-full w-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/90 to-transparent"
            aria-hidden
          />
        </div>
      )}

      {isPlaying && embedSrc === null && (
        <div className="absolute inset-0 z-[1] flex items-center justify-center bg-black px-6 text-center text-white/80">
          כתובת YouTube לא תקינה
        </div>
      )}

      <div className="relative z-10 flex h-full flex-col">
        <div className="flex flex-1 items-center justify-center">
          {!isPlaying && (
            <motion.button
              type="button"
              className="flex h-20 w-20 items-center justify-center rounded-full border border-white/30 bg-white/15 text-white shadow-lg backdrop-blur-md transition hover:bg-white/25"
              initial={{ opacity: 0, scale: 0.92 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ amount: 0.45 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              aria-label={`נגן: ${video.title}`}
              onClick={() => {
                setIsPlaying(true);
              }}
            >
              <Play className="h-10 w-10 translate-x-0.5 text-white" strokeWidth={1.25} />
            </motion.button>
          )}
        </div>

        <motion.div
          className={cn("px-5 pb-10 pt-4", isStrip && "pb-6 pt-2")}
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ amount: 0.4 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          {showPlaylists && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {playlistTitles.map((t, i) => (
                <Badge
                  key={`${video.id}-pl-${i}-${t}`}
                  variant="secondary"
                  className="border-zinc-600 bg-zinc-800/90 text-xs text-zinc-100"
                >
                  {t}
                </Badge>
              ))}
            </div>
          )}
          <h2
            className={cn(
              "text-balance font-bold leading-tight text-white",
              isStrip ? "text-lg" : "text-2xl",
            )}
          >
            {video.title}
          </h2>
          {video.description !== null && video.description !== "" && !isStrip && (
            <p className="mt-3 max-w-prose text-pretty text-sm leading-relaxed text-white/85">
              {video.description}
            </p>
          )}
          {isStrip &&
            video.description !== null &&
            video.description !== "" && (
              <p className="mt-2 line-clamp-2 text-pretty text-xs leading-relaxed text-white/75">
                {video.description}
              </p>
            )}
        </motion.div>
      </div>
    </section>
  );
}
