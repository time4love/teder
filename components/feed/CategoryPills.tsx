import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Category } from "@/types/database";

export interface CategoryPillsProps {
  categories: Category[];
  activeSlug?: string;
}

function pillClasses(active: boolean): string {
  return cn(
    "inline-flex shrink-0 snap-start items-center justify-center rounded-full border px-4 py-2 text-sm font-medium tracking-tight transition",
    active
      ? "border-zinc-900 bg-zinc-900 text-white"
      : "border-zinc-200 bg-white/90 text-zinc-800 hover:border-zinc-300 hover:bg-white",
  );
}

export function CategoryPills({ categories, activeSlug }: CategoryPillsProps) {
  const allActive = activeSlug === undefined || activeSlug === "";

  return (
    <nav
      dir="rtl"
      className="fixed inset-x-0 top-16 z-50 bg-gradient-to-b from-[#F9F9F7]/95 to-transparent pb-6 pt-3"
      aria-label="קטגוריות"
    >
      <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto px-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Link href="/" scroll={false} className={pillClasses(allActive)}>
          הכל
        </Link>
        {categories.map((cat) => {
          const active = activeSlug === cat.slug;
          return (
            <Link
              key={cat.id}
              href={`/?category=${encodeURIComponent(cat.slug)}`}
              scroll={false}
              className={pillClasses(active)}
            >
              {cat.name}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
