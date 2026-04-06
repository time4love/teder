import type { ReactElement } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

export interface PageContextBarProps {
  backHref: string;
  backText: string;
  currentTitle?: string;
  nextHref?: string;
  prevHref?: string;
  className?: string;
}

/**
 * Thin contextual bar: back link, optional title, optional prev/next for video series.
 */
export function PageContextBar({
  backHref,
  backText,
  currentTitle,
  nextHref,
  prevHref,
  className,
}: PageContextBarProps): ReactElement {
  const showNav = nextHref !== undefined || prevHref !== undefined;

  return (
    <div
      dir="rtl"
      className={cn(
        "flex h-12 items-center justify-between gap-3 border-b border-zinc-100 bg-white/50 px-4 text-sm text-zinc-600 lg:px-8",
        className,
      )}
    >
      <Link
        href={backHref}
        className="inline-flex shrink-0 items-center font-medium tracking-tight text-zinc-700 transition hover:text-zinc-900"
      >
        <ArrowRight className="ms-2 inline size-4" aria-hidden />
        {backText}
      </Link>

      {currentTitle !== undefined && currentTitle !== "" ? (
        <span className="hidden min-w-0 flex-1 truncate text-center font-medium tracking-tight text-zinc-900 md:inline">
          {currentTitle}
        </span>
      ) : (
        <span className="hidden flex-1 md:block" />
      )}

      {showNav ? (
        <div className="flex shrink-0 items-center gap-1">
          {nextHref !== undefined ? (
            <Link
              href={nextHref}
              className="inline-flex size-9 items-center justify-center rounded-md text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900"
              aria-label="הסרטון הבא"
            >
              <ChevronLeft className="size-5" aria-hidden />
            </Link>
          ) : null}
          {prevHref !== undefined ? (
            <Link
              href={prevHref}
              className="inline-flex size-9 items-center justify-center rounded-md text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900"
              aria-label="הסרטון הקודם"
            >
              <ChevronRight className="size-5" aria-hidden />
            </Link>
          ) : null}
        </div>
      ) : (
        <span className="hidden w-[4.5rem] shrink-0 md:block" aria-hidden />
      )}
    </div>
  );
}
