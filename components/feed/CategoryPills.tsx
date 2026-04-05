import Link from "next/link";
import type { Category } from "@/types/database";

export interface CategoryPillsProps {
  categories: Category[];
  activeSlug?: string;
}

export function CategoryPills({ categories, activeSlug }: CategoryPillsProps) {
  const allActive = activeSlug === undefined || activeSlug === "";

  return (
    <nav
      dir="rtl"
      className="fixed inset-x-0 top-0 z-50 bg-gradient-to-b from-black/90 to-transparent pb-8 pt-[max(0.75rem,env(safe-area-inset-top))]"
      aria-label="קטגוריות"
    >
      <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto px-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Link
          href="/"
          scroll={false}
          className={`shrink-0 snap-start rounded-full px-4 py-2 text-sm font-medium transition ${
            allActive
              ? "bg-white text-black"
              : "bg-white/10 text-white/90 hover:bg-white/20"
          }`}
        >
          הכל
        </Link>
        {categories.map((cat) => {
          const active = activeSlug === cat.slug;
          return (
            <Link
              key={cat.id}
              href={`/?category=${encodeURIComponent(cat.slug)}`}
              scroll={false}
              className={`shrink-0 snap-start rounded-full px-4 py-2 text-sm font-medium transition ${
                active
                  ? "bg-white text-black"
                  : "bg-white/10 text-white/90 hover:bg-white/20"
              }`}
            >
              {cat.name}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
