import { PlaylistGrid } from "@/components/feed/PlaylistGrid";
import { HomeHero } from "@/components/home/HomeHero";
import { createClient } from "@/utils/supabase/server";

import type { Playlist } from "@/types/database";

export default async function Home(): Promise<JSX.Element> {
  const supabase = createClient();

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
