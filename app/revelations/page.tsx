import { PlaylistGrid } from "@/components/feed/PlaylistGrid";
import { HomeHero } from "@/components/home/HomeHero";
import { createPublicClient } from "@/utils/supabase/public";

import type { Metadata } from "next";

import type { Playlist } from "@/types/database";

export const metadata: Metadata = {
  title: "חשיפות אמת",
};

/** Served from cache; admin edits refresh it immediately (see `revalidatePublicPages`). */
export const revalidate = 300;

export default async function RevelationsPage(): Promise<JSX.Element> {
  const supabase = createPublicClient();

  const { data: rows, error } = await supabase
    .from("playlists")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error !== null) {
    console.error("[page] playlists", error.message);
  }

  const playlists = (rows ?? []) as Playlist[];

  return (
    <div className="min-h-screen" dir="rtl">
      <main className="relative z-20 mx-auto max-w-[1600px] px-4 pb-24 md:px-8 lg:px-12">
        <PlaylistGrid playlists={playlists}>
          <HomeHero />
        </PlaylistGrid>
        {playlists.length === 0 ? (
          <p className="mt-8 text-center text-zinc-500">
            לא נמצאו פלייליסטים במערכת.
          </p>
        ) : null}
      </main>
    </div>
  );
}
