import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type StaffRole = "owner" | "manager" | "staff";

export interface CurrentStaff {
  userId: string;
  name: string;
  email: string;
  role: StaffRole;
}

/** The signed-in staff member, or null (not signed in, or not on the team). Once per request. */
export const getCurrentStaff = cache(async (): Promise<CurrentStaff | null> => {
  const supabase = await createClient();
  // Checked locally against the project's public signing key: no round trip to Supabase Auth.
  // The database still verifies the same token (row level security) on every query.
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (!userId) return null;
  const { data } = await supabase
    .from("staff")
    .select("user_id, name, email, role, status")
    .eq("user_id", userId)
    .maybeSingle<{
      user_id: string;
      name: string;
      email: string;
      role: StaffRole;
      status: string;
    }>();
  if (!data || data.status === "disabled") return null;
  if (data.status === "invited") {
    // First sign-in after accepting an invite (Settings > Team and roles).
    const { createServiceClient } = await import("@/lib/supabase/service");
    await createServiceClient()
      .from("staff")
      .update({ status: "active", last_active_at: new Date().toISOString() })
      .eq("user_id", data.user_id);
  }
  return {
    userId: data.user_id,
    name: data.name || data.email.split("@")[0] || "Team member",
    email: data.email,
    role: data.role,
  };
});

/**
 * Use at the top of every admin page/layout. Visitors go to /login; signed-in accounts that
 * aren't active staff are signed out with an explanation.
 */
export async function requireStaff(roles?: StaffRole[]): Promise<CurrentStaff> {
  const staff = await getCurrentStaff();
  if (!staff) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    redirect(data?.claims?.sub ? "/auth/signout?reason=no-access" : "/login");
  }
  if (roles && !roles.includes(staff.role)) redirect("/?denied=1");
  return staff;
}

/** "Qayyum Ahmed" -> "QA" */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters =
    parts.length > 1 ? `${parts[0]![0]}${parts[1]![0]}` : (parts[0] ?? "?").slice(0, 2);
  return letters.toUpperCase();
}
