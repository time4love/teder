import type { Metadata } from "next";

import { RevelationsArchive } from "@/components/revelations/RevelationsArchive";
import { buildArchive } from "@/lib/archive";
import type { PlaylistVideoLink } from "@/lib/archive";
import { createPublicClient } from "@/utils/supabase/public";

import type { Category, Playlist } from "@/types/database";

export const metadata: Metadata = {
  title: "חשיפות אמת",
};

/** Served from cache; admin edits refresh it immediately (see `revalidatePublicPages`). */
export const revalidate = 300;

type LinkRow = {
  playlist_id: string;
  position: number;
  videos:
    | { title: string; category_id: string | null }
    | { title: string; category_id: string | null }[]
    | null;
};

export default async function RevelationsPage(): Promise<JSX.Element> {
  const supabase = createPublicClient();

  const [playlistsRes, categoriesRes, linksRes] = await Promise.all([
    supabase.from("playlists").select("*").order("sort_order", { ascending: true }),
    supabase.from("categories").select("*").order("sort_order", { ascending: true }),
    supabase.from("playlist_videos").select("playlist_id, position, videos(title, category_id)"),
  ]);

  for (const [name, res] of [
    ["playlists", playlistsRes],
    ["categories", categoriesRes],
    ["playlist_videos", linksRes],
  ] as const) {
    if (res.error !== null) console.error(`[revelations] ${name}`, res.error.message);
  }

  const links: PlaylistVideoLink[] = ((linksRes.data ?? []) as LinkRow[]).map((r) => ({
    playlist_id: r.playlist_id,
    position: r.position,
    video: Array.isArray(r.videos) ? (r.videos[0] ?? null) : r.videos,
  }));

  const categories = buildArchive(
    (playlistsRes.data ?? []) as Playlist[],
    (categoriesRes.data ?? []) as Category[],
    links,
  );

  return (
    <main dir="rtl">
      <RevelationsArchive categories={categories} />
    </main>
  );
}
