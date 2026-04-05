import type { Category, FeedRow, Series, Video } from "@/types/database";

const categoryHealthId = "11111111-1111-1111-1111-111111111101";
const categoryHistoryId = "11111111-1111-1111-1111-111111111102";

const seriesAId = "22222222-2222-2222-2222-222222222201";

export const mockCategories: Category[] = [
  {
    id: categoryHealthId,
    name: "בריאות",
    slug: "health",
    sort_order: 1,
  },
  {
    id: categoryHistoryId,
    name: "היסטוריה",
    slug: "history",
    sort_order: 2,
  },
];

export const mockSeries: Series[] = [
  {
    id: seriesAId,
    title: "עת לאהוב — סיפור המסע",
    description: "שלושה פרקים המתארים את דרכנו.",
    cover_image_url:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80",
  },
];

/** סדר הופעה בפיד: סרטון עצמאי → שלושת פרקי הסדרה → סרטון עצמאי נוסף */
export const mockVideos: Video[] = [
  {
    id: "33333333-3333-3333-3333-333333333301",
    title: "עדות עצמאית — פתיחה",
    description: "סרטון בודד ללא שיוך לסדרה.",
    youtube_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    cover_image_url:
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&q=80",
    category_id: categoryHealthId,
    series_id: null,
    episode_number: null,
    created_at: "2026-01-01T10:00:00.000Z",
  },
  {
    id: "33333333-3333-3333-3333-333333333302",
    title: "פרק 1 — הבית הראשון",
    description: "תחילת הסיפור.",
    youtube_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    cover_image_url:
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200&q=80",
    category_id: categoryHistoryId,
    series_id: seriesAId,
    episode_number: 1,
    created_at: "2026-01-02T10:00:00.000Z",
  },
  {
    id: "33333333-3333-3333-3333-333333333303",
    title: "פרק 2 — הדרך",
    description: "המשך המסע.",
    youtube_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    cover_image_url:
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&q=80",
    category_id: categoryHistoryId,
    series_id: seriesAId,
    episode_number: 2,
    created_at: "2026-01-03T10:00:00.000Z",
  },
  {
    id: "33333333-3333-3333-3333-333333333304",
    title: "פרק 3 — חזרה הביתה",
    description: "סיום הסדרה.",
    youtube_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    cover_image_url:
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200&q=80",
    category_id: categoryHistoryId,
    series_id: seriesAId,
    episode_number: 3,
    created_at: "2026-01-04T10:00:00.000Z",
  },
  {
    id: "33333333-3333-3333-3333-333333333305",
    title: "עדות שנייה — סגירה",
    description: "סרטון עצמאי נוסף אחרי הסדרה.",
    youtube_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    cover_image_url:
      "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1200&q=80",
    category_id: categoryHealthId,
    series_id: null,
    episode_number: null,
    created_at: "2026-01-05T10:00:00.000Z",
  },
];

export function getSeriesTitle(seriesId: string): string | undefined {
  return mockSeries.find((s) => s.id === seriesId)?.title;
}

/**
 * קיבוץ רציף לפי סדר המערך: סרטונים עם אותו series_id נכנסים לבלוק אופקי אחד.
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
