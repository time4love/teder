import type { ReactElement } from "react";
import Link from "next/link";

import { DeletePlaylistButton } from "@/components/admin/DeletePlaylistButton";
import { buttonVariants } from "@/components/ui/button-variants";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { sortPlaylistsByOrder } from "@/lib/data/videos";
import { mapPlaylistRows } from "@/lib/mappers/database";
import { cn } from "@/lib/utils";
import type { Playlist } from "@/types/database";
import { createAdminSupabaseClient } from "@/utils/supabase/service-role";

function thumbSrc(p: Playlist): string | null {
  const u = p.cover_image_url;
  if (u !== undefined && u !== null && u.trim() !== "") {
    return u.trim();
  }
  return null;
}

export default async function AdminPlaylistsPage(): Promise<ReactElement> {
  const supabase = createAdminSupabaseClient();
  const { data: raw, error } = await supabase
    .from("playlists")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error !== null) {
    console.error("[admin/playlists]", error.message);
  }

  const playlists = sortPlaylistsByOrder(mapPlaylistRows(raw));

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
              פלייליסטים (מגזין)
            </h1>
            <p className="text-sm text-zinc-600">
              ניהול גיליונות, כיסויים וסדר הופעה. סרטונים מנוהלים מתוך כל פלייליסט.
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              <Link
                href="/"
                className="text-zinc-600 underline-offset-4 hover:text-zinc-900 hover:underline"
              >
                ← חזרה לדף הבית
              </Link>
              <Link
                href="/admin/videos"
                className="text-zinc-600 underline-offset-4 hover:text-zinc-900 hover:underline"
              >
                רשימת כל הסרטונים
              </Link>
            </div>
          </div>
          <Link
            href="/admin/playlists/new"
            className={cn(
              buttonVariants(),
              "inline-flex w-full justify-center sm:w-auto",
            )}
          >
            הוסף פלייליסט חדש
          </Link>
        </header>

        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-200 hover:bg-zinc-50/80">
                <TableHead className="w-28 text-zinc-600">כיסוי</TableHead>
                <TableHead className="text-zinc-600">כותרת</TableHead>
                <TableHead className="text-zinc-600">תיאור</TableHead>
                <TableHead className="w-24 text-zinc-600">סדר</TableHead>
                <TableHead className="w-52 text-zinc-600">פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {playlists.length === 0 ? (
                <TableRow className="border-zinc-100 hover:bg-transparent">
                  <TableCell
                    colSpan={5}
                    className="py-12 text-center text-zinc-500"
                  >
                    אין פלייליסטים עדיין.{" "}
                    <Link
                      href="/admin/playlists/new"
                      className="font-medium text-zinc-800 underline underline-offset-4 hover:text-zinc-950"
                    >
                      צרו פלייליסט ראשון
                    </Link>
                  </TableCell>
                </TableRow>
              ) : (
                playlists.map((p) => {
                  const src = thumbSrc(p);
                  return (
                    <TableRow
                      key={p.id}
                      className="border-zinc-100 hover:bg-zinc-50/60"
                    >
                      <TableCell>
                        <div className="relative h-14 w-11 overflow-hidden rounded border border-zinc-200 bg-zinc-100">
                          {src !== null ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={src}
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
                      <TableCell className="max-w-[220px] font-medium text-zinc-900 md:max-w-sm">
                        <span className="line-clamp-2">{p.title}</span>
                      </TableCell>
                      <TableCell className="max-w-xs text-sm text-zinc-700">
                        <span className="line-clamp-2">
                          {p.description !== null && p.description.trim() !== ""
                            ? p.description
                            : "—"}
                        </span>
                      </TableCell>
                      <TableCell className="tabular-nums text-zinc-600">
                        {p.sort_order}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/admin/playlists/${p.id}/edit`}
                            className={cn(
                              buttonVariants({ variant: "outline", size: "sm" }),
                              "inline-flex",
                            )}
                          >
                            עריכה
                          </Link>
                          <DeletePlaylistButton playlistId={p.id} />
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
