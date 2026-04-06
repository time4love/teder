import type { ReactNode } from "react";

/**
 * Admin routes must always load fresh DB lists (categories, playlists, videos).
 * Without this, pages using the service-role Supabase client (no `cookies()`)
 * can be statically generated once and keep empty props forever.
 */
export const dynamic = "force-dynamic";

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}): ReactNode {
  return children;
}
