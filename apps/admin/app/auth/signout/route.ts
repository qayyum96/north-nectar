import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Signs out (used when a signed-in account isn't, or is no longer, on the team). */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const reason = request.nextUrl.searchParams.get("reason");
  const target = new URL("/login", request.nextUrl.origin);
  if (reason === "no-access") target.searchParams.set("error", "no-access");
  return NextResponse.redirect(target);
}
