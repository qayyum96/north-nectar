"use server";

import { supabaseService } from "@/lib/supabase/server";
import { newsletterSchema, type NewsletterState } from "./schema";

export async function subscribeToNewsletter(
  _prev: NewsletterState,
  formData: FormData,
): Promise<NewsletterState> {
  const parsed = newsletterSchema.safeParse({
    email: formData.get("email"),
    company: formData.get("company") ?? undefined,
    source: formData.get("source") ?? undefined,
  });

  if (!parsed.success) {
    const honeypotTripped = parsed.error.issues.some((i) => i.path[0] === "company");
    // Bots get a fake success so they learn nothing.
    if (honeypotTripped) return { status: "success", message: "Thank you for subscribing." };
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Please check your email",
    };
  }

  // Re-subscribing clears an earlier unsubscribe. Duplicates are fine (primary key on email).
  const { error } = await supabaseService()
    .from("newsletter_subscribers")
    .upsert(
      {
        email: parsed.data.email.toLowerCase(),
        source: parsed.data.source ?? null,
        unsubscribed_at: null,
      },
      { onConflict: "email" },
    );
  if (error) {
    console.error("[newsletter] could not save subscription", error.message);
    return { status: "error", message: "Sorry, that didn't work. Please try again." };
  }

  return { status: "success", message: "You're in. Watch your inbox for the next harvest." };
}
