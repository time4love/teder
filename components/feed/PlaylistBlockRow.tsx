"use client";

import { VideoCard } from "@/components/feed/VideoCard";
import { PLAYLIST_STICKY_HEADER_TOP_CLASS } from "@/constants/layout";
import type { Playlist, Video } from "@/types/database";

export interface PlaylistBlockRowProps {
  playlist: Playlist;
  videos: Video[];
}

/**
 * Horizontal RTL strip of full-height video cards for one playlist.
 */
export function PlaylistBlockRow({ playlist, videos }: PlaylistBlockRowProps) {
  return (
    <section
      className="flex w-full snap-start flex-col border-b border-zinc-900 bg-black"
      dir="rtl"
      aria-label={playlist.title}
    >
      <div
        className={`sticky ${PLAYLIST_STICKY_HEADER_TOP_CLASS} z-10 border-b border-zinc-800 bg-black/95 px-4 py-3 backdrop-blur-sm`}
      >
        <h2 className="text-lg font-semibold tracking-tight text-white">
          {playlist.title}
        </h2>
        {playlist.description !== null && playlist.description.trim() !== "" && (
          <p className="mt-1 text-sm text-zinc-400">{playlist.description}</p>
        )}
      </div>
      <div
        className="flex w-full snap-x snap-mandatory gap-0 overflow-x-auto overflow-y-hidden overscroll-x-contain pb-2 pt-1"
        style={{ scrollbarGutter: "stable" }}
      >
        {videos.map((video) => (
          <div
            key={`${playlist.id}-${video.id}`}
            className="w-[100vw] min-w-[100vw] max-w-[100vw] shrink-0 snap-center sm:w-[min(100vw,480px)] sm:min-w-[min(100vw,480px)] sm:max-w-[min(100vw,480px)]"
          >
            <VideoCard
              video={video}
              hidePlaylistChips
              variant="strip"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
