/**
 * Reads Supabase public URL from the environment (server or client).
 * @throws Error if the variable is missing or empty.
 */
export function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (url === undefined || url === "") {
    throw new Error("Missing environment variable: NEXT_PUBLIC_SUPABASE_URL");
  }
  return url;
}

/**
 * Reads Supabase anonymous key from the environment (server or client).
 * @throws Error if the variable is missing or empty.
 */
export function getSupabaseAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (key === undefined || key === "") {
    throw new Error("Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  return key;
}
