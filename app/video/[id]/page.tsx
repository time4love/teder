import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { VideoFocusRoom } from "@/components/video/VideoFocusRoom";
import type { VideoPlaylistContext } from "@/components/video/VideoFocusRoom";
import { categoryColor, dominantCategory, videoThumb } from "@/lib/archive";
import { SITE_ORIGIN, absoluteOgImageUrl } from "@/lib/site";
import { createPublicClient } from "@/utils/supabase/public";

import type { Category, Video } from "@/types/database";

type EpisodeVideo = Pick<Video, "id" | "title" | "cover_image_url" | "youtube_url" | "category_id">;

type PlaylistEpisodeRow = {
  playlist_id: string;
  position: number;
  playlists: { title: string } | { title: string }[] | null;
  videos: EpisodeVideo | EpisodeVideo[] | null;
};

function one<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

const OG_VIDEO_FALLBACK = "צפו בסרטון המלא בתדר-ישר-אל.";

/** Served from cache; admin edits refresh it immediately (see `revalidatePublicPages`). */
export const revalidate = 300;

/** Prebuild every video; ones added later render on first visit and are cached. */
export async function generateStaticParams(): Promise<{ id: string }[]> {
  const { data, error } = await createPublicClient().from("videos").select("id");
  if (error !== null) {
    console.error("[video/[id]] generateStaticParams", error.message);
    return [];
  }
  return (data ?? []).map((row: { id: string }) => ({ id: row.id }));
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const supabase = createPublicClient();
  const { data: video, error } = await supabase
    .from("videos")
    .select("title, description, cover_image_url")
    .eq("id", params.id)
    .maybeSingle();

  if (error !== null || video === null) {
    return {};
  }

  const v = video as Pick<
    Video,
    "title" | "description" | "cover_image_url"
  >;
  const title = v.title;
  const body =
    v.description !== null && v.description.trim() !== ""
      ? v.description.trim()
      : "";
  const description = body !== "" ? body : OG_VIDEO_FALLBACK;

  const cover = v.cover_image_url?.trim();
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

export default async function VideoPage({
  params,
}: {
  params: { id: string };
}): Promise<JSX.Element> {
  const supabase = createPublicClient();

  const { data: video, error } = await supabase
    .from("videos")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error !== null) {
    console.error("[video/[id]]", error.message);
    notFound();
  }

  if (video === null) {
    notFound();
  }

  const row = video as Video;

  // Every playlist this video is in, with all its episodes — the page shows where the
  // video sits in the one the visitor came from (`?playlist=`).
  const { data: memberships, error: membershipError } = await supabase
    .from("playlist_videos")
    .select("playlist_id")
    .eq("video_id", row.id);
  if (membershipError !== null) {
    console.error("[video/[id]] memberships", membershipError.message);
  }
  const playlistIds = (memberships ?? []).map((m: { playlist_id: string }) => m.playlist_id);

  const [episodesRes, categoriesRes] = await Promise.all([
    playlistIds.length > 0
      ? supabase
          .from("playlist_videos")
          .select(
            "playlist_id, position, playlists(title), videos(id, title, cover_image_url, youtube_url, category_id)",
          )
          .in("playlist_id", playlistIds)
          .order("position", { ascending: true })
      : Promise.resolve({ data: [] as PlaylistEpisodeRow[], error: null }),
    supabase.from("categories").select("*"),
  ]);
  if (episodesRes.error !== null) {
    console.error("[video/[id]] episodes", episodesRes.error.message);
  }
  const categories = (categoriesRes.data ?? []) as Category[];

  const playlists: VideoPlaylistContext[] = playlistIds.map((pid) => {
    const rows = ((episodesRes.data ?? []) as PlaylistEpisodeRow[]).filter(
      (r) => r.playlist_id === pid,
    );
    const videos = rows
      .map((r) => one(r.videos))
      .filter((v): v is EpisodeVideo => v !== null);
    const categoryId = dominantCategory(videos.map((v) => ({ video: v })));
    return {
      id: pid,
      title: one(rows[0]?.playlists ?? null)?.title ?? "",
      rgb: categoryColor(categoryId, categories),
      categoryName: categories.find((c) => c.id === categoryId)?.name ?? null,
      episodes: videos.map((v) => ({ id: v.id, title: v.title, thumb: videoThumb(v) })),
    };
  });

  const shareUrl = `${SITE_ORIGIN}/video/${row.id}`;
  const descTrim =
    row.description !== null && row.description.trim() !== ""
      ? row.description.trim()
      : "";
  const shareText = `${row.title}${
    descTrim !== "" ? `\n${descTrim}` : ""
  }`.trim();

  return (
    <VideoFocusRoom
      video={{
        id: row.id,
        title: row.title,
        description: row.description,
        youtube_url: row.youtube_url,
        thumb: videoThumb(row),
      }}
      playlists={playlists}
      shareUrl={shareUrl}
      shareText={shareText}
    />
  );
}
