"use client";

import type { ReactElement, ReactNode } from "react";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { PlaylistCard } from "@/components/feed/PlaylistCard";
import { cn } from "@/lib/utils";

import type { Playlist } from "@/types/database";

function firstPlaylistCoverUrl(playlists: Playlist[]): string | null {
  for (const p of playlists) {
    const u = p.cover_image_url?.trim();
    if (u !== undefined && u !== "") return u;
  }
  return null;
}

export interface PlaylistGridProps {
  playlists: Playlist[];
  children?: ReactNode;
}

/**
 * Magazine grid with a fixed, blurred ambient background: logo at rest, then playlist covers on focus / scroll.
 */
export function PlaylistGrid({
  playlists,
  children,
}: PlaylistGridProps): ReactElement {
  const [scrolledImage, setScrolledImage] = useState<string | null>(
    "/logo.png",
  );

  const handleHeroLeave = (): void => {
    const cover = firstPlaylistCoverUrl(playlists);
    setScrolledImage(cover ?? "/logo.png");
  };

  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[#F9F9F7]" />
        <AnimatePresence>
          {scrolledImage !== null ? (
            <motion.img
              key={scrolledImage}
              src={scrolledImage}
              alt=""
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.25 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
              className={cn(
                "absolute inset-0 h-full w-full scale-150 object-center saturate-150 blur-[100px]",
                scrolledImage === "/logo.png"
                  ? "object-contain"
                  : "object-cover",
              )}
            />
          ) : null}
        </AnimatePresence>
      </div>

      {children !== undefined && children !== null ? (
        <motion.div
          onViewportEnter={() => setScrolledImage("/logo.png")}
          onViewportLeave={handleHeroLeave}
          viewport={{ amount: 0.1, margin: "0px" }}
        >
          {children}
        </motion.div>
      ) : null}

      <div className="grid grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {playlists.map((p, i) => (
          <PlaylistCard
            key={p.id}
            playlist={p}
            index={i}
            onFocus={() => {
              const u = p.cover_image_url?.trim();
              setScrolledImage(
                u !== undefined && u !== "" ? u : "/placeholder.jpg",
              );
            }}
          />
        ))}
      </div>
    </>
  );
}
