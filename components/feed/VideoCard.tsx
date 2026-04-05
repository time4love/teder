"use client";

import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { useState } from "react";
import type { Video } from "@/types/database";
import { getYouTubeEmbedSrc } from "@/utils/youtube";

export interface VideoCardProps {
  video: Video;
  seriesTitle?: string;
  episodeCount?: number;
}

export function VideoCard({
  video,
  seriesTitle,
  episodeCount,
}: VideoCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const bg =
    video.cover_image_url ??
    "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1200&q=80";
  const showEpisodeMeta =
    episodeCount !== undefined && video.episode_number !== null;

  const embedSrc = getYouTubeEmbedSrc(video.youtube_url, isPlaying);

  return (
    <section
      className="relative h-[100dvh] w-full min-w-full shrink-0 snap-start overflow-hidden bg-neutral-950"
      aria-label={video.title}
    >
      {!isPlaying && (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${bg})` }}
          />
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
          className="px-5 pb-10 pt-4"
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ amount: 0.4 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          {seriesTitle !== undefined && seriesTitle !== "" && (
            <p className="mb-1 text-sm font-medium text-white/75">{seriesTitle}</p>
          )}
          <h2 className="text-balance text-2xl font-bold leading-tight text-white">
            {video.title}
          </h2>
          {showEpisodeMeta && (
            <span className="mt-2 inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white">
              פרק {video.episode_number} מתוך {episodeCount}
            </span>
          )}
          {video.description !== null && video.description !== "" && (
            <p className="mt-3 max-w-prose text-pretty text-sm leading-relaxed text-white/85">
              {video.description}
            </p>
          )}
        </motion.div>
      </div>
    </section>
  );
}
