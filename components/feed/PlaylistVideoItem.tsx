"use client";

import type { MouseEvent, ReactElement } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Play, Share2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

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

  const href = `/video/${video.id}?playlist=${playlistId}`;

  const handleQuickShare = async (
    e: MouseEvent<HTMLButtonElement>,
  ): Promise<void> => {
    e.preventDefault();
    e.stopPropagation();
    const fullUrl = `${window.location.origin}${href}`;
    const title = video.title;
    const text =
      video.description !== null && video.description.trim() !== ""
        ? video.description.trim()
        : "";

    if (typeof navigator !== "undefined" && navigator.share !== undefined) {
      try {
        await navigator.share({
          title,
          text,
          url: fullUrl,
        });
      } catch {
        // User canceled — ignore
      }
    } else if (
      typeof navigator !== "undefined" &&
      navigator.clipboard?.writeText !== undefined
    ) {
      try {
        await navigator.clipboard.writeText(fullUrl);
        toast.success("הקישור הועתק ללוח!");
      } catch {
        toast.error("לא ניתן להעתיק את הקישור");
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <article className="flex flex-col gap-4 rounded-xl p-4 transition-colors hover:bg-zinc-100/80 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <Link
          href={href}
          className="group flex min-w-0 flex-1 flex-col gap-6 sm:flex-row sm:items-center"
        >
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
          <div className="relative flex min-w-0 flex-1 flex-col gap-2 pb-1">
            <h3 className="font-heading text-xl font-bold text-zinc-900 group-hover:text-zinc-700">
              {video.title}
            </h3>
            {video.description !== null && video.description.trim() !== "" ? (
              <p className="line-clamp-3 text-sm leading-relaxed text-zinc-600">
                {video.description.trim()}
              </p>
            ) : null}
          </div>
        </Link>

        <div className="flex shrink-0 justify-end sm:pb-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-zinc-500 hover:text-zinc-900"
            aria-label="שיתוף הפרק"
            onClick={(e) => void handleQuickShare(e)}
          >
            <Share2 className="size-4" aria-hidden />
          </Button>
        </div>
      </article>
    </motion.div>
  );
}
