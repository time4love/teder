"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";

import { cn } from "@/lib/utils";

const NAV_LINKS: { href: string; label: string }[] = [
  { href: "/about", label: "אודות" },
];

/**
 * Global glassmorphism header: brand (home) and mobile drawer for secondary pages.
 */
export function Header(): JSX.Element {
  const [open, setOpen] = React.useState(false);

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
          "fixed top-0 z-[60] flex h-16 w-full items-center justify-between border-b border-zinc-200",
          "bg-white/80 backdrop-blur-md px-4 lg:px-8",
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
          className="hidden items-center gap-8 text-sm font-medium tracking-tight text-zinc-700 lg:flex"
          aria-label="עמודים"
        >
          {NAV_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition hover:text-zinc-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex size-10 items-center justify-center rounded-lg text-zinc-900 transition hover:bg-zinc-100 lg:hidden"
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
