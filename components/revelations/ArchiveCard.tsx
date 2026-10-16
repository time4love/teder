"use client";

import type { ReactElement } from "react";
import Link from "next/link";
import { Play } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ArchivePlaylist } from "@/lib/archive";

export interface ArchiveCardProps {
  playlist: ArchivePlaylist;
  categoryName: string;
  /** Category accent as `r, g, b`. */
  rgb: string;
  /** "feature" is the large lead tile; "tile" a regular one; "slide" a phone carousel card. */
  size: "feature" | "tile" | "slide";
  /** Desktop: report hover so the page can tint its backdrop with this cover. */
  onFocusCover?: (cover: string) => void;
}

/**
 * A playlist in the archive: cover, category tag, title, subtitle and episode count. On
 * desktop, hovering lifts it, slowly zooms the cover and slides up its first episodes.
 */
export function ArchiveCard({
  playlist,
  categoryName,
  rgb,
  size,
  onFocusCover,
}: ArchiveCardProps): ReactElement {
  const big = size === "feature";
  const hoverable = size !== "slide";

  return (
    <Link
      href={`/playlist/${playlist.id}`}
      onMouseEnter={() => onFocusCover?.(playlist.cover)}
      onFocus={() => onFocusCover?.(playlist.cover)}
      className={cn(
        "group relative block h-full w-full overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 text-white shadow-lg transition duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
        hoverable && "hover:-translate-y-1.5 hover:shadow-2xl",
      )}
      style={{ boxShadow: `0 10px 40px rgba(${rgb}, 0.12)` }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- editorial URLs may be external */}
      <img
        src={playlist.cover}
        alt=""
        loading={big ? "eager" : "lazy"}
        className={cn(
          "absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s] ease-out",
          hoverable && "group-hover:scale-[1.06]",
        )}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent" />
      {/* Category light along the bottom edge */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-1 opacity-80 transition-opacity group-hover:opacity-100"
        style={{ background: `linear-gradient(to left, transparent, rgb(${rgb}), transparent)` }}
      />

      <div className="absolute right-0 top-0 p-4">
        <span
          className="rounded-full border px-3 py-1 text-xs font-medium backdrop-blur-md"
          style={{ borderColor: `rgba(${rgb}, 0.6)`, background: `rgba(${rgb}, 0.18)` }}
        >
          {categoryName}
        </span>
      </div>

      <div
        className={cn(
          "absolute inset-x-0 bottom-0 flex flex-col gap-2 p-5 transition-transform duration-500",
          hoverable && playlist.firstEpisodes.length > 0 && "group-hover:-translate-y-[var(--episodes-h)]",
          big && "p-7",
        )}
        style={{ ["--episodes-h" as string]: `${playlist.firstEpisodes.length * 1.75 + 1.25}rem` }}
      >
        <h3
          className={cn(
            "font-heading font-bold leading-tight drop-shadow-md",
            big ? "text-4xl xl:text-5xl" : "text-2xl",
          )}
        >
          {playlist.title}
        </h3>
        {playlist.subtitle !== null ? (
          <p className={cn("text-white/80", big ? "text-lg" : "line-clamp-2 text-sm")}>
            {playlist.subtitle}
          </p>
        ) : null}
        <p className="flex items-center gap-1.5 text-xs font-medium text-white/60">
          <Play className="size-3" aria-hidden />
          {playlist.episodeCount === 1 ? "פרק אחד" : `${playlist.episodeCount} פרקים`}
        </p>
      </div>

      {/* First episodes, sliding up on hover */}
      {hoverable && playlist.firstEpisodes.length > 0 ? (
        <ol
          aria-hidden
          className="absolute inset-x-0 bottom-0 flex translate-y-full flex-col gap-1 px-5 pb-4 transition-transform duration-500 group-hover:translate-y-0"
        >
          {playlist.firstEpisodes.map((title, i) => (
            <li key={title} className="flex items-center gap-2 truncate text-sm text-white/85">
              <span
                className="flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                style={{ background: `rgba(${rgb}, 0.35)` }}
              >
                {i + 1}
              </span>
              <span className="truncate">{title}</span>
            </li>
          ))}
        </ol>
      ) : null}
    </Link>
  );
}
