"use client";

import { useEffect, useRef, useState } from "react";
import { VideoCard } from "@/components/feed/VideoCard";
import type { FeedRow } from "@/types/database";

export interface VideoFeedProps {
  rows: FeedRow[];
  seriesTitles: Record<string, string>;
}

function SeriesRow({
  row,
  seriesTitle,
}: {
  row: Extract<FeedRow, { kind: "series" }>;
  seriesTitle: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const n = row.episodes.length;

  useEffect(() => {
    const root = scrollRef.current;
    if (!root || n === 0) return;

    const slides = root.querySelectorAll<HTMLElement>("[data-episode-slide]");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const ratio = entry.intersectionRatio;
          if (ratio < 0.55) return;
          const el = entry.target;
          if (!(el instanceof HTMLElement)) return;
          const idx = Number(el.dataset.index);
          if (!Number.isNaN(idx)) {
            setActiveIndex(idx);
          }
        });
      },
      { root, rootMargin: "0px", threshold: [0.55, 0.65, 0.75] },
    );

    slides.forEach((slide) => observer.observe(slide));
    return () => observer.disconnect();
  }, [n, row.seriesId]);

  return (
    <div className="relative h-[100dvh] w-full snap-start snap-always">
      <div
        ref={scrollRef}
        dir="rtl"
        className="flex h-full w-full overflow-x-scroll overflow-y-hidden overscroll-x-contain snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {row.episodes.map((episode, index) => (
          <div
            key={episode.id}
            data-episode-slide
            data-index={index}
            className="h-full min-w-full shrink-0"
          >
            <VideoCard
              video={episode}
              seriesTitle={seriesTitle}
              episodeCount={n}
            />
          </div>
        ))}
      </div>
      <div
        className="pointer-events-none absolute bottom-28 left-0 right-0 z-20 flex justify-center gap-2"
        aria-hidden
      >
        {Array.from({ length: n }).map((_, i) => (
          <span
            key={`${row.seriesId}-dot-${i}`}
            className={`h-2 w-2 rounded-full transition-colors ${
              i === activeIndex ? "bg-white" : "bg-white/30"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export function VideoFeed({ rows, seriesTitles }: VideoFeedProps) {
  return (
    <main className="fixed inset-0 z-0 h-[100dvh] w-full overflow-y-scroll overscroll-y-contain snap-y snap-mandatory bg-black pt-[4.75rem]">
      {rows.length === 0 ? (
        <div className="flex h-[calc(100dvh-4.75rem)] items-center justify-center px-6 text-center text-white/70">
          אין סרטונים להצגה בקטגוריה זו.
        </div>
      ) : (
        rows.map((row) => {
          if (row.kind === "standalone") {
            return <VideoCard key={row.video.id} video={row.video} />;
          }

          const title =
            seriesTitles[row.seriesId] !== undefined &&
            seriesTitles[row.seriesId] !== ""
              ? seriesTitles[row.seriesId]
              : "סדרה";

          return (
            <SeriesRow
              key={row.seriesId}
              row={row}
              seriesTitle={title}
            />
          );
        })
      )}
    </main>
  );
}
