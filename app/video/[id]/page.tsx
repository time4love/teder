import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { VideoFocusRoom } from "@/components/video/VideoFocusRoom";
import { SITE_ORIGIN, absoluteOgImageUrl } from "@/lib/site";
import { createPublicClient } from "@/utils/supabase/public";

import type { Video } from "@/types/database";

type PlaylistMembershipRow = {
  playlist_id: string;
  playlists: { title: string } | { title: string }[] | null;
};

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

  // Every playlist this video is in — the back link picks the one in `?playlist=`.
  const { data: memberships, error: membershipError } = await supabase
    .from("playlist_videos")
    .select("playlist_id, playlists(title)")
    .eq("video_id", row.id);

  if (membershipError !== null) {
    console.error("[video/[id]] playlists", membershipError.message);
  }

  const playlistTitles: Record<string, string> = {};
  for (const m of (memberships ?? []) as PlaylistMembershipRow[]) {
    const pl = Array.isArray(m.playlists) ? m.playlists[0] : m.playlists;
    if (pl !== undefined && pl !== null && typeof pl.title === "string") {
      playlistTitles[m.playlist_id] = pl.title;
    }
  }

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
      }}
      playlistTitles={playlistTitles}
      shareUrl={shareUrl}
      shareText={shareText}
    />
  );
}
