import { z } from "zod";

const youtubeRefine = (url: string): boolean =>
  /youtube\.com|youtu\.be/i.test(url);

export const adminVideoFormSchema = z.object({
  youtube_url: z
    .string()
    .min(1, "נא להזין כתובת")
    .url("כתובת לא תקינה")
    .refine(youtubeRefine, "נא להזין קישור YouTube תקין"),
  title: z.string().min(1, "כותרת חובה"),
  description: z.string().optional(),
  category_id: z.string().min(1, "נא לבחור קטגוריה"),
  playlist_ids: z.array(z.string().uuid()),
  cover_image_url: z.string().optional(),
  /** Display order; lower appears first. Empty defaults to 0 in parse. */
  sort_order: z.string().optional(),
});

export type AdminVideoFormValues = z.infer<typeof adminVideoFormSchema>;

export function parseAdminVideoForm(
  data: AdminVideoFormValues,
): {
  youtube_url: string;
  title: string;
  description: string | null;
  category_id: string;
  playlist_ids: string[];
  cover_image_url: string | null;
  sort_order: number;
} | { error: string } {
  const description =
    data.description !== undefined && data.description.trim() !== ""
      ? data.description.trim()
      : null;

  let cover_image_url: string | null = null;
  const cover = data.cover_image_url?.trim() ?? "";
  if (cover !== "") {
    const urlCheck = z.string().url().safeParse(cover);
    if (!urlCheck.success) {
      return { error: "כתובת תמונת כיסוי לא תקינה" };
    }
    cover_image_url = cover;
  }

  const sortStr = data.sort_order?.trim() ?? "";
  let sort_order = 0;
  if (sortStr !== "") {
    if (!/^-?\d+$/.test(sortStr)) {
      return { error: "סדר הופעה חייב להיות מספר שלם" };
    }
    sort_order = Number.parseInt(sortStr, 10);
  }

  const seen = new Set<string>();
  const playlist_ids: string[] = [];
  for (const id of data.playlist_ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    playlist_ids.push(id);
  }

  return {
    youtube_url: data.youtube_url.trim(),
    title: data.title.trim(),
    description,
    category_id: data.category_id,
    playlist_ids,
    cover_image_url,
    sort_order,
  };
}
