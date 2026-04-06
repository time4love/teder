import type { ReactElement } from "react";
import Link from "next/link";

import { PlaylistForm } from "@/components/admin/PlaylistForm";

export default function AdminNewPlaylistPage(): ReactElement {
  return (
    <div
      dir="rtl"
      className="min-h-[100dvh] bg-[#F9F9F7] px-4 py-10 text-zinc-900 md:px-8"
    >
      <div className="mx-auto max-w-2xl">
        <header className="mb-10 space-y-2 border-b border-zinc-200 pb-8">
          <p className="text-sm text-zinc-500">ניהול · תדר-ישר-אל</p>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
            פלייליסט חדש
          </h1>
          <p className="text-sm text-zinc-600">
            הגדרת כותרת, תיאור, תמונת כיסוי וסדר הופעה במגזין.
          </p>
          <Link
            href="/admin/playlists"
            className="inline-block text-sm text-zinc-600 underline-offset-4 hover:text-zinc-900 hover:underline"
          >
            ← חזרה לרשימת הפלייליסטים
          </Link>
        </header>

        <PlaylistForm />
      </div>
    </div>
  );
}
