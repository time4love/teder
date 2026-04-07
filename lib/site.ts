/**
 * Canonical origin for `metadataBase`, Open Graph resolution, and shared links.
 *
 * Priority: `NEXT_PUBLIC_SITE_URL` → Vercel preview/production host (`VERCEL_URL`) → localhost.
 * Set `NEXT_PUBLIC_SITE_URL` to your custom domain once DNS is live.
 */

const defaultUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, "")}`
    : "http://localhost:3000");

export const SITE_ORIGIN: string = String(defaultUrl).replace(/\/$/, "");

/**
 * Fully qualified image URL for Open Graph / Twitter cards (scrapers require absolute URLs).
 */
export function absoluteOgImageUrl(href: string | null | undefined): string {
  const raw = typeof href === "string" ? href.trim() : "";
  const path = raw !== "" ? raw : "/logo.png";
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_ORIGIN}${normalized}`;
}
