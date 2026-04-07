import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { VideoFocusRoom } from "@/components/video/VideoFocusRoom";
import { SITE_ORIGIN } from "@/lib/site";
import { createClient } from "@/utils/supabase/server";

import type { Video } from "@/types/database";

type SearchParams = Record<string, string | string[] | undefined>;

const DEFAULT_DESCRIPTION =
  "ארכיון חשיפות, עדויות ומידע.";

function firstParam(value: string | string[] | undefined): string | undefined {
  if (value === undefined) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const supabase = createClient();
  const { data: video, error } = await supabase
    .from("videos")
    .select("title, description, cover_image_url")
    .eq("id", params.id)
    .maybeSingle();

  if (error !== null || video === null) {
    return { title: "סרטון" };
  }

  const v = video as Pick<
    Video,
    "title" | "description" | "cover_image_url"
  >;
  const description =
    v.description !== null && v.description.trim() !== ""
      ? v.description.trim()
      : DEFAULT_DESCRIPTION;
  const cover = v.cover_image_url?.trim();
  const images =
    cover !== undefined && cover !== ""
      ? [{ url: cover, alt: v.title }]
      : [{ url: "/logo.png", alt: v.title }];

  return {
    title: v.title,
    description,
    openGraph: {
      title: v.title,
      description,
      type: "website",
      locale: "he_IL",
      siteName: "תדר-ישר-אל",
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: v.title,
      description,
      images: images.map((i) => i.url),
    },
  };
}

export default async function VideoPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: SearchParams;
}): Promise<JSX.Element> {
  const supabase = createClient();

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

  let backHref = "/";
  let backText = "חזרה לראשי";

  const playlistId = firstParam(searchParams.playlist)?.trim();
  if (playlistId !== undefined && playlistId !== "") {
    const { data: playlist, error: plErr } = await supabase
      .from("playlists")
      .select("title")
      .eq("id", playlistId)
      .maybeSingle();

    if (plErr !== null) {
      console.error("[video/[id]] playlist", plErr.message);
    }

    if (playlist !== null && typeof playlist.title === "string") {
      backHref = `/playlist/${playlistId}`;
      backText = `חזרה אל: ${playlist.title}`;
    }
  }

  const shareUrl = `${SITE_ORIGIN}/video/${row.id}`;
  const shareText =
    row.description !== null && row.description.trim() !== ""
      ? row.description.trim()
      : DEFAULT_DESCRIPTION;

  return (
    <VideoFocusRoom
      video={{
        id: row.id,
        title: row.title,
        description: row.description,
        youtube_url: row.youtube_url,
      }}
      backHref={backHref}
      backText={backText}
      shareUrl={shareUrl}
      shareText={shareText}
    />
  );
}
