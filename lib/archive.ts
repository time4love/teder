/**
 * The חשיפות אמת archive: playlists grouped into categories.
 *
 * Categories are stored on videos, not playlists, so a playlist takes the category most of
 * its videos carry. Playlists whose videos have no category are grouped under "נוספים".
 */

import { getYouTubeVideoId } from "@/utils/youtube";

import type { Category, Playlist } from "@/types/database";

/** One playlist ↔ video link with the fields the archive needs from the video. */
export interface PlaylistVideoLink {
  playlist_id: string;
  position: number;
  video: { title: string; category_id: string | null } | null;
}

export interface ArchivePlaylist {
  id: string;
  title: string;
  subtitle: string | null;
  cover: string;
  episodeCount: number;
  /** Titles of the first few episodes, in playlist order. */
  firstEpisodes: string[];
}

export interface ArchiveCategory {
  id: string;
  name: string;
  /** Accent color, as `r, g, b` for use in `rgb()` / `rgba()`. */
  rgb: string;
  playlists: ArchivePlaylist[];
}

/** Accent colors for categories, in order — shades that sit with the gate's violet. */
const CATEGORY_COLORS = [
  "155, 140, 255",
  "255, 122, 168",
  "94, 200, 255",
  "255, 196, 110",
  "120, 220, 170",
  "200, 150, 255",
];

/** Neutral accent for playlists without a category. */
const UNCATEGORIZED_RGB = "185, 180, 215";

/**
 * A category's accent color — stable across pages: categories are ordered by creation
 * (their slugs carry a timestamp) and take the palette in that order.
 */
export function categoryColor(categoryId: string | null, categories: Category[]): string {
  if (categoryId === null) return UNCATEGORIZED_RGB;
  const ordered = [...categories].sort((a, b) => a.slug.localeCompare(b.slug));
  const i = ordered.findIndex((c) => c.id === categoryId);
  return i < 0 ? UNCATEGORIZED_RGB : CATEGORY_COLORS[i % CATEGORY_COLORS.length];
}

/** A video's thumbnail: its own cover, else YouTube's, else the site placeholder. */
export function videoThumb(video: { cover_image_url: string | null; youtube_url: string }): string {
  const own = video.cover_image_url?.trim();
  if (own !== undefined && own !== "") return own;
  const yt = getYouTubeVideoId(video.youtube_url);
  return yt !== null ? `https://i.ytimg.com/vi/${yt}/hqdefault.jpg` : "/placeholder.jpg";
}

const UNCATEGORIZED_ID = "uncategorized";
const UNCATEGORIZED_NAME = "נוספים";
const PREVIEW_EPISODES = 3;

function coverOf(p: Playlist): string {
  const u = p.cover_image_url?.trim();
  return u !== undefined && u !== "" ? u : "/placeholder.jpg";
}

/** The category most of the playlist's videos carry, or null when none have one. */
export function dominantCategory(
  links: { video: { category_id: string | null } | null }[],
): string | null {
  const counts = new Map<string, number>();
  for (const l of links) {
    const id = l.video?.category_id;
    if (id) counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  let best: string | null = null;
  let bestCount = 0;
  for (const [id, n] of Array.from(counts)) {
    if (n > bestCount) {
      best = id;
      bestCount = n;
    }
  }
  return best;
}

/**
 * Groups playlists (already in display order) into categories. Categories appear in the
 * order of their first playlist, so the author's playlist ordering carries over.
 */
export function buildArchive(
  playlists: Playlist[],
  categories: Category[],
  links: PlaylistVideoLink[],
): ArchiveCategory[] {
  const linksByPlaylist = new Map<string, PlaylistVideoLink[]>();
  for (const l of links) {
    const list = linksByPlaylist.get(l.playlist_id) ?? [];
    list.push(l);
    linksByPlaylist.set(l.playlist_id, list);
  }
  const names = new Map(categories.map((c) => [c.id, c.name]));

  const groups = new Map<string, ArchiveCategory>();
  for (const p of playlists) {
    const own = (linksByPlaylist.get(p.id) ?? []).sort((a, b) => a.position - b.position);
    const catId = dominantCategory(own);
    const key = catId !== null && names.has(catId) ? catId : UNCATEGORIZED_ID;
    if (!groups.has(key)) {
      groups.set(key, {
        id: key,
        name: key === UNCATEGORIZED_ID ? UNCATEGORIZED_NAME : (names.get(key) ?? UNCATEGORIZED_NAME),
        rgb: "",
        playlists: [],
      });
    }
    const subtitle = typeof p.subtitle === "string" && p.subtitle.trim() !== "" ? p.subtitle.trim() : null;
    groups.get(key)?.playlists.push({
      id: p.id,
      title: p.title,
      subtitle,
      cover: coverOf(p),
      episodeCount: own.length,
      firstEpisodes: own
        .slice(0, PREVIEW_EPISODES)
        .map((l) => l.video?.title.trim() ?? "")
        .filter((t) => t !== ""),
    });
  }

  return Array.from(groups.values()).map((g) => ({
    ...g,
    rgb: categoryColor(g.id === UNCATEGORIZED_ID ? null : g.id, categories),
  }));
}
