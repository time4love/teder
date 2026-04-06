"use client";

import { PlaylistBlockRow } from "@/components/feed/PlaylistBlockRow";
import { VideoCard } from "@/components/feed/VideoCard";
import {
  FEED_EMPTY_MIN_HEIGHT_CLASS,
  FEED_TOP_PADDING_CLASS,
} from "@/constants/layout";
import type { FeedRow } from "@/types/database";

export interface VideoFeedProps {
  rows: FeedRow[];
  /** For standalone cards: playlist name chips (videos inside playlist blocks omit chips). */
  playlistTitlesByVideoId: Record<string, string[]>;
}

export function VideoFeed({
  rows,
  playlistTitlesByVideoId,
}: VideoFeedProps) {
  return (
    <main
      className={`fixed inset-0 z-0 h-[100dvh] w-full snap-y snap-mandatory overflow-y-scroll overscroll-y-contain bg-black ${FEED_TOP_PADDING_CLASS}`}
    >
      {rows.length === 0 ? (
        <div
          className={`flex ${FEED_EMPTY_MIN_HEIGHT_CLASS} items-center justify-center px-6 text-center text-white/70`}
        >
          אין סרטונים להצגה בקטגוריה זו.
        </div>
      ) : (
        rows.map((row) => {
          if (row.kind === "playlist_block") {
            return (
              <PlaylistBlockRow
                key={row.playlist.id}
                playlist={row.playlist}
                videos={row.videos}
              />
            );
          }
          const titles = playlistTitlesByVideoId[row.video.id] ?? [];
          return (
            <VideoCard
              key={row.video.id}
              video={row.video}
              playlistTitles={titles}
            />
          );
        })
      )}
    </main>
  );
}
