import type { FeedRow, Playlist, Video } from "@/types/database";

export interface PlaylistVideoLink {
  video_id: string;
  playlist_id: string;
  position: number;
}

/**
 * Builds feed rows: ordered playlist blocks (horizontal strips), then standalone videos
 * that are not in any playlist. Videos can appear in multiple playlist blocks.
 */
export function buildFeedRows(
  filteredVideos: Video[],
  playlists: Playlist[],
  links: PlaylistVideoLink[],
): FeedRow[] {
  const videoById = new Map(filteredVideos.map((v) => [v.id, v]));
  const filteredIds = new Set(filteredVideos.map((v) => v.id));

  const sortedPlaylists = [...playlists].sort((a, b) => {
    if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
    return a.title.localeCompare(b.title, "he");
  });

  const rows: FeedRow[] = [];

  for (const pl of sortedPlaylists) {
    const vids = links
      .filter((l) => l.playlist_id === pl.id && filteredIds.has(l.video_id))
      .sort((a, b) => a.position - b.position)
      .map((l) => videoById.get(l.video_id))
      .filter((v): v is Video => v !== undefined);

    if (vids.length > 0) {
      rows.push({ kind: "playlist_block", playlist: pl, videos: vids });
    }
  }

  const inAnyPlaylist = new Set(links.map((l) => l.video_id));
  for (const v of filteredVideos) {
    if (!inAnyPlaylist.has(v.id)) {
      rows.push({ kind: "standalone", video: v });
    }
  }

  return rows;
}
