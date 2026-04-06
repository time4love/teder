import type { ReactElement } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PlaylistForm } from "@/components/admin/PlaylistForm";
import { buttonVariants } from "@/components/ui/button-variants";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { mapPlaylistRow, mapVideoRows } from "@/lib/mappers/database";
import type { Video } from "@/types/database";
import { createAdminSupabaseClient } from "@/utils/supabase/service-role";
import { getYouTubeThumbnail } from "@/utils/youtube";

type PageProps = {
  params: { id: string };
};

function videoThumbSrc(video: Video): string | null {
  if (video.cover_image_url !== null && video.cover_image_url.trim() !== "") {
    return video.cover_image_url;
  }
  return getYouTubeThumbnail(video.youtube_url);
}

export default async function AdminEditPlaylistPage({
  params,
}: PageProps): Promise<ReactElement> {
  const { id } = params;
  const supabase = createAdminSupabaseClient();

  const { data: plRow, error: plErr } = await supabase
    .from("playlists")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (plErr !== null) {
    console.error("[admin/playlists/edit] playlist", plErr.message);
  }

  const playlist = mapPlaylistRow(plRow);
  if (playlist === null) {
    notFound();
  }

  const { data: pvRows, error: pvErr } = await supabase
    .from("playlist_videos")
    .select("position, video_id")
    .eq("playlist_id", id)
    .order("position", { ascending: true })
    .order("video_id", { ascending: true });

  if (pvErr !== null) {
    console.error("[admin/playlists/edit] playlist_videos", pvErr.message);
  }

  const linkList = pvRows ?? [];
  const videoIds = linkList.map((r) => r.video_id as string);

  const videosInOrder: { position: number; video: Video }[] = [];

  if (videoIds.length > 0) {
    const { data: vRaw, error: vErr } = await supabase
      .from("videos")
      .select("*")
      .in("id", videoIds);

    if (vErr !== null) {
      console.error("[admin/playlists/edit] videos", vErr.message);
    }

    const byId = new Map(
      mapVideoRows(vRaw).map((v) => [v.id, v] as const),
    );

    for (const row of linkList) {
      const vid = row.video_id as string;
      const v = byId.get(vid);
      if (v !== undefined) {
        videosInOrder.push({
          position: row.position as number,
          video: v,
        });
      }
    }
  }

  return (
    <div
      dir="rtl"
      className="min-h-[100dvh] bg-[#F9F9F7] px-4 py-10 text-zinc-900 md:px-8"
    >
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 space-y-2 border-b border-zinc-200 pb-6">
          <p className="text-sm text-zinc-500">ניהול · תדר-ישר-אל</p>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
            עריכת פלייליסט
          </h1>
          <p className="text-lg font-medium text-zinc-800">{playlist.title}</p>
          <div className="flex flex-wrap gap-4 pt-1 text-sm">
            <Link
              href="/admin/playlists"
              className="text-zinc-600 underline-offset-4 hover:text-zinc-900 hover:underline"
            >
              ← חזרה לכל הפלייליסטים
            </Link>
            <Link
              href="/"
              className="text-zinc-600 underline-offset-4 hover:text-zinc-900 hover:underline"
            >
              ← דף הבית
            </Link>
          </div>
        </header>

        <PlaylistForm initialData={playlist} />

        <hr className="my-8 border-zinc-200" />

        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-semibold tracking-tight text-zinc-900">
              סרטונים בפלייליסט זה
            </h2>
            <Link
              href={`/admin/videos/new?playlist_id=${encodeURIComponent(playlist.id)}`}
              className={cn(
                buttonVariants(),
                "inline-flex w-full justify-center sm:w-auto",
              )}
            >
              הוסף סרטון לפלייליסט
            </Link>
          </div>

          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-200 hover:bg-zinc-50/80">
                  <TableHead className="w-28 text-zinc-600">תמונה</TableHead>
                  <TableHead className="text-zinc-600">כותרת</TableHead>
                  <TableHead className="w-24 text-zinc-600">מיקום</TableHead>
                  <TableHead className="w-36 text-zinc-600">פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {videosInOrder.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="py-10 text-center text-zinc-500"
                    >
                      אין סרטונים בפלייליסט. הוסיפו סרטון באמצעות הכפתור למעלה.
                    </TableCell>
                  </TableRow>
                ) : (
                  videosInOrder.map(({ position, video }) => {
                    const thumb = videoThumbSrc(video);
                    return (
                      <TableRow
                        key={video.id}
                        className="border-zinc-100 hover:bg-zinc-50/60"
                      >
                        <TableCell>
                          <div className="relative h-12 w-20 overflow-hidden rounded border border-zinc-200 bg-zinc-100">
                            {thumb !== null ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={thumb}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="flex h-full items-center justify-center text-[10px] text-zinc-400">
                                —
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-md font-medium text-zinc-900">
                          <span className="line-clamp-2">{video.title}</span>
                        </TableCell>
                        <TableCell className="tabular-nums text-zinc-600">
                          {position}
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/admin/videos/${video.id}/edit?playlist_id=${encodeURIComponent(playlist.id)}`}
                            className={cn(
                              buttonVariants({
                                variant: "outline",
                                size: "sm",
                              }),
                              "inline-flex",
                            )}
                          >
                            עריכה
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </section>
      </div>
    </div>
  );
}
