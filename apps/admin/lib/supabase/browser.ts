"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client for the browser, signed in as the current staff member (session cookie).
 * Used only for uploading images straight to Storage; row level security checks the role.
 */
export function createBrowserSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
