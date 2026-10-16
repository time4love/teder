"use client";

import type { ReactElement } from "react";
import { useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";

import { ArchiveCard } from "@/components/revelations/ArchiveCard";
import { cn } from "@/lib/utils";
import type { ArchiveCategory } from "@/lib/archive";

const ALL = "all";

export interface ArchiveWallProps {
  categories: ArchiveCategory[];
  onFocusCover: (cover: string) => void;
}

/**
 * Desktop archive: a magazine wall. A sticky bar filters by category (the wall reflows with
 * motion); each category is a chapter titled in its color, its lead playlist a large tile.
 */
export function ArchiveWall({ categories, onFocusCover }: ArchiveWallProps): ReactElement {
  const [active, setActive] = useState<string>(ALL);
  const total = categories.reduce((n, c) => n + c.playlists.length, 0);
  const shown = active === ALL ? categories : categories.filter((c) => c.id === active);

  const filters = [
    { id: ALL, name: "הכל", count: total, rgb: "255, 255, 255" },
    ...categories.map((c) => ({ id: c.id, name: c.name, count: c.playlists.length, rgb: c.rgb })),
  ];

  return (
    <LayoutGroup>
      {/* Category bar */}
      <nav
        aria-label="סינון לפי קטגוריה"
        className="sticky top-16 z-30 -mx-4 mb-10 flex justify-center px-4 py-4"
      >
        <div className="flex gap-1 rounded-full border border-white/10 bg-[#07060f]/70 p-1.5 backdrop-blur-xl">
          {filters.map((f) => {
            const on = f.id === active;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setActive(f.id)}
                aria-pressed={on}
                className={cn(
                  "relative rounded-full px-5 py-2 text-sm font-medium transition-colors",
                  on ? "text-white" : "text-white/60 hover:text-white",
                )}
              >
                {on ? (
                  <motion.span
                    layoutId="archive-filter"
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: `rgba(${f.rgb}, 0.22)`,
                      boxShadow: `0 0 24px rgba(${f.rgb}, 0.35), inset 0 0 0 1px rgba(${f.rgb}, 0.6)`,
                    }}
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                ) : null}
                <span className="relative">
                  {f.name}
                  <span className="ms-1.5 text-xs text-white/45">{f.count}</span>
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      <div className="flex flex-col gap-16">
        <AnimatePresence mode="popLayout" initial={false}>
          {shown.map((cat) => (
            <motion.section
              key={cat.id}
              layout
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <motion.h2
                layout="position"
                className="mb-6 flex items-baseline gap-3 font-heading text-4xl font-bold"
                style={{ color: `rgb(${cat.rgb})`, textShadow: `0 0 30px rgba(${cat.rgb}, 0.35)` }}
              >
                {cat.name}
                <span className="font-sans text-sm font-medium text-white/40">
                  {cat.playlists.length === 1 ? "פלייליסט אחד" : `${cat.playlists.length} פלייליסטים`}
                </span>
              </motion.h2>

              {/* Bento: the lead playlist spans two columns and two rows */}
              <div className="grid auto-rows-[230px] grid-cols-3 gap-5">
                {cat.playlists.map((p, i) => (
                  <motion.div
                    key={p.id}
                    layout
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "0px 0px -10% 0px" }}
                    transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                    className={cn(i === 0 && "col-span-2 row-span-2")}
                  >
                    <ArchiveCard
                      playlist={p}
                      categoryName={cat.name}
                      rgb={cat.rgb}
                      size={i === 0 ? "feature" : "tile"}
                      onFocusCover={onFocusCover}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.section>
          ))}
        </AnimatePresence>
      </div>
    </LayoutGroup>
  );
}
