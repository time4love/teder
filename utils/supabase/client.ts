import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/utils/supabase/env";

export function createClient(): SupabaseClient {
  return createBrowserClient(getSupabaseUrl(), getSupabaseAnonKey());
}
