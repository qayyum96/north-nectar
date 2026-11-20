"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod/mini";
import { REMEMBER_COOKIE } from "@/lib/supabase/cookies";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/safe-next";
import { createServiceClient } from "@/lib/supabase/service";

export interface AuthFormState {
  status: "idle" | "error" | "success";
  message?: string;
  /** Echoed back so the email field keeps its value after an error. */
  email?: string;
}

const emailSchema = z.pipe(
  z.string().check(z.trim(), z.minLength(1, "Enter your email")),
  z.email("Enter a valid email, like you@northnectar.com"),
);

async function origin(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_ADMIN_URL;
  if (configured) return configured.replace(/\/+$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3001";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function signIn(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const remember = formData.get("remember") === "on";
  const mismatch: AuthFormState = {
    status: "error",
    message: "That email and password don't match. Try again or reset your password.",
    email,
  };
  if (!z.safeParse(emailSchema, email).success || password.length === 0) return mismatch;

  const jar = await cookies();
  jar.set(REMEMBER_COOKIE, remember ? "1" : "0", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    ...(remember ? { maxAge: 60 * 60 * 24 * 400 } : {}),
  });

  const supabase = await createClient({ remember });
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return mismatch;

  // Only active team members may use the admin.
  const { data: staff } = await supabase
    .from("staff")
    .select("status")
    .eq("user_id", data.user.id)
    .maybeSingle<{ status: string }>();
  if (!staff || staff.status === "disabled") {
    await supabase.auth.signOut();
    return {
      status: "error",
      message: "This account doesn't have access to the admin. Ask the store owner to invite you.",
      email,
    };
  }

  await createServiceClient()
    .from("staff")
    .update({ last_active_at: new Date().toISOString(), status: "active" })
    .eq("user_id", data.user.id);

  redirect(safeNext(formData.get("next")));
}

export async function requestPasswordReset(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!z.safeParse(emailSchema, email).success) {
    return { status: "error", message: "Enter a valid email, like you@northnectar.com", email };
  }
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await origin()}/auth/callback?next=/reset-password`,
  });
  // Same answer whether or not the account exists, so the form can't be used to find accounts.
  return {
    status: "success",
    message: `If ${email} belongs to a team member, a reset link is on its way. Check your inbox.`,
    email,
  };
}

export async function updatePassword(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < 10) {
    return { status: "error", message: "Use at least 10 characters." };
  }
  if (password !== confirm) return { status: "error", message: "The two passwords don't match." };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return {
      status: "error",
      message: "That reset link has expired. Request a new one from the sign-in page.",
    };
  }
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
