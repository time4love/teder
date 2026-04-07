"use client";

import type { ReactElement } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

import type { Playlist } from "@/types/database";

export interface PlaylistCardProps {
  playlist: Pick<
    Playlist,
    "id" | "title" | "subtitle" | "description" | "cover_image_url"
  >;
  index: number;
  onFocus?: () => void;
}

/**
 * Editorial portrait card linking to the playlist dossier page.
 */
export function PlaylistCard({
  playlist,
  index,
  onFocus,
}: PlaylistCardProps): ReactElement {
  const cover = playlist.cover_image_url?.trim();
  const src =
    cover !== undefined && cover !== "" ? cover : "/placeholder.jpg";

  const subtitle =
    typeof playlist.subtitle === "string" && playlist.subtitle.trim() !== ""
      ? playlist.subtitle.trim()
      : null;

  return (
    <Link
      href={`/playlist/${playlist.id}`}
      className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F9F9F7]"
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{
          once: true,
          amount: 0.5,
          margin: "0px 0px -20% 0px",
        }}
        onMouseEnter={() => onFocus?.()}
        onViewportEnter={() => onFocus?.()}
        whileHover={{
          y: -8,
          transition: { duration: 0.4, ease: "easeOut", delay: 0 },
        }}
        transition={{
          duration: 0.6,
          delay: index * 0.1,
          ease: [0.21, 0.47, 0.32, 0.98],
        }}
        className="flex flex-col gap-4"
      >
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-md bg-zinc-200 shadow-sm transition-shadow duration-500 group-hover:shadow-xl">
          {/* eslint-disable-next-line @next/next/no-img-element -- editorial URLs may be external */}
          <img
            src={src}
            alt=""
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 pb-5 pt-28 sm:px-4 sm:pb-6 sm:pt-32">
            <h2 className="font-heading text-4xl font-bold leading-[1.1] tracking-tight text-white drop-shadow-md sm:text-4xl md:text-5xl lg:text-5xl 2xl:text-6xl">
              {playlist.title}
            </h2>
            {subtitle !== null ? (
              <h3 className="mt-2 text-lg font-medium leading-snug text-white/90 drop-shadow-md sm:text-xl md:text-2xl">
                {subtitle}
              </h3>
            ) : null}
          </div>
        </div>

        {playlist.description !== null && playlist.description.trim() !== "" ? (
          <p className="text-start line-clamp-2 text-sm leading-relaxed text-zinc-500 md:text-base lg:text-lg">
            {playlist.description.trim()}
          </p>
        ) : null}
      </motion.div>
    </Link>
  );
}
