import { notFound } from "next/navigation";

import { VideoFocusRoom } from "@/components/video/VideoFocusRoom";
import { createClient } from "@/utils/supabase/server";

import type { Video } from "@/types/database";

type SearchParams = Record<string, string | string[] | undefined>;

function firstParam(value: string | string[] | undefined): string | undefined {
  if (value === undefined) return undefined;
  return Array.isArray(value) ? value[0] : value;
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
    />
  );
}
