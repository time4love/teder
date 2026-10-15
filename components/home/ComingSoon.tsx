import type { ReactElement } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { rgbString } from "@/lib/gates";

export interface ComingSoonProps {
  title: string;
  tagline: string;
  rgb: readonly [number, number, number];
}

/** Placeholder for a gate or page whose content is not published yet. */
export function ComingSoon({ title, tagline, rgb }: ComingSoonProps): ReactElement {
  return (
    <main
      dir="rtl"
      className="flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center gap-6 px-6 text-center"
      style={{
        background: `radial-gradient(60% 50% at 50% 60%, ${rgbString(rgb, 0.22)}, transparent 75%)`,
      }}
    >
      <h1 className="font-heading text-5xl font-bold tracking-tight text-zinc-900 md:text-7xl">
        {title}
      </h1>
      <p className="text-xl text-zinc-600">{tagline}</p>
      <p
        className="rounded-full border px-4 py-1.5 text-sm font-medium text-zinc-700"
        style={{ borderColor: rgbString(rgb, 0.6) }}
      >
        בקרוב
      </p>
      <Link
        href="/"
        className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-zinc-600 transition hover:text-zinc-900"
      >
        <ArrowRight className="size-4" aria-hidden />
        חזרה לשערים
      </Link>
    </main>
  );
}
