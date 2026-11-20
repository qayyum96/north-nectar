import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { applyRememberPreference, REMEMBER_COOKIE, supabaseEnv, type CookieToSet } from "./cookies";

/**
 * Supabase client for Server Components, Server Actions and Route Handlers, acting AS THE
 * SIGNED-IN USER (publishable key + session cookie). Every query goes through row level
 * security, so staff only see what their role allows.
 */
export async function createClient(options: { remember?: boolean } = {}) {
  const jar = await cookies();
  const { url, key } = supabaseEnv();
  const remember = options.remember ?? jar.get(REMEMBER_COOKIE)?.value !== "0";

  return createServerClient(url, key, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (toSet: CookieToSet[]) => {
        try {
          for (const { name, value, options } of applyRememberPreference(toSet, remember)) {
            jar.set(name, value, options);
          }
        } catch {
          // Server Components can't set cookies; the proxy refreshes the session instead.
        }
      },
    },
  });
}
