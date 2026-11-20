/**
 * "Keep me signed in on this device": when unticked at sign-in we set REMEMBER_COOKIE=0, and
 * every later auth cookie write drops its expiry, so the session ends when the browser closes.
 */
export const REMEMBER_COOKIE = "nn-admin-remember";

export interface CookieToSet {
  name: string;
  value: string;
  options: Record<string, unknown>;
}

export function applyRememberPreference(cookies: CookieToSet[], remember: boolean): CookieToSet[] {
  if (remember) return cookies;
  return cookies.map(({ name, value, options }) => {
    const rest = { ...options };
    // Keep deletions (maxAge 0) intact; make every other auth cookie a session cookie.
    if (rest.maxAge !== 0) {
      delete rest.maxAge;
      delete rest.expires;
    }
    return { name, value, options: rest };
  });
}

export function supabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set.");
  }
  return { url, key };
}
