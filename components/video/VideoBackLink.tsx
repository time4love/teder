"use client";

import type { ReactElement } from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight } from "lucide-react";

const DEFAULT_BACK = { href: "/revelations", text: "חזרה לחשיפות אמת" } as const;

export interface VideoBackLinkProps {
  /** Titles of the playlists this video belongs to, by playlist id. */
  playlistTitles: Record<string, string>;
}

/**
 * Back link of the video page: returns to the playlist named in `?playlist=` when the video
 * belongs to it, otherwise to the archive. Resolved in the browser so the video page itself
 * stays static and cacheable.
 */
export function VideoBackLink({ playlistTitles }: VideoBackLinkProps): ReactElement {
  return (
    <Suspense fallback={<BackLink href={DEFAULT_BACK.href} text={DEFAULT_BACK.text} />}>
      <PlaylistAwareBackLink playlistTitles={playlistTitles} />
    </Suspense>
  );
}

function PlaylistAwareBackLink({ playlistTitles }: VideoBackLinkProps): ReactElement {
  const playlistId = useSearchParams().get("playlist")?.trim() ?? "";
  const title = playlistId !== "" ? playlistTitles[playlistId] : undefined;

  return title !== undefined ? (
    <BackLink href={`/playlist/${playlistId}`} text={`חזרה אל: ${title}`} />
  ) : (
    <BackLink href={DEFAULT_BACK.href} text={DEFAULT_BACK.text} />
  );
}

function BackLink({ href, text }: { href: string; text: string }): ReactElement {
  return (
    <Link
      href={href}
      className="inline-flex items-center text-sm font-medium text-zinc-700 transition hover:text-zinc-900"
    >
      <ArrowRight className="ms-2 size-4 shrink-0" aria-hidden />
      {text}
    </Link>
  );
}
