/**
 * Extracts the YouTube video ID from common URL formats (watch, embed, shorts, youtu.be).
 * @returns The 11-character id when parsable, otherwise `null`.
 */
export function getYouTubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      return id ?? null;
    }

    if (host.includes("youtube.com")) {
      if (parsed.pathname.startsWith("/embed/")) {
        return parsed.pathname.split("/")[2] ?? null;
      }
      if (parsed.pathname.startsWith("/shorts/")) {
        return parsed.pathname.split("/")[2] ?? null;
      }
      const v = parsed.searchParams.get("v");
      if (v) return v;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Highest-resolution YouTube poster URL for a watch/embed URL (may 404 for some videos;
 * clients can fall back to `hqdefault` if needed).
 */
export function getYouTubeThumbnail(url: string): string | null {
  const id = getYouTubeVideoId(url);
  if (id === null) return null;
  return `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
}

/**
 * Builds a `youtube.com/embed/...` URL with query flags for autoplay and branding.
 */
export function getYouTubeEmbedSrc(url: string, autoplay: boolean): string | null {
  const id = getYouTubeVideoId(url);
  if (id === null) return null;
  const params = new URLSearchParams({
    autoplay: autoplay ? "1" : "0",
    rel: "0",
    modestbranding: "1",
  });
  return `https://www.youtube.com/embed/${id}?${params.toString()}`;
}
