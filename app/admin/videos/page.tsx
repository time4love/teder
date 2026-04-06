import Link from "next/link";

import { DeleteVideoButton } from "@/components/admin/DeleteVideoButton";
import { buttonVariants } from "@/components/ui/button-variants";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { loadAdminVideosDashboard } from "@/lib/data/admin-lists";
import { buildPlaylistTitlesByVideoId } from "@/lib/data/videos";
import { cn } from "@/lib/utils";
import type { Video } from "@/types/database";
import { getYouTubeThumbnail } from "@/utils/youtube";

function videoThumbnailSrc(video: Video): string | null {
  if (video.cover_image_url !== null && video.cover_image_url.trim() !== "") {
    return video.cover_image_url;
  }
  return getYouTubeThumbnail(video.youtube_url);
}

export default async function AdminVideosPage() {
  const {
    categories,
    playlists,
    videos,
    playlistVideoLinks,
    errors: dashboardErrors,
  } = await loadAdminVideosDashboard();

  const categoryNameById: Record<string, string> = {};
  for (const c of categories) {
    categoryNameById[c.id] = c.name;
  }
  const playlistTitleById: Record<string, string> = {};
  for (const p of playlists) {
    playlistTitleById[p.id] = p.title;
  }

  const titlesByVideo = buildPlaylistTitlesByVideoId(
    playlistVideoLinks,
    playlistTitleById,
  );

  return (
    <div
      dir="rtl"
      className="min-h-[100dvh] bg-[#F9F9F7] px-4 py-10 text-zinc-900 md:px-8"
    >
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 flex flex-col gap-4 border-b border-zinc-200 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-sm text-zinc-500">ניהול · תדר-ישר-אל</p>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
              ניהול סרטונים
            </h1>
            <p className="text-sm text-zinc-600">
              רשימה מלאה של כל הסרטונים. לניהול לפי גיליון השתמשו בפלייליסטים.
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              <Link
                href="/admin/playlists"
                className="text-zinc-600 underline-offset-4 hover:text-zinc-900 hover:underline"
              >
                ← ניהול פלייליסטים (מגזין)
              </Link>
              <Link
                href="/"
                className="text-zinc-600 underline-offset-4 hover:text-zinc-900 hover:underline"
              >
                ← חזרה לדף הבית
              </Link>
            </div>
          </div>
          <Link
            href="/admin/videos/new"
            className={cn(buttonVariants(), "inline-flex w-full justify-center sm:w-auto")}
          >
            הוסף סרטון חדש
          </Link>
        </header>

        {dashboardErrors.length > 0 ? (
          <div
            className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
            role="status"
          >
            <p className="font-medium">אזהרות טעינה</p>
            <ul className="mt-2 list-inside list-disc text-amber-900/90">
              {dashboardErrors.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-200 hover:bg-zinc-50/80">
                <TableHead className="text-zinc-600">תמונה</TableHead>
                <TableHead className="text-zinc-600">כותרת</TableHead>
                <TableHead className="text-zinc-600">קטגוריה</TableHead>
                <TableHead className="text-zinc-600">פלייליסטים</TableHead>
                <TableHead className="w-24 text-zinc-600">סדר</TableHead>
                <TableHead className="w-44 text-zinc-600">פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {videos.length === 0 ? (
                <TableRow className="border-zinc-100 hover:bg-transparent">
                  <TableCell
                    colSpan={6}
                    className="py-12 text-center text-zinc-500"
                  >
                    אין סרטונים עדיין.{" "}
                    <Link
                      href="/admin/videos/new"
                      className="font-medium text-zinc-800 underline underline-offset-4 hover:text-zinc-950"
                    >
                      הוסף סרטון ראשון
                    </Link>
                  </TableCell>
                </TableRow>
              ) : (
                videos.map((video) => {
                  const thumb = videoThumbnailSrc(video);
                  const cat =
                    video.category_id !== null
                      ? (categoryNameById[video.category_id] ?? "—")
                      : "—";
                  const plTitles = titlesByVideo[video.id];
                  const plLabel =
                    plTitles !== undefined && plTitles.length > 0
                      ? plTitles.join(" · ")
                      : "—";

                  return (
                    <TableRow
                      key={video.id}
                      className="border-zinc-100 hover:bg-zinc-50/60"
                    >
                      <TableCell className="w-28">
                        <div className="relative h-12 w-20 overflow-hidden rounded border border-zinc-200 bg-zinc-100">
                          {thumb !== null ? (
                            // eslint-disable-next-line @next/next/no-img-element -- remote YouTube / arbitrary CDN URLs
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
                      <TableCell className="max-w-[200px] font-medium text-zinc-900 md:max-w-xs">
                        <span className="line-clamp-2">{video.title}</span>
                      </TableCell>
                      <TableCell className="text-zinc-700">{cat}</TableCell>
                      <TableCell className="max-w-[180px] text-sm text-zinc-700">
                        <span className="line-clamp-2">{plLabel}</span>
                      </TableCell>
                      <TableCell className="tabular-nums text-zinc-600">
                        {video.sort_order}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/admin/videos/${video.id}/edit`}
                            className={cn(
                              buttonVariants({ variant: "outline", size: "sm" }),
                              "inline-flex",
                            )}
                          >
                            עריכה
                          </Link>
                          <DeleteVideoButton videoId={video.id} />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
