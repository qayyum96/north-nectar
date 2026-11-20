import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  applyRememberPreference,
  REMEMBER_COOKIE,
  supabaseEnv,
  type CookieToSet,
} from "@/lib/supabase/cookies";

/** Pages that work without signing in. */
const PUBLIC_PATHS = ["/login", "/forgot-password", "/auth/callback", "/reset-password"];

/**
 * Runs before every admin page: refreshes the Supabase session cookie and sends visitors who
 * aren't signed in to /login. Staff permissions are checked again in the (admin) layout and by
 * row level security in the database, so this is a convenience gate, not the only one.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, key } = supabaseEnv();
  const remember = request.cookies.get(REMEMBER_COOKIE)?.value !== "0";

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet: CookieToSet[], headers: Record<string, string>) => {
        const cookies = applyRememberPreference(toSet, remember);
        for (const { name, value } of cookies) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookies) response.cookies.set(name, value, options);
        for (const [k, v] of Object.entries(headers ?? {})) response.headers.set(k, v);
      },
    },
  });

  // Verifies the token with Supabase Auth (and refreshes it when needed).
  const { data } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some((p) => path === p || path.startsWith(`${p}/`));

  if (!data.user && !isPublic) {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.search = path === "/" ? "" : `?next=${encodeURIComponent(path + request.nextUrl.search)}`;
    return NextResponse.redirect(login);
  }
  if (data.user && path === "/login") {
    const home = request.nextUrl.clone();
    home.pathname = "/";
    home.search = "";
    return NextResponse.redirect(home);
  }
  return response;
}

export const config = {
  // Everything except static files and images.
  matcher: ["/((?!_next/static|_next/image|images/|favicon.ico|robots.txt).*)"],
};
