import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Supabase client with the SECRET key. Bypasses row level security, so only use it for work a
 * signed-in user can't do with their own permissions (e.g. inviting staff in Phase 5), and only
 * after checking the user's role in code.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_SERVICE_ROLE_KEY must be set.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
