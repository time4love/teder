/** Global header (4rem) + category pills strip — keeps snap feed below fixed chrome. */
export const FEED_TOP_PADDING_CLASS = "pt-[9rem]" as const;

/** Empty-state area height matches feed minus top padding. */
export const FEED_EMPTY_MIN_HEIGHT_CLASS = "min-h-[calc(100dvh-9rem)]" as const;

/** Sticky playlist title bar offset inside the feed scrollport. */
export const PLAYLIST_STICKY_HEADER_TOP_CLASS = "top-[9rem]" as const;

/** Extra top padding so feed content clears fixed category pills. */
export const SERIES_DOTS_BOTTOM_CLASS = "bottom-28" as const;

/** Minimum intersection ratio to treat a horizontal slide as “active” for dots. */
export const SERIES_SLIDE_VISIBLE_RATIO = 0.55 as const;
