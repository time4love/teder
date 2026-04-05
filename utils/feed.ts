import type { FeedRow, Video } from "@/types/database";

/**
 * Groups a flat list of videos into vertical feed rows: standalone slides and
 * consecutive horizontal series blocks (same `series_id`).
 */
export function groupVideosForFeed(videos: Video[]): FeedRow[] {
  const rows: FeedRow[] = [];
  let i = 0;
  while (i < videos.length) {
    const v = videos[i];
    if (v.series_id === null) {
      rows.push({ kind: "standalone", video: v });
      i += 1;
      continue;
    }
    const seriesId = v.series_id;
    const episodes: Video[] = [];
    while (i < videos.length && videos[i].series_id === seriesId) {
      episodes.push(videos[i]);
      i += 1;
    }
    episodes.sort(
      (a, b) => (a.episode_number ?? 0) - (b.episode_number ?? 0),
    );
    rows.push({ kind: "series", seriesId, episodes });
  }
  return rows;
}
