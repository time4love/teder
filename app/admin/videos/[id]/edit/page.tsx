import Link from "next/link";
import { notFound } from "next/navigation";

import { VideoForm } from "@/components/admin/VideoForm";
import { loadAdminCategoriesAndPlaylists } from "@/lib/data/admin-lists";
import { mapVideoRow } from "@/lib/mappers/database";
import type { VideoWithPlaylists } from "@/types/database";
import { createAdminSupabaseClient } from "@/utils/supabase/service-role";

type PageProps = {
  params: { id: string };
};

function formListsKey(
  categoryIds: string[],
  playlistIds: string[],
  videoId: string,
): string {
  return `${videoId}|${categoryIds.join(",")}|${playlistIds.join(",")}`;
}

export default async function AdminEditVideoPage({ params }: PageProps) {
  const { id } = params;

  const { categories, playlists, errors: listFetchErrors } =
    await loadAdminCategoriesAndPlaylists();

  const supabase = createAdminSupabaseClient();
  const [
    { data: videoRow, error: videoError },
    { data: membershipRows, error: membershipError },
  ] = await Promise.all([
    supabase.from("videos").select("*").eq("id", id).maybeSingle(),
    supabase.from("playlist_videos").select("playlist_id").eq("video_id", id),
  ]);

  if (videoError !== null) {
    console.error("[admin/videos/edit] video", videoError.message);
  }
  if (membershipError !== null) {
    console.error("[admin/videos/edit] playlist_videos", membershipError.message);
  }

  const video = mapVideoRow(videoRow);
  if (video === null) {
    notFound();
  }

  const playlist_ids: string[] = [];
  if (Array.isArray(membershipRows)) {
    for (const row of membershipRows) {
      if (
        typeof row === "object" &&
        row !== null &&
        "playlist_id" in row &&
        typeof (row as { playlist_id: unknown }).playlist_id === "string"
      ) {
        playlist_ids.push((row as { playlist_id: string }).playlist_id);
      }
    }
  }

  const initialData: VideoWithPlaylists = {
    ...video,
    playlist_ids,
  };

  return (
    <div
      dir="rtl"
      className="min-h-[100dvh] bg-[#F9F9F7] px-4 py-10 text-zinc-900 md:px-8"
    >
      <div className="mx-auto max-w-2xl">
        <header className="mb-10 space-y-2 border-b border-zinc-200 pb-8">
          <p className="text-sm text-zinc-500">ניהול · תדר-ישר-אל</p>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
            עריכת סרטון
          </h1>
          <p className="text-sm text-zinc-600">
            עדכנו פרטי הסרטון. השינויים יופיעו בדף הבית לאחר השמירה.
          </p>
          <div className="flex flex-wrap gap-4 pt-2 text-sm">
            <Link
              href="/admin/playlists"
              className="text-zinc-600 underline-offset-4 hover:text-zinc-900 hover:underline"
            >
              ← ניהול פלייליסטים
            </Link>
            <Link
              href="/admin/videos"
              className="text-zinc-600 underline-offset-4 hover:text-zinc-900 hover:underline"
            >
              ← כל הסרטונים
            </Link>
            <Link
              href="/"
              className="text-zinc-600 underline-offset-4 hover:text-zinc-900 hover:underline"
            >
              ← דף הבית
            </Link>
          </div>
        </header>

        {listFetchErrors.length > 0 ? (
          <div
            className="mb-8 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-950"
            role="alert"
          >
            <p className="font-medium">שגיאה בטעינת הרשימות ממסד הנתונים</p>
            <ul className="mt-2 list-inside list-disc text-red-900/90">
              {listFetchErrors.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <VideoForm
          key={formListsKey(
            categories.map((c) => c.id),
            playlists.map((p) => p.id),
            id,
          )}
          categories={categories}
          playlists={playlists}
          initialData={initialData}
        />
      </div>
    </div>
  );
}
