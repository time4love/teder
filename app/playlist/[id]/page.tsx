import { notFound } from "next/navigation";

import { PlaylistVideoItem } from "@/components/feed/PlaylistVideoItem";
import { PageContextBar } from "@/components/layout/PageContextBar";
import { createClient } from "@/utils/supabase/server";

import type { Playlist, Video } from "@/types/database";

type PlaylistVideoRelationRow = {
  position: number;
  videos: Video | Video[] | null;
};

function normalizeVideos(rows: PlaylistVideoRelationRow[] | null): Video[] {
  if (rows === null) return [];
  const out: Video[] = [];
  for (const r of rows) {
    const v = r.videos;
    if (v === null) continue;
    if (Array.isArray(v)) {
      for (const item of v) {
        if (item !== null && typeof item.id === "string") out.push(item);
      }
    } else if (typeof v.id === "string") {
      out.push(v);
    }
  }
  return out;
}

export default async function PlaylistDossierPage({
  params,
}: {
  params: { id: string };
}): Promise<JSX.Element> {
  const { id } = params;
  const supabase = createClient();

  const { data: playlist, error: playlistError } = await supabase
    .from("playlists")
    .select("*")
    .eq("id", id)
    .single();

  if (playlistError !== null) {
    console.error("[playlist/[id]] playlist", playlistError.message);
    notFound();
  }

  if (playlist === null) {
    notFound();
  }

  const pl = playlist as Playlist;

  const { data: relations, error: relationsError } = await supabase
    .from("playlist_videos")
    .select("position, videos(*)")
    .eq("playlist_id", id)
    .order("position", { ascending: true });

  if (relationsError !== null) {
    console.error("[playlist/[id]] playlist_videos", relationsError.message);
  }

  const videos = normalizeVideos(relations as PlaylistVideoRelationRow[] | null);

  return (
    <div className="min-h-screen bg-[#F9F9F7] text-zinc-900" dir="rtl">
      <PageContextBar backHref="/" backText="חזרה לראשי" />
      <main className="mx-auto min-h-screen max-w-5xl px-4 py-12 md:px-8 lg:px-12">
        <header className="mb-16 border-b border-zinc-200 pb-12">
          <h1 className="mb-6 font-heading text-4xl font-bold text-zinc-900 md:text-6xl">
            {pl.title}
          </h1>
          {pl.description !== null && pl.description.trim() !== "" ? (
            <p className="max-w-3xl text-lg leading-relaxed text-zinc-600 md:text-xl">
              {pl.description}
            </p>
          ) : null}
        </header>

        {videos.length === 0 ? (
          <p className="text-center text-zinc-500">
            אין סרטונים בפלייליסט זה עדיין.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {videos.map((v, i) => (
              <PlaylistVideoItem
                key={v.id}
                video={v}
                playlistId={pl.id}
                index={i}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
