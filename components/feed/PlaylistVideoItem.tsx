"use client";

import type { ReactElement } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Play } from "lucide-react";

import type { Video } from "@/types/database";

export type PlaylistVideoItemVideo = Pick<
  Video,
  "id" | "title" | "description" | "cover_image_url" | "youtube_url"
>;

export interface PlaylistVideoItemProps {
  video: PlaylistVideoItemVideo;
  playlistId: string;
  index: number;
}

/**
 * Horizontal list row for a video inside a playlist dossier (depth 2).
 */
export function PlaylistVideoItem({
  video,
  playlistId,
  index,
}: PlaylistVideoItemProps): ReactElement {
  const cover = video.cover_image_url?.trim();
  const src =
    cover !== undefined && cover !== "" ? cover : "/placeholder.jpg";

  return (
    <Link
      href={`/video/${video.id}?playlist=${playlistId}`}
      className="group block"
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
      >
        <article className="flex flex-col gap-6 rounded-xl p-4 transition-colors hover:bg-zinc-100/80 sm:flex-row sm:items-center">
          <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-lg bg-zinc-200 shadow-sm sm:w-64 md:w-80">
            {/* eslint-disable-next-line @next/next/no-img-element -- covers may be external URLs */}
            <img
              src={src}
              alt=""
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div
              className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-300 group-hover:bg-black/25"
              aria-hidden
            >
              <Play
                className="size-12 text-white opacity-0 drop-shadow-md transition-opacity duration-300 group-hover:opacity-100 sm:size-11"
                strokeWidth={1.75}
                aria-hidden
              />
            </div>
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <h3 className="font-heading text-xl font-bold text-zinc-900 group-hover:text-zinc-700">
              {video.title}
            </h3>
            {video.description !== null && video.description.trim() !== "" ? (
              <p className="line-clamp-3 text-sm leading-relaxed text-zinc-600">
                {video.description.trim()}
              </p>
            ) : null}
          </div>
        </article>
      </motion.div>
    </Link>
  );
}
