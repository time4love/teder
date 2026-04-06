import Link from "next/link";

import { VideoForm } from "@/components/admin/VideoForm";
import { loadAdminCategoriesAndPlaylists } from "@/lib/data/admin-lists";

type SearchParams = Record<string, string | string[] | undefined>;

function firstParam(value: string | string[] | undefined): string | undefined {
  if (value === undefined) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

const PLAYLIST_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function formListsKey(
  categoryIds: string[],
  playlistIds: string[],
  playlistParam: string | undefined,
): string {
  return `${categoryIds.join(",")}|${playlistIds.join(",")}|${playlistParam ?? ""}`;
}

export default async function AdminNewVideoPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { categories, playlists, errors: listFetchErrors } =
    await loadAdminCategoriesAndPlaylists();

  const rawPid = firstParam(searchParams.playlist_id);
  const defaultPlaylistId =
    rawPid !== undefined && PLAYLIST_UUID_RE.test(rawPid) ? rawPid : undefined;

  return (
    <div
      dir="rtl"
      className="min-h-[100dvh] bg-[#F9F9F7] px-4 py-10 text-zinc-900 md:px-8"
    >
      <div className="mx-auto max-w-2xl">
        <header className="mb-10 space-y-2 border-b border-zinc-200 pb-8">
          <p className="text-sm text-zinc-500">ניהול · תדר-ישר-אל</p>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
            הוספת סרטון חדש
          </h1>
          <p className="text-sm text-zinc-600">
            הזינו פרטי הסרטון. השינויים יופיעו באתר לאחר השמירה.
          </p>
          <div className="flex flex-wrap gap-4 text-sm">
            <Link
              href="/admin/playlists"
              className="text-zinc-600 underline-offset-4 hover:text-zinc-900 hover:underline"
            >
              ← חזרה לפלייליסטים
            </Link>
            {defaultPlaylistId !== undefined ? (
              <Link
                href={`/admin/playlists/${defaultPlaylistId}/edit`}
                className="text-zinc-600 underline-offset-4 hover:text-zinc-900 hover:underline"
              >
                ← חזרה לעריכת הפלייליסט
              </Link>
            ) : null}
            <Link
              href="/"
              className="text-zinc-600 underline-offset-4 hover:text-zinc-900 hover:underline"
            >
              ← חזרה לדף הבית
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
            <p className="mt-2 text-xs text-red-800/90">
              ודאו ש־NEXT_PUBLIC_SUPABASE_URL ו־NEXT_PUBLIC_SUPABASE_ANON_KEY תקינים,
              וש־SUPABASE_SERVICE_ROLE_KEY תואם לפרויקט. הריצו את{" "}
              <code className="rounded bg-red-100/80 px-1 text-red-950">
                schema.sql
              </code>{" "}
              אם הטבלאות חסרות.
            </p>
          </div>
        ) : null}

        <VideoForm
          key={formListsKey(
            categories.map((c) => c.id),
            playlists.map((p) => p.id),
            defaultPlaylistId,
          )}
          categories={categories}
          playlists={playlists}
          defaultPlaylistId={defaultPlaylistId}
        />
      </div>
    </div>
  );
}
