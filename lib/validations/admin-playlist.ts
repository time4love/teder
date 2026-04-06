import { z } from "zod";

/** Used by {@link PlaylistForm} (react-hook-form) and server actions after normalizing `sort_order` to a number. */
export const adminPlaylistFormSchema = z.object({
  title: z.string().min(1, "כותרת חובה").max(200, "כותרת ארוכה מדי"),
  description: z.string().optional(),
  cover_image_url: z.string().optional(),
  sort_order: z.number().int(),
});

export type AdminPlaylistFormValues = z.infer<typeof adminPlaylistFormSchema>;

export function parsePlaylistFormForDb(
  data: AdminPlaylistFormValues,
):
  | {
      title: string;
      description: string | null;
      cover_image_url: string | null;
      sort_order: number;
    }
  | { error: string } {
  const description =
    data.description !== undefined && data.description.trim() !== ""
      ? data.description.trim()
      : null;

  const cover = data.cover_image_url?.trim() ?? "";
  let cover_image_url: string | null = null;
  if (cover !== "") {
    const urlCheck = z.string().url().safeParse(cover);
    if (!urlCheck.success) {
      return { error: "כתובת תמונת הכיסוי לא תקינה" };
    }
    cover_image_url = cover;
  }

  return {
    title: data.title.trim(),
    description,
    cover_image_url,
    sort_order: data.sort_order,
  };
}

/** Parses `sort_order` from a form string (server actions). */
export function parseSortOrderString(raw: string): number {
  const t = raw.trim();
  if (t === "") return 0;
  const n = Number.parseInt(t, 10);
  return Number.isNaN(n) ? 0 : n;
}
