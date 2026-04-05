"use client";

import { useMemo } from "react";
import { VideoCard } from "@/components/feed/VideoCard";
import { getSeriesTitle, groupVideosForFeed, mockVideos } from "@/utils/mockData";

export function VideoFeed() {
  const rows = useMemo(() => groupVideosForFeed(mockVideos), []);

  return (
    <main className="fixed inset-0 z-0 h-[100dvh] w-full overflow-y-scroll overscroll-y-contain snap-y snap-mandatory bg-black">
      {rows.map((row) => {
        if (row.kind === "standalone") {
          return (
            <VideoCard key={row.video.id} video={row.video} />
          );
        }

        const seriesTitle = getSeriesTitle(row.seriesId) ?? "סדרה";
        const n = row.episodes.length;

        return (
          <div
            key={row.seriesId}
            dir="rtl"
            className="flex h-[100dvh] w-full snap-start snap-always overflow-x-scroll overflow-y-hidden overscroll-x-contain snap-x snap-mandatory"
          >
            {row.episodes.map((episode) => (
              <VideoCard
                key={episode.id}
                video={episode}
                seriesTitle={seriesTitle}
                episodeCount={n}
              />
            ))}
          </div>
        );
      })}
    </main>
  );
}
