import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PlaylistVideoItem } from "@/components/feed/PlaylistVideoItem";
import { PageContextBar } from "@/components/layout/PageContextBar";
import { ShareButton } from "@/components/shared/ShareButton";
import { SITE_ORIGIN } from "@/lib/site";
import { createClient } from "@/utils/supabase/server";

import type { Playlist, Video } from "@/types/database";

type PlaylistVideoRelationRow = {
  position: number;
  videos: Video | Video[] | null;
};

const DEFAULT_DESCRIPTION =
  "ארכיון חשיפות, עדויות דוקומנטריות וחיפוש בלתי מתפשר אחר האמת.";

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

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const supabase = createClient();
  const { data: playlist, error } = await supabase
    .from("playlists")
    .select("title, description, cover_image_url")
    .eq("id", params.id)
    .maybeSingle();

  if (error !== null || playlist === null) {
    return { title: "פלייליסט" };
  }

  const p = playlist as Pick<
    Playlist,
    "title" | "description" | "cover_image_url"
  >;
  const description =
    p.description !== null && p.description.trim() !== ""
      ? p.description.trim()
      : DEFAULT_DESCRIPTION;
  const cover = p.cover_image_url?.trim();
  const images =
    cover !== undefined && cover !== ""
      ? [{ url: cover, alt: p.title }]
      : [{ url: "/logo.png", alt: p.title }];

  return {
    title: p.title,
    description,
    openGraph: {
      title: p.title,
      description,
      type: "website",
      locale: "he_IL",
      siteName: "תדר-ישר-אל",
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: p.title,
      description,
      images: images.map((i) => i.url),
    },
  };
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
    .order("position", { ascending: true })
    .order("video_id", { ascending: true });

  if (relationsError !== null) {
    console.error("[playlist/[id]] playlist_videos", relationsError.message);
  }

  const videos = normalizeVideos(relations as PlaylistVideoRelationRow[] | null);

  const shareText =
    pl.description !== null && pl.description.trim() !== ""
      ? pl.description.trim()
      : DEFAULT_DESCRIPTION;

  const subtitleTrimmed =
    typeof pl.subtitle === "string" ? pl.subtitle.trim() : "";
  const hasSubtitle = subtitleTrimmed !== "";

  return (
    <div className="min-h-screen bg-[#F9F9F7] text-zinc-900" dir="rtl">
      <PageContextBar backHref="/" backText="חזרה לראשי" />
      <main className="mx-auto min-h-screen max-w-5xl px-4 py-12 md:px-8 lg:px-12">
        <header className="mb-16 border-b border-zinc-200 pb-12">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
            <div className="min-w-0 flex-1">
              <h1
                className={
                  hasSubtitle
                    ? "mb-2 font-heading text-4xl font-bold text-zinc-900 md:text-6xl"
                    : "mb-6 font-heading text-4xl font-bold text-zinc-900 md:text-6xl"
                }
              >
                {pl.title}
              </h1>
              {hasSubtitle ? (
                <h2 className="mb-4 text-xl font-medium text-zinc-800 md:text-2xl">
                  {subtitleTrimmed}
                </h2>
              ) : null}
              {pl.description !== null && pl.description.trim() !== "" ? (
                <p className="max-w-3xl text-lg leading-relaxed text-zinc-600 md:text-xl">
                  {pl.description}
                </p>
              ) : null}
            </div>
            <ShareButton
              title={pl.title}
              text={shareText}
              url={`${SITE_ORIGIN}/playlist/${pl.id}`}
              className="shrink-0 self-start"
            />
          </div>
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
