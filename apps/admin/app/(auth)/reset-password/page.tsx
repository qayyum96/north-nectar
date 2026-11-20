import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ResetPasswordForm } from "../auth-form";

export const metadata: Metadata = { title: "New password" };

/** Reached from the reset email (via /auth/callback, which signs the user in for this step). */
export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login?error=link-expired");
  return <ResetPasswordForm />;
}
