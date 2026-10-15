import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseAnonKey, getSupabaseUrl } from "@/utils/supabase/env";

/** Cache tag on every public read — admin edits revalidate it. */
export const PUBLIC_CONTENT_TAG = "public-content" as const;

/** Upper bound on how stale public pages may get if an edit's revalidation is missed. */
export const PUBLIC_REVALIDATE_SECONDS = 300;

/**
 * Anon-key client for public, read-only queries (RLS decides what it may read).
 *
 * Unlike the cookie-based server client it is not tied to a request, so pages that use it
 * stay static and are served from Vercel's cache (ISR) instead of rendering per visit.
 * Its responses are cached under {@link PUBLIC_CONTENT_TAG}.
 */
export function createPublicClient(): SupabaseClient {
  return createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input: RequestInfo | URL, init?: RequestInit) =>
        fetch(input, {
          ...init,
          next: { revalidate: PUBLIC_REVALIDATE_SECONDS, tags: [PUBLIC_CONTENT_TAG] },
        }),
    },
  });
}
