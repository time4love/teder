/**
 * Canonical site origin for shared links and OG URLs.
 * Override with `NEXT_PUBLIC_SITE_URL` (no trailing slash), e.g. for preview deployments.
 */
export const SITE_ORIGIN: string =
  typeof process.env.NEXT_PUBLIC_SITE_URL === "string" &&
  process.env.NEXT_PUBLIC_SITE_URL.trim() !== ""
    ? process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")
    : "https://tederyesharel.co.il";
