export interface Category {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
}

export interface Series {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
}

export interface Video {
  id: string;
  title: string;
  description: string | null;
  youtube_url: string;
  cover_image_url: string | null;
  category_id: string | null;
  series_id: string | null;
  episode_number: number | null;
  created_at: string;
}

export type FeedRow =
  | { kind: "standalone"; video: Video }
  | { kind: "series"; seriesId: string; episodes: Video[] };
