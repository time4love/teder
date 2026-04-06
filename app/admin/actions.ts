"use server";

import { type SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import {
  adminPlaylistFormSchema,
  parsePlaylistFormForDb,
  parseSortOrderString,
} from "@/lib/validations/admin-playlist";
import {
  adminVideoFormSchema,
  parseAdminVideoForm,
  type AdminVideoFormValues,
} from "@/lib/validations/admin-video";
import { randomBytes } from "crypto";

import { createServiceRoleClient } from "@/utils/supabase/service-role";
import { getYouTubeVideoId } from "@/utils/youtube";

/**
 * Decodes common named and numeric HTML entities (server-safe).
 */
function decodeHtmlEntities(text: string): string {
  let t = text;
  t = t.replace(/&#x([0-9a-fA-F]+);/gi, (_, hex: string) =>
    String.fromCharCode(Number.parseInt(hex, 16)),
  );
  t = t.replace(/&#(\d+);/g, (_, num: string) =>
    String.fromCharCode(Number.parseInt(num, 10)),
  );
  t = t.replace(/&quot;/g, '"');
  t = t.replace(/&apos;/g, "'");
  t = t.replace(/&#39;/g, "'");
  t = t.replace(/&lt;/g, "<");
  t = t.replace(/&gt;/g, ">");
  t = t.replace(/&amp;/g, "&");
  return t;
}

function extractOgContent(html: string, property: "og:title" | "og:description"): string | null {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(
      `<meta\\s+property="${escaped}"\\s+content="([^"]*)"`,
      "i",
    ),
    new RegExp(
      `<meta\\s+content="([^"]*)"\\s+property="${escaped}"`,
      "i",
    ),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1] !== undefined) {
      return m[1];
    }
  }
  return null;
}

/**
 * Unescapes a JSON string value (sequence inside `"..."` in JSON).
 */
function unescapeJsonStringValue(raw: string): string {
  let s = raw;
  s = s.replace(/\\n/g, "\n");
  s = s.replace(/\\r/g, "\r");
  s = s.replace(/\\t/g, "\t");
  s = s.replace(/\\"/g, '"');
  s = s.replace(/\\\\/g, "\\");
  s = s.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex: string) =>
    String.fromCharCode(Number.parseInt(hex, 16)),
  );
  return s;
}

function extractTitleFromYoutubeHtml(html: string): string | null {
  const m = html.match(/<title>(.*?) - YouTube<\/title>/i);
  if (m?.[1] === undefined) return null;
  const t = decodeHtmlEntities(m[1]).trim();
  return t === "" ? null : t;
}

function extractShortDescriptionFromHtml(html: string): string | null {
  const re = /"shortDescription"\s*:\s*"((?:[^"\\]|\\.)*)"/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    const raw = match[1];
    if (raw === undefined) continue;
    return unescapeJsonStringValue(raw);
  }
  return null;
}

/**
 * Fetches the watch page HTML: title from {@code <title>}, description from embedded JSON
 * (`shortDescription` in `ytInitialPlayerResponse` / page scripts). Falls back to Open Graph.
 * May fail if YouTube blocks the request (use a public network in production).
 */
export async function fetchYouTubeMetadata(
  url: string,
): Promise<{ title: string; description: string } | { error: string }> {
  const trimmed = url.trim();
  if (trimmed === "") {
    return { error: "נא להזין כתובת YouTube" };
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(trimmed);
  } catch {
    return { error: "כתובת לא תקינה" };
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    return { error: "כתובת לא תקינה" };
  }

  if (getYouTubeVideoId(trimmed) === null) {
    return { error: "נא להזין קישור YouTube תקין" };
  }

  try {
    const res = await fetch(parsedUrl.toString(), {
      cache: "no-store",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,he;q=0.8",
      },
    });

    if (!res.ok) {
      return { error: `לא ניתן לטעון את הדף (${String(res.status)})` };
    }

    const html = await res.text();

    const titleFromTag = extractTitleFromYoutubeHtml(html);
    const titleOg = extractOgContent(html, "og:title");
    const title =
      titleFromTag ??
      (titleOg !== null && titleOg.trim() !== "" ? decodeHtmlEntities(titleOg).trim() : null);

    if (title === null || title === "") {
      return { error: "לא נמצאה כותרת בדף YouTube" };
    }

    const descFromJson = extractShortDescriptionFromHtml(html);
    const descOg = extractOgContent(html, "og:description");
    const description =
      descFromJson !== null
        ? descFromJson.trim()
        : descOg !== null
          ? decodeHtmlEntities(descOg).trim()
          : "";

    return { title, description };
  } catch (e) {
    const message = e instanceof Error ? e.message : "שגיאת רשת";
    console.error("[fetchYouTubeMetadata]", e);
    return { error: message };
  }
}

function getString(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v : "";
}

function getStringArray(formData: FormData, key: string): string[] {
  const all = formData.getAll(key);
  return all.filter((v): v is string => typeof v === "string" && v.trim() !== "");
}

const MEDIA_BUCKET = "media" as const;

/**
 * Uploads an image to the public `media` bucket and returns its public URL.
 */
async function uploadCoverImage(file: File): Promise<string> {
  const adminClient = createServiceRoleClient();
  const extension = file.name.split(".").pop() || "jpg";
  const safeFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${extension}`;
  const { error } = await adminClient.storage.from(MEDIA_BUCKET).upload(safeFileName, file, {
    contentType: file.type !== "" ? file.type : "application/octet-stream",
    upsert: false,
  });
  if (error !== null) {
    console.error("[uploadCoverImage]", error.message);
    throw new Error(error.message);
  }
  const { data } = adminClient.storage.from(MEDIA_BUCKET).getPublicUrl(safeFileName);
  return data.publicUrl;
}

/**
 * If `cover_image_file` is a non-empty file, uploads it and returns that URL;
 * otherwise returns the existing `cover_image_url` string (for manual URL or unchanged).
 */
async function resolveCoverImageInput(
  formData: FormData,
): Promise<{ cover_image_url: string } | { error: string }> {
  const entry = formData.get("cover_image_file");
  if (entry instanceof File && entry.size > 0) {
    try {
      const url = await uploadCoverImage(entry);
      return { cover_image_url: url };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "העלאת התמונה נכשלה";
      return { error: msg };
    }
  }
  return { cover_image_url: getString(formData, "cover_image_url") };
}

/**
 * Replaces all `playlist_videos` rows for a video.
 * `playlistPosition` matches `videos.sort_order` from the admin form so the
 * "סדר הופעה" field and the מיקום column on the playlist edit screen stay aligned.
 */
async function syncPlaylistVideosForVideo(
  supabase: SupabaseClient,
  videoId: string,
  playlistIds: string[],
  playlistPosition: number,
): Promise<{ error: string } | { success: true }> {
  const { error: delErr } = await supabase
    .from("playlist_videos")
    .delete()
    .eq("video_id", videoId);

  if (delErr !== null) {
    console.error("[syncPlaylistVideosForVideo] delete", delErr.message);
    return { error: delErr.message };
  }

  const uniquePlaylistIds = Array.from(new Set(playlistIds));

  if (uniquePlaylistIds.length === 0) {
    return { success: true };
  }

  const rows = uniquePlaylistIds.map((playlist_id) => ({
    playlist_id,
    video_id: videoId,
    position: playlistPosition,
  }));

  const { error: insErr } = await supabase.from("playlist_videos").insert(rows);
  if (insErr !== null) {
    console.error("[syncPlaylistVideosForVideo] insert", insErr.message);
    return { error: insErr.message };
  }

  return { success: true };
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUuid(id: string): boolean {
  return UUID_RE.test(id);
}

export type CreatedCategory = {
  id: string;
  name: string;
  slug: string;
};

/**
 * Creates a category with a unique URL-safe slug (service role bypasses RLS).
 */
export async function createCategoryAction(
  name: string,
): Promise<CreatedCategory | { error: string }> {
  const trimmed = name.trim();
  if (trimmed === "") {
    return { error: "שם הקטגוריה ריק" };
  }
  if (trimmed.length > 200) {
    return { error: "שם הקטגוריה ארוך מדי" };
  }

  try {
    const supabase = createServiceRoleClient();
    const slug = `cat-${String(Date.now())}-${randomBytes(6).toString("hex")}`;

    const { data, error } = await supabase
      .from("categories")
      .insert({
        name: trimmed,
        slug,
        sort_order: 0,
      })
      .select("id, name, slug")
      .single();

    if (error !== null) {
      console.error("[createCategoryAction]", error.message);
      return { error: error.message };
    }

    if (data === null) {
      return { error: "לא ניתן ליצור קטגוריה" };
    }

    revalidatePath("/");
    revalidatePath("/admin/videos");
    revalidatePath("/admin/videos/new");
    revalidatePath("/admin/playlists");

    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "שגיאה לא צפויה";
    console.error("[createCategoryAction]", e);
    return { error: message };
  }
}

export type CreatedPlaylist = {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  sort_order: number;
};

function revalidatePlaylistSurfaces(): void {
  revalidatePath("/");
  revalidatePath("/admin/playlists");
  revalidatePath("/admin/playlists/new");
  revalidatePath("/admin/videos");
  revalidatePath("/admin/videos/new");
}

/**
 * Creates a playlist from {@link FormData} (title, description, cover_image_url, sort_order).
 * Also used by quick-create in the video form with minimal fields.
 */
export async function createPlaylistAction(
  formData: FormData,
): Promise<CreatedPlaylist | { error: string }> {
  const resolvedCover = await resolveCoverImageInput(formData);
  if ("error" in resolvedCover) {
    return { error: resolvedCover.error };
  }

  const raw = {
    title: getString(formData, "title"),
    description: getString(formData, "description"),
    cover_image_url: resolvedCover.cover_image_url,
    sort_order: getString(formData, "sort_order"),
  };

  const parsed = adminPlaylistFormSchema.safeParse({
    ...raw,
    sort_order: parseSortOrderString(raw.sort_order),
  });

  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "שגיאת אימות";
    return { error: msg };
  }

  const row = parsePlaylistFormForDb(parsed.data);
  if ("error" in row) {
    return { error: row.error };
  }

  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("playlists")
      .insert({
        title: row.title,
        description: row.description,
        cover_image_url: row.cover_image_url,
        sort_order: row.sort_order,
      })
      .select("id, title, description, cover_image_url, sort_order")
      .single();

    if (error !== null) {
      console.error("[createPlaylistAction]", error.message);
      return { error: error.message };
    }

    if (data === null) {
      return { error: "לא ניתן ליצור פלייליסט" };
    }

    revalidatePlaylistSurfaces();

    return {
      id: data.id,
      title: data.title,
      description: data.description,
      cover_image_url:
        typeof data.cover_image_url === "string" ? data.cover_image_url : null,
      sort_order: typeof data.sort_order === "number" ? data.sort_order : 0,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "שגיאה לא צפויה";
    console.error("[createPlaylistAction]", e);
    return { error: message };
  }
}

/**
 * Updates a playlist row (magazine issue metadata).
 */
export async function updatePlaylistAction(
  id: string,
  formData: FormData,
): Promise<{ success: true } | { error: string }> {
  if (!isValidUuid(id)) {
    return { error: "מזהה פלייליסט לא תקין" };
  }

  const resolvedCover = await resolveCoverImageInput(formData);
  if ("error" in resolvedCover) {
    return { error: resolvedCover.error };
  }

  const raw = {
    title: getString(formData, "title"),
    description: getString(formData, "description"),
    cover_image_url: resolvedCover.cover_image_url,
    sort_order: getString(formData, "sort_order"),
  };

  const parsed = adminPlaylistFormSchema.safeParse({
    ...raw,
    sort_order: parseSortOrderString(raw.sort_order),
  });

  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "שגיאת אימות";
    return { error: msg };
  }

  const row = parsePlaylistFormForDb(parsed.data);
  if ("error" in row) {
    return { error: row.error };
  }

  try {
    const supabase = createServiceRoleClient();
    const { error } = await supabase
      .from("playlists")
      .update({
        title: row.title,
        description: row.description,
        cover_image_url: row.cover_image_url,
        sort_order: row.sort_order,
      })
      .eq("id", id);

    if (error !== null) {
      console.error("[updatePlaylistAction]", error.message);
      return { error: error.message };
    }

    revalidatePlaylistSurfaces();
    revalidatePath(`/admin/playlists/${id}/edit`);

    return { success: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "שגיאה לא צפויה";
    console.error("[updatePlaylistAction]", e);
    return { error: message };
  }
}

/**
 * Deletes a playlist and junction rows (FK cascade). Videos remain in `videos`.
 */
export async function deletePlaylistAction(
  id: string,
): Promise<{ success: true } | { error: string }> {
  if (!isValidUuid(id)) {
    return { error: "מזהה פלייליסט לא תקין" };
  }

  try {
    const supabase = createServiceRoleClient();
    const { error } = await supabase.from("playlists").delete().eq("id", id);

    if (error !== null) {
      console.error("[deletePlaylistAction]", error.message);
      return { error: error.message };
    }

    revalidatePlaylistSurfaces();

    return { success: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "שגיאה לא צפויה";
    console.error("[deletePlaylistAction]", e);
    return { error: message };
  }
}

/**
 * Inserts a video using the service role (bypasses RLS). Intended for trusted admin use only.
 */
export async function addVideoAction(
  formData: FormData,
): Promise<{ success: true } | { error: string }> {
  const resolvedCover = await resolveCoverImageInput(formData);
  if ("error" in resolvedCover) {
    return { error: resolvedCover.error };
  }

  const raw: AdminVideoFormValues = {
    youtube_url: getString(formData, "youtube_url"),
    title: getString(formData, "title"),
    description: getString(formData, "description"),
    category_id: getString(formData, "category_id"),
    playlist_ids: getStringArray(formData, "playlist_ids"),
    cover_image_url: resolvedCover.cover_image_url,
    sort_order: getString(formData, "sort_order"),
  };

  const parsed = adminVideoFormSchema.safeParse(raw);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "שגיאת אימות";
    return { error: msg };
  }

  const row = parseAdminVideoForm(parsed.data);
  if ("error" in row) {
    return { error: row.error };
  }

  try {
    const supabase = createServiceRoleClient();
    const { data: inserted, error } = await supabase
      .from("videos")
      .insert({
        youtube_url: row.youtube_url,
        title: row.title,
        description: row.description,
        category_id: row.category_id,
        cover_image_url: row.cover_image_url,
        sort_order: row.sort_order,
      })
      .select("id")
      .single();

    if (error !== null) {
      console.error("[addVideoAction]", error.message);
      return { error: error.message };
    }

    if (inserted === null || typeof inserted.id !== "string") {
      return { error: "לא נוצר מזהה סרטון" };
    }

    const sync = await syncPlaylistVideosForVideo(
      supabase,
      inserted.id,
      row.playlist_ids,
      row.sort_order,
    );
    if ("error" in sync) {
      return { error: sync.error };
    }

    revalidatePath("/");
    revalidatePath("/admin/videos");
    revalidatePath("/admin/playlists");
    for (const pid of row.playlist_ids) {
      revalidatePath(`/admin/playlists/${pid}/edit`);
    }
    return { success: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "שגיאה לא צפויה";
    console.error("[addVideoAction]", e);
    return { error: message };
  }
}

/**
 * Updates an existing video by ID using the service role (bypasses RLS).
 */
export async function updateVideoAction(
  id: string,
  formData: FormData,
): Promise<{ success: true } | { error: string }> {
  if (!isValidUuid(id)) {
    return { error: "מזהה סרטון לא תקין" };
  }

  const resolvedCover = await resolveCoverImageInput(formData);
  if ("error" in resolvedCover) {
    return { error: resolvedCover.error };
  }

  const raw: AdminVideoFormValues = {
    youtube_url: getString(formData, "youtube_url"),
    title: getString(formData, "title"),
    description: getString(formData, "description"),
    category_id: getString(formData, "category_id"),
    playlist_ids: getStringArray(formData, "playlist_ids"),
    cover_image_url: resolvedCover.cover_image_url,
    sort_order: getString(formData, "sort_order"),
  };

  const parsed = adminVideoFormSchema.safeParse(raw);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "שגיאת אימות";
    return { error: msg };
  }

  const row = parseAdminVideoForm(parsed.data);
  if ("error" in row) {
    return { error: row.error };
  }

  try {
    const supabase = createServiceRoleClient();
    const { error } = await supabase
      .from("videos")
      .update({
        youtube_url: row.youtube_url,
        title: row.title,
        description: row.description,
        category_id: row.category_id,
        cover_image_url: row.cover_image_url,
        sort_order: row.sort_order,
      })
      .eq("id", id);

    if (error !== null) {
      console.error("[updateVideoAction]", error.message);
      return { error: error.message };
    }

    const sync = await syncPlaylistVideosForVideo(
      supabase,
      id,
      row.playlist_ids,
      row.sort_order,
    );
    if ("error" in sync) {
      return { error: sync.error };
    }

    revalidatePath("/");
    revalidatePath("/admin/videos");
    revalidatePath("/admin/playlists");
    for (const pid of row.playlist_ids) {
      revalidatePath(`/admin/playlists/${pid}/edit`);
    }
    return { success: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "שגיאה לא צפויה";
    console.error("[updateVideoAction]", e);
    return { error: message };
  }
}

/**
 * Deletes a video by ID using the service role (bypasses RLS).
 */
export async function deleteVideoAction(
  id: string,
): Promise<{ success: true } | { error: string }> {
  if (!isValidUuid(id)) {
    return { error: "מזהה סרטון לא תקין" };
  }

  try {
    const supabase = createServiceRoleClient();
    const { error } = await supabase.from("videos").delete().eq("id", id);

    if (error !== null) {
      console.error("[deleteVideoAction]", error.message);
      return { error: error.message };
    }

    revalidatePath("/");
    revalidatePath("/admin/videos");
    revalidatePath("/admin/playlists");
    return { success: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "שגיאה לא צפויה";
    console.error("[deleteVideoAction]", e);
    return { error: message };
  }
}
