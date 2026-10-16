"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

import { FREEDOM_PROTOCOL_HREF, FREEDOM_PROTOCOL_TITLE } from "@/lib/gates";
import { cn } from "@/lib/utils";

/** Pages with a dark full-screen scene behind the header. */
const DARK_PAGES: ReadonlySet<string> = new Set([
  "/",
  "/about",
  "/contact",
  "/medicine",
  "/justice",
  "/revelations",
]);

/** Sections whose every page is dark: playlists and videos. */
const DARK_PREFIXES: readonly string[] = ["/playlist/", "/video/"];

const NAV_LINKS: { href: string; label: string }[] = [
  { href: FREEDOM_PROTOCOL_HREF, label: FREEDOM_PROTOCOL_TITLE },
  { href: "/about", label: "אודות" },
  { href: "/contact", label: "צור קשר" },
];

/**
 * Global glassmorphism header: brand (home) and mobile drawer for secondary pages.
 */
export function Header(): JSX.Element {
  const [open, setOpen] = React.useState(false);
  /** Dark, immersive pages — the header turns translucent over them. */
  const pathname = usePathname();
  const onPortal =
    DARK_PAGES.has(pathname) || DARK_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <header
        dir="rtl"
        className={cn(
          "fixed top-0 z-[60] flex h-16 w-full items-center justify-between border-b px-4 backdrop-blur-md lg:px-8",
          onPortal
            ? "border-white/10 bg-black/20"
            : "border-zinc-200 bg-white/80",
        )}
      >
        <Link
          href="/"
          className="flex items-center gap-2 transition-opacity hover:opacity-80"
        >
          <Image
            src="/logo.png"
            alt="תדר-ישר-אל"
            width={140}
            height={48}
            className="h-8 w-auto object-contain"
            priority
          />
        </Link>

        <nav
          className={cn(
            "hidden items-center gap-8 text-sm font-medium tracking-tight lg:flex",
            onPortal ? "text-white/75" : "text-zinc-700",
          )}
          aria-label="עמודים"
        >
          {NAV_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "transition",
                onPortal ? "hover:text-white" : "hover:text-zinc-900",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "inline-flex size-10 items-center justify-center rounded-lg transition lg:hidden",
            onPortal
              ? "text-white hover:bg-white/10"
              : "text-zinc-900 hover:bg-zinc-100",
          )}
          aria-label="פתיחת תפריט"
        >
          <Menu className="size-6" />
        </button>
      </header>

      {open ? (
        <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal>
          <button
            type="button"
            className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm"
            aria-label="סגירת תפריט"
            onClick={() => setOpen(false)}
          />
          <div
            className={cn(
              "absolute inset-y-0 left-0 flex w-[min(100%,20rem)] flex-col border-e border-zinc-200",
              "bg-[#F9F9F7] text-zinc-900 shadow-xl",
              "animate-in slide-in-from-left-4 duration-200",
            )}
          >
            <div className="flex h-16 items-center justify-between border-b border-zinc-200 px-4">
              <span className="text-sm font-medium tracking-tight text-zinc-600">
                ניווט
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex size-10 items-center justify-center rounded-lg text-zinc-900 hover:bg-zinc-100"
                aria-label="סגירה"
              >
                <X className="size-5" />
              </button>
            </div>
            <nav className="flex flex-col gap-1 p-4" aria-label="עמודים">
              {NAV_LINKS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-3 text-base font-medium tracking-tight text-zinc-800 transition hover:bg-zinc-100"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      ) : null}
    </>
  );
}
