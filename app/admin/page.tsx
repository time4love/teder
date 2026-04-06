import { redirect } from "next/navigation";

/**
 * `/admin` redirects into the main admin surface (middleware already requires auth).
 */
export default function AdminIndexPage(): never {
  redirect("/admin/playlists");
}
