import type { Category, Playlist, PlaylistForHome, Video } from "@/types/database";
import { mapPlaylistRows } from "@/lib/mappers/database";
import { createClient } from "@/utils/supabase/server";

/**
 * Primary sort by `sort_order`, then by recency (for feed and admin).
 */
export function sortVideosByOrderAndDate(videos: Video[]): Video[] {
  return [...videos].sort((a, b) => {
    if (a.sort_order !== b.sort_order) {
      return a.sort_order - b.sort_order;
    }
    return (
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  });
}

export function sortCategoriesByOrder(cats: Category[]): Category[] {
  return [...cats].sort((a, b) =>
    a.sort_order !== b.sort_order
      ? a.sort_order - b.sort_order
      : a.name.localeCompare(b.name, "he"),
  );
}

export function sortPlaylistsByOrder(pl: Playlist[]): Playlist[] {
  return [...pl].sort((a, b) =>
    a.sort_order !== b.sort_order
      ? a.sort_order - b.sort_order
      : a.title.localeCompare(b.title, "he"),
  );
}

export type FetchPlaylistsForHomeOptions = {
  /** When set, only playlists that contain at least one video in this category. */
  categoryId?: string | null;
};

/**
 * Loads playlists for the magazine home grid: `sort_order` ASC, with per-playlist video counts.
 * Optionally restricts to playlists that include at least one video in the given category.
 */
export async function fetchPlaylistsForHome(
  options?: FetchPlaylistsForHomeOptions,
): Promise<PlaylistForHome[]> {
  const supabase = createClient();
  const categoryId = options?.categoryId;

  let allowedPlaylistIds: Set<string> | null = null;

  if (categoryId !== undefined && categoryId !== null && categoryId !== "") {
    const { data: videoRows, error: vidErr } = await supabase
      .from("videos")
      .select("id")
      .eq("category_id", categoryId);

    if (vidErr !== null) {
      console.error("[fetchPlaylistsForHome] videos", vidErr.message);
      return [];
    }

    const videoIds = (videoRows ?? []).map((r) => r.id);
    if (videoIds.length === 0) {
      return [];
    }

    const { data: linkRows, error: linkErr } = await supabase
      .from("playlist_videos")
      .select("playlist_id")
      .in("video_id", videoIds);

    if (linkErr !== null) {
      console.error("[fetchPlaylistsForHome] playlist_videos", linkErr.message);
      return [];
    }

    allowedPlaylistIds = new Set(
      (linkRows ?? []).map((r) => r.playlist_id as string),
    );
    if (allowedPlaylistIds.size === 0) {
      return [];
    }
  }

  const { data: playlistsRaw, error: plErr } = await supabase
    .from("playlists")
    .select("*")
    .order("sort_order", { ascending: true });

  if (plErr !== null) {
    console.error("[fetchPlaylistsForHome] playlists", plErr.message);
    return [];
  }

  const playlists = sortPlaylistsByOrder(mapPlaylistRows(playlistsRaw));

  const { data: pvRaw, error: pvErr } = await supabase
    .from("playlist_videos")
    .select("playlist_id");

  if (pvErr !== null) {
    console.error("[fetchPlaylistsForHome] playlist_videos count", pvErr.message);
  }

  const countByPlaylist: Record<string, number> = {};
  for (const row of pvRaw ?? []) {
    const pid = row.playlist_id as string;
    countByPlaylist[pid] = (countByPlaylist[pid] ?? 0) + 1;
  }

  const withCounts: PlaylistForHome[] = playlists.map((p) => ({
    ...p,
    video_count: countByPlaylist[p.id] ?? 0,
  }));

  if (allowedPlaylistIds === null) {
    return withCounts;
  }

  return withCounts.filter((p) => allowedPlaylistIds!.has(p.id));
}

/**
 * Returns videos for an optional category slug; unknown slug yields an empty list.
 */
export function filterVideosByCategorySlug(
  videos: Video[],
  categories: Category[],
  categorySlug: string | undefined,
): Video[] {
  if (categorySlug === undefined || categorySlug === "") {
    return videos;
  }
  const match = categories.find((c) => c.slug === categorySlug);
  if (match === undefined) {
    return [];
  }
  return videos.filter((v) => v.category_id === match.id);
}

/**
 * Builds `video_id` → ordered playlist titles from flat link rows and a title lookup.
 */
export function buildPlaylistTitlesByVideoId(
  links: { video_id: string; playlist_id: string; position: number }[],
  playlistTitleById: Record<string, string>,
): Record<string, string[]> {
  const sorted = [...links].sort((a, b) => {
    if (a.video_id !== b.video_id) return a.video_id.localeCompare(b.video_id);
    return a.position - b.position;
  });
  const out: Record<string, string[]> = {};
  for (const row of sorted) {
    const title = playlistTitleById[row.playlist_id];
    if (title === undefined) continue;
    if (out[row.video_id] === undefined) {
      out[row.video_id] = [];
    }
    out[row.video_id].push(title);
  }
  return out;
}
