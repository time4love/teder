"use client";

import type { ReactElement, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { PlaylistCard } from "@/components/feed/PlaylistCard";
import { cn } from "@/lib/utils";

import type { Playlist } from "@/types/database";

/** Same cover URL logic as {@link PlaylistCard} — one source of truth per playlist row. */
function playlistCoverSrc(playlist: Playlist): string {
  const u = playlist.cover_image_url?.trim();
  return u !== undefined && u !== "" ? u : "/placeholder.jpg";
}

export interface PlaylistGridProps {
  playlists: Playlist[];
  children?: ReactNode;
}

/** Delay before crossfading ambient from logo → first playlist cover (ms). */
const AMBIENT_INTRO_DELAY_MS = 4000;

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
  /** User hovered a card — skip the automatic intro fade to first cover. */
  const ambientTouchedByUserRef = useRef(false);

  useEffect(() => {
    if (playlists.length === 0) return;

    const id = window.setTimeout(() => {
      if (ambientTouchedByUserRef.current) return;
      // Match the first grid card (`playlists[0]`), not "first playlist that has any cover"
      setScrolledImage(playlistCoverSrc(playlists[0]));
    }, AMBIENT_INTRO_DELAY_MS);

    return () => window.clearTimeout(id);
  }, [playlists]);

  const handleHeroLeave = (): void => {
    if (playlists.length === 0) return;
    setScrolledImage(playlistCoverSrc(playlists[0]));
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
              animate={{
                opacity: scrolledImage === "/logo.png" ? 0.28 : 0.45,
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: [0.4, 0, 0.2, 1] }}
              className={cn(
                "absolute inset-0 h-full w-full scale-150 object-center saturate-[1.35] blur-[72px] sm:blur-[80px]",
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

      <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 md:gap-x-10 md:gap-y-16 2xl:grid-cols-4">
        {playlists.map((p, i) => (
          <PlaylistCard
            key={p.id}
            playlist={p}
            index={i}
            onFocus={() => {
              ambientTouchedByUserRef.current = true;
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
