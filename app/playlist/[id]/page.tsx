import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { PlaylistVideoItem } from "@/components/feed/PlaylistVideoItem";
import { PageContextBar } from "@/components/layout/PageContextBar";
import { ShareButton } from "@/components/shared/ShareButton";
import { SITE_ORIGIN, absoluteOgImageUrl } from "@/lib/site";
import { createClient } from "@/utils/supabase/server";

import type { Playlist, Video } from "@/types/database";

type PlaylistVideoRelationRow = {
  position: number;
  videos: Video | Video[] | null;
};

const OG_PLAYLIST_FALLBACK = "צפו בפלייליסט המלא בתדר-ישר-אל.";

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
    .select("title, subtitle, description, cover_image_url")
    .eq("id", params.id)
    .maybeSingle();

  if (error !== null || playlist === null) {
    return {};
  }

  const p = playlist as Pick<
    Playlist,
    "title" | "subtitle" | "description" | "cover_image_url"
  >;
  const title = p.title;
  const sub =
    typeof p.subtitle === "string" && p.subtitle.trim() !== ""
      ? p.subtitle.trim()
      : "";
  const desc =
    p.description !== null && p.description.trim() !== ""
      ? p.description.trim()
      : "";
  const description =
    sub !== "" ? sub : desc !== "" ? desc : OG_PLAYLIST_FALLBACK;

  const cover = p.cover_image_url?.trim();
  const imageUrl = absoluteOgImageUrl(
    cover !== undefined && cover !== "" ? cover : "/logo.png",
  );

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      locale: "he_IL",
      siteName: "תדר-ישר-אל",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
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

  const subtitleTrimmed =
    typeof pl.subtitle === "string" ? pl.subtitle.trim() : "";
  const hasSubtitle = subtitleTrimmed !== "";

  const coverTrimmed = pl.cover_image_url?.trim();
  const hasCover =
    coverTrimmed !== undefined && coverTrimmed !== "";

  const descriptionTrimmed =
    pl.description !== null && pl.description.trim() !== ""
      ? pl.description.trim()
      : "";

  const shareTitle = pl.title;
  const shareText = `${pl.title}${
    hasSubtitle ? ` - ${subtitleTrimmed}` : ""
  }${descriptionTrimmed !== "" ? `\n${descriptionTrimmed}` : ""}`.trim();

  return (
    <div className="min-h-screen bg-[#F9F9F7] text-zinc-900" dir="rtl">
      <PageContextBar backHref="/" backText="חזרה לראשי" />

      <section className="relative flex h-[40vh] min-h-[350px] w-full items-end pb-12 md:h-[50vh]">
        {hasCover ? (
          <div className="absolute inset-0 z-0">
            <Image
              src={coverTrimmed}
              alt={pl.title}
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/60 to-black/10" />
          </div>
        ) : (
          <div className="absolute inset-0 z-0 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-950" />
        )}

        <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col justify-end gap-6 px-4 md:flex-row md:items-end md:justify-between md:px-8 lg:px-12">
          <div className="flex max-w-3xl flex-col gap-3">
            <h1 className="font-heading text-4xl font-bold tracking-tight text-white drop-shadow-md md:text-6xl">
              {pl.title}
            </h1>
            {hasSubtitle ? (
              <h2 className="text-2xl font-medium text-zinc-200 drop-shadow-sm md:text-3xl">
                {subtitleTrimmed}
              </h2>
            ) : null}
            {descriptionTrimmed !== "" ? (
              <p className="mt-2 max-w-2xl text-base leading-relaxed text-zinc-300 line-clamp-3 md:text-lg">
                {descriptionTrimmed}
              </p>
            ) : null}
          </div>

          <div className="shrink-0 md:mb-2">
            <ShareButton
              title={shareTitle}
              text={shareText}
              url={`${SITE_ORIGIN}/playlist/${pl.id}`}
              appearance="onDark"
            />
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-5xl px-4 py-12 md:px-8 lg:px-12">
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
