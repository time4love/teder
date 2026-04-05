"use client";

import { motion } from "framer-motion";
import { Play } from "lucide-react";
import type { Video } from "@/types/database";

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
  const bg = video.cover_image_url ?? "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1200&q=80";
  const showEpisodeMeta =
    episodeCount !== undefined &&
    video.episode_number !== null;

  return (
    <section
      className="relative h-[100dvh] w-full min-w-full shrink-0 snap-start overflow-hidden bg-neutral-950"
      aria-label={video.title}
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${bg})` }}
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/25 to-black/80"
        aria-hidden
      />

      <div className="relative z-10 flex h-full flex-col">
        <div className="flex flex-1 items-center justify-center">
          <motion.button
            type="button"
            className="flex h-20 w-20 items-center justify-center rounded-full border border-white/30 bg-white/15 text-white shadow-lg backdrop-blur-md transition hover:bg-white/25"
            initial={{ opacity: 0, scale: 0.92 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ amount: 0.45 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            aria-label={`נגן: ${video.title}`}
          >
            <Play className="h-10 w-10 translate-x-0.5 text-white" strokeWidth={1.25} />
          </motion.button>
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
