import { PlaylistCard } from "@/components/feed/PlaylistCard";
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
    <div className="min-h-screen bg-[#F9F9F7]" dir="rtl">
      <HomeHero />
      <main className="relative z-20 mx-auto max-w-7xl px-4 pb-24 md:px-8 lg:px-12 xl:px-24">
        {playlists.length === 0 ? (
          <p className="text-zinc-500">לא נמצאו פלייליסטים במערכת.</p>
        ) : (
          <div className="grid grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {playlists.map((p, index) => (
              <PlaylistCard key={p.id} playlist={p} index={index} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
