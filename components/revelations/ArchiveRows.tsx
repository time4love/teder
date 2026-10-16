"use client";

import type { ReactElement, RefObject } from "react";
import { useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";

import { ArchiveCard } from "@/components/revelations/ArchiveCard";
import type { ArchiveCategory } from "@/lib/archive";

/**
 * Phone archive: one row per category. Sticky chips jump between categories; each row is
 * a swipeable carousel of large cards that snap into place, the centered one brightest.
 */
export function ArchiveRows({ categories }: { categories: ArchiveCategory[] }): ReactElement {
  return (
    <div>
      {/* Category chips */}
      <nav
        aria-label="קטגוריות"
        className="sticky top-16 z-30 -mx-4 mb-6 flex gap-2 overflow-x-auto bg-gradient-to-b from-[#07060f] via-[#07060f]/90 to-transparent px-4 pb-5 pt-3 [scrollbar-width:none]"
      >
        {categories.map((c) => (
          <a
            key={c.id}
            href={`#cat-${c.id}`}
            className="shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium text-white/85"
            style={{ borderColor: `rgba(${c.rgb}, 0.55)`, background: `rgba(${c.rgb}, 0.14)` }}
          >
            {c.name}
            <span className="ms-1.5 text-xs text-white/45">{c.playlists.length}</span>
          </a>
        ))}
      </nav>

      <div className="flex flex-col gap-10">
        {categories.map((c) => (
          <CategoryRow key={c.id} category={c} />
        ))}
      </div>
    </div>
  );
}

function CategoryRow({ category }: { category: ArchiveCategory }): ReactElement {
  const rowRef = useRef<HTMLDivElement>(null);

  return (
    // scroll-mt clears the sticky header and chips when jumping here
    <section id={`cat-${category.id}`} className="scroll-mt-36">
      <h2
        className="mb-4 flex items-baseline gap-2 font-heading text-3xl font-bold"
        style={{ color: `rgb(${category.rgb})`, textShadow: `0 0 24px rgba(${category.rgb}, 0.35)` }}
      >
        {category.name}
        <span className="font-sans text-xs font-medium text-white/40">
          {category.playlists.length === 1 ? "פלייליסט אחד" : `${category.playlists.length} פלייליסטים`}
        </span>
      </h2>
      <div
        ref={rowRef}
        className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-2 [scrollbar-width:none]"
      >
        {category.playlists.map((p) => (
          <Slide key={p.id} rowRef={rowRef}>
            <ArchiveCard playlist={p} categoryName={category.name} rgb={category.rgb} size="slide" />
          </Slide>
        ))}
      </div>
    </section>
  );
}

/** A carousel card that brightens and grows while it's the one centered in its row. */
function Slide({
  rowRef,
  children,
}: {
  rowRef: RefObject<HTMLDivElement>;
  children: ReactElement;
}): ReactElement {
  const reduceMotion = useReducedMotion() === true;
  return (
    <motion.div
      className="aspect-[4/5] w-[80vw] max-w-[340px] shrink-0 snap-center"
      initial={reduceMotion ? false : { opacity: 0.55, scale: 0.94 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ root: rowRef, amount: 0.75 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
