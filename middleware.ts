import { NextResponse, type NextRequest } from "next/server";

import { createMiddlewareSupabase } from "@/utils/supabase/middleware";

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { supabase, response } = createMiddlewareSupabase(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAdminLogin =
    path === "/admin/login" || path.startsWith("/admin/login/");
  const isUnderAdmin = path === "/admin" || path.startsWith("/admin/");

  if (isUnderAdmin && !isAdminLogin && user === null) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "";
    const redirectResponse = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => {
      redirectResponse.cookies.set(c.name, c.value);
    });
    return redirectResponse;
  }

  if (isAdminLogin && user !== null) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/playlists";
    url.search = "";
    const redirectResponse = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => {
      redirectResponse.cookies.set(c.name, c.value);
    });
    return redirectResponse;
  }

  return response;
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
