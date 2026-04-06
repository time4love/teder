import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseUrl } from "@/utils/supabase/env";
import { createClient as createServerSupabaseClient } from "@/utils/supabase/server";

const noSession = {
  persistSession: false,
  autoRefreshToken: false,
} as const;

/**
 * Next.js can cache `fetch` responses; PostgREST reads for admin must stay fresh.
 */
function fetchNoStore(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  return fetch(input, {
    ...init,
    cache: "no-store",
  });
}

function createBrowserlessClient(url: string, key: string): SupabaseClient {
  return createClient(url, key, {
    auth: noSession,
    global: { fetch: fetchNoStore },
  });
}

/**
 * Server-only client with the service role key (bypasses RLS). For trusted
 * server code only (e.g. admin server actions).
 */
export function createServiceRoleClient(): SupabaseClient {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (key === undefined || key.trim() === "") {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  }
  return createBrowserlessClient(getSupabaseUrl(), key.trim());
}

/**
 * Loads admin UI lists (categories, playlists, videos). Prefers the service
 * role key so reads align with mutations and are not affected by anon key or
 * cookie session issues. Falls back to the cookie-based server client if the
 * service key is unset.
 */
export function createAdminSupabaseClient(): SupabaseClient {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (typeof key === "string" && key.trim() !== "") {
    return createBrowserlessClient(getSupabaseUrl(), key.trim());
  }
  return createServerSupabaseClient();
}
