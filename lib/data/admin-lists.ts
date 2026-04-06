import { unstable_noStore as noStore } from "next/cache";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Category, Playlist, Video } from "@/types/database";
import {
  mapCategoryRows,
  mapPlaylistRows,
  mapPlaylistVideoLinkRows,
  mapVideoRows,
} from "@/lib/mappers/database";

/**
 * Dedicated Supabase client with the service role key (RLS bypass). Created
 * inside loaders only — do not share with browser code.
 */
function createAdminServiceRoleClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url === undefined || url === "" || key === undefined || key === "") {
    return null;
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export type AdminCategoryPlaylistResult = {
  categories: Category[];
  playlists: Playlist[];
  errors: string[];
};

export async function loadAdminCategoriesAndPlaylists(): Promise<AdminCategoryPlaylistResult> {
  noStore();
  const adminClient = createAdminServiceRoleClient();
  if (adminClient === null) {
    const msg = "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY";
    console.error("Admin Fetch Error:", msg);
    return { categories: [], playlists: [], errors: [msg] };
  }

  const [catRes, plRes] = await Promise.all([
    adminClient
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true }),
    adminClient
      .from("playlists")
      .select("*")
      .order("sort_order", { ascending: true }),
  ]);

  if (catRes.error !== null) {
    console.error("Admin Fetch Error:", catRes.error);
  }
  if (plRes.error !== null) {
    console.error("Admin Fetch Error:", plRes.error);
  }

  const categories = mapCategoryRows(catRes.data);
  const playlists = mapPlaylistRows(plRes.data);

  console.log("Admin Fetched Categories:", categories);
  console.log("Admin Fetched Playlists:", playlists);

  const errors: string[] = [];
  if (catRes.error !== null) {
    errors.push(`קטגוריות: ${catRes.error.message}`);
  }
  if (plRes.error !== null) {
    errors.push(`פלייליסטים: ${plRes.error.message}`);
  }

  return { categories, playlists, errors };
}

export type PlaylistVideoLink = {
  video_id: string;
  playlist_id: string;
  position: number;
};

export async function loadAdminVideosDashboard(): Promise<{
  categories: Category[];
  playlists: Playlist[];
  videos: Video[];
  playlistVideoLinks: PlaylistVideoLink[];
  errors: string[];
}> {
  noStore();
  const adminClient = createAdminServiceRoleClient();
  if (adminClient === null) {
    const msg = "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY";
    console.error("Admin Fetch Error:", msg);
    return {
      categories: [],
      playlists: [],
      videos: [],
      playlistVideoLinks: [],
      errors: [msg],
    };
  }

  const [catRes, plRes, vidRes, pvRes] = await Promise.all([
    adminClient
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true }),
    adminClient
      .from("playlists")
      .select("*")
      .order("sort_order", { ascending: true }),
    adminClient
      .from("videos")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false }),
    adminClient
      .from("playlist_videos")
      .select("video_id, playlist_id, position"),
  ]);

  if (catRes.error !== null) {
    console.error("Admin Fetch Error:", catRes.error);
  }
  if (plRes.error !== null) {
    console.error("Admin Fetch Error:", plRes.error);
  }
  if (vidRes.error !== null) {
    console.error("Admin Fetch Error:", vidRes.error);
  }
  if (pvRes.error !== null) {
    console.error("Admin Fetch Error:", pvRes.error);
  }

  const categories = mapCategoryRows(catRes.data);
  const playlists = mapPlaylistRows(plRes.data);
  console.log("Admin Fetched Categories:", categories);

  const videos = mapVideoRows(vidRes.data);
  const playlistVideoLinks = mapPlaylistVideoLinkRows(pvRes.data);

  const errors: string[] = [];
  if (catRes.error !== null) {
    errors.push(`קטגוריות: ${catRes.error.message}`);
  }
  if (plRes.error !== null) {
    errors.push(`פלייליסטים: ${plRes.error.message}`);
  }
  if (vidRes.error !== null) {
    errors.push(`סרטונים: ${vidRes.error.message}`);
  }
  if (pvRes.error !== null) {
    errors.push(`קישורי פלייליסט: ${pvRes.error.message}`);
  }

  return {
    categories,
    playlists,
    videos,
    playlistVideoLinks,
    errors,
  };
}
