export interface Category {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
}

export interface Playlist {
  id: string;
  title: string;
  description: string | null;
  sort_order: number;
  cover_image_url?: string | null;
}

/** Home grid: playlist row plus optional video count from aggregation. */
export type PlaylistForHome = Playlist & {
  video_count: number;
};

/** Junction: a video in a playlist with display order inside that playlist. */
export interface PlaylistVideo {
  playlist_id: string;
  video_id: string;
  position: number;
}

/** Minimal playlist info when nested on a video (e.g. API hydration). */
export type VideoPlaylistRef = Pick<Playlist, "id" | "title">;

export interface Video {
  id: string;
  title: string;
  description: string | null;
  youtube_url: string;
  cover_image_url: string | null;
  category_id: string | null;
  /** Lower values appear first in the feed. */
  sort_order: number;
  created_at: string;
  /** Optional: playlists that include this video (e.g. joined selects). */
  playlists?: VideoPlaylistRef[];
}

/** Loaded for admin video form (edit) with current playlist memberships. */
export type VideoWithPlaylists = Video & { playlist_ids: string[] };

/** Vertical feed: full-screen standalone video, or a horizontal playlist strip. */
export type FeedRow =
  | { kind: "standalone"; video: Video }
  | { kind: "playlist_block"; playlist: Playlist; videos: Video[] };
