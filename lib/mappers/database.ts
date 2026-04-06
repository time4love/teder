import type { Category, Playlist, Video } from "@/types/database";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Maps a Supabase `categories` row to {@link Category}, or `null` if invalid.
 */
export function mapCategoryRow(row: unknown): Category | null {
  if (!isRecord(row)) return null;
  const id = row.id;
  const name = row.name;
  const slug = row.slug;
  const sort_order = row.sort_order;
  if (typeof id !== "string" || typeof name !== "string" || typeof slug !== "string") {
    return null;
  }
  return {
    id,
    name,
    slug,
    sort_order: typeof sort_order === "number" ? sort_order : 0,
  };
}

/**
 * Maps a Supabase `playlists` row to {@link Playlist}, or `null` if invalid.
 */
export function mapPlaylistRow(row: unknown): Playlist | null {
  if (!isRecord(row)) return null;
  const id = row.id;
  const title = row.title;
  if (typeof id !== "string" || typeof title !== "string") return null;
  return {
    id,
    title,
    description: typeof row.description === "string" ? row.description : null,
    sort_order: typeof row.sort_order === "number" ? row.sort_order : 0,
    cover_image_url:
      typeof row.cover_image_url === "string" ? row.cover_image_url : null,
  };
}

/**
 * Maps a Supabase `videos` row to {@link Video}, or `null` if invalid.
 */
export function mapVideoRow(row: unknown): Video | null {
  if (!isRecord(row)) return null;
  const id = row.id;
  const title = row.title;
  const youtube_url = row.youtube_url;
  if (typeof id !== "string" || typeof title !== "string" || typeof youtube_url !== "string") {
    return null;
  }
  const created_at = row.created_at;
  const sortRaw = row.sort_order;
  return {
    id,
    title,
    description: typeof row.description === "string" ? row.description : null,
    youtube_url,
    cover_image_url:
      typeof row.cover_image_url === "string" ? row.cover_image_url : null,
    category_id: typeof row.category_id === "string" ? row.category_id : null,
    sort_order: typeof sortRaw === "number" && Number.isFinite(sortRaw) ? sortRaw : 0,
    created_at:
      typeof created_at === "string"
        ? created_at
        : new Date().toISOString(),
  };
}

/**
 * Maps Supabase select results, skipping invalid rows.
 */
export function mapCategoryRows(rows: unknown): Category[] {
  if (!Array.isArray(rows)) return [];
  return rows.map(mapCategoryRow).filter((c): c is Category => c !== null);
}

export function mapPlaylistRows(rows: unknown): Playlist[] {
  if (!Array.isArray(rows)) return [];
  return rows.map(mapPlaylistRow).filter((p): p is Playlist => p !== null);
}

export function mapVideoRows(rows: unknown): Video[] {
  if (!Array.isArray(rows)) return [];
  return rows.map(mapVideoRow).filter((v): v is Video => v !== null);
}

/** Maps `playlist_videos` join rows for feed labeling. */
export function mapPlaylistVideoLinkRows(
  rows: unknown,
): { video_id: string; playlist_id: string; position: number }[] {
  if (!Array.isArray(rows)) return [];
  const out: { video_id: string; playlist_id: string; position: number }[] = [];
  for (const row of rows) {
    if (!isRecord(row)) continue;
    const video_id = row.video_id;
    const playlist_id = row.playlist_id;
    const position = row.position;
    if (
      typeof video_id === "string" &&
      typeof playlist_id === "string" &&
      typeof position === "number"
    ) {
      out.push({ video_id, playlist_id, position });
    }
  }
  return out;
}
