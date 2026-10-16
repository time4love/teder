import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PlaylistView } from "@/components/playlist/PlaylistView";
import { categoryColor, dominantCategory, videoThumb } from "@/lib/archive";
import { SITE_ORIGIN, absoluteOgImageUrl } from "@/lib/site";
import { createPublicClient } from "@/utils/supabase/public";

import type { Category, Playlist, Video } from "@/types/database";

type PlaylistVideoRelationRow = {
  position: number;
  videos: Video | Video[] | null;
};

const OG_PLAYLIST_FALLBACK = "צפו בפלייליסט המלא בתדר-ישר-אל.";

/** Served from cache; admin edits refresh it immediately (see `revalidatePublicPages`). */
export const revalidate = 300;

/** Prebuild every playlist; ones added later render on first visit and are cached. */
export async function generateStaticParams(): Promise<{ id: string }[]> {
  const { data, error } = await createPublicClient().from("playlists").select("id");
  if (error !== null) {
    console.error("[playlist/[id]] generateStaticParams", error.message);
    return [];
  }
  return (data ?? []).map((row: { id: string }) => ({ id: row.id }));
}

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
  const supabase = createPublicClient();
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
  const supabase = createPublicClient();

  const [playlistRes, relationsRes, categoriesRes] = await Promise.all([
    supabase.from("playlists").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("playlist_videos")
      .select("position, videos(*)")
      .eq("playlist_id", id)
      .order("position", { ascending: true })
      .order("video_id", { ascending: true }),
    supabase.from("categories").select("*"),
  ]);

  if (playlistRes.error !== null) {
    console.error("[playlist/[id]] playlist", playlistRes.error.message);
  }
  if (playlistRes.data === null) {
    notFound();
  }
  if (relationsRes.error !== null) {
    console.error("[playlist/[id]] playlist_videos", relationsRes.error.message);
  }

  const pl = playlistRes.data as Playlist;
  const videos = normalizeVideos(relationsRes.data as PlaylistVideoRelationRow[] | null);
  const categories = (categoriesRes.data ?? []) as Category[];

  const categoryId = dominantCategory(videos.map((v) => ({ video: v })));
  const categoryName = categories.find((c) => c.id === categoryId)?.name;

  const trimmed = (v: string | null | undefined): string | null =>
    typeof v === "string" && v.trim() !== "" ? v.trim() : null;
  const subtitle = trimmed(pl.subtitle);
  const description = trimmed(pl.description);
  const cover = trimmed(pl.cover_image_url) ?? "/placeholder.jpg";

  const shareText = `${pl.title}${subtitle !== null ? ` - ${subtitle}` : ""}${
    description !== null ? `\n${description}` : ""
  }`.trim();

  return (
    <main dir="rtl">
      <PlaylistView
        id={pl.id}
        title={pl.title}
        subtitle={subtitle}
        description={description}
        cover={cover}
        category={
          categoryName !== undefined
            ? { name: categoryName, rgb: categoryColor(categoryId, categories) }
            : null
        }
        episodes={videos.map((v) => ({
          id: v.id,
          title: v.title,
          description: trimmed(v.description),
          thumb: videoThumb(v),
        }))}
        shareUrl={`${SITE_ORIGIN}/playlist/${pl.id}`}
        shareText={shareText}
      />
    </main>
  );
}
