"use server";

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

  // TODO(supabase): insert into a `newsletter_subscribers` table (unique on email) and/or sync
  // to the email provider. Until then the subscription is only logged on the server.
  console.info("[newsletter] subscription", {
    email: parsed.data.email,
    source: parsed.data.source,
    at: new Date().toISOString(),
  });

  return { status: "success", message: "You're in. Watch your inbox for the next harvest." };
}
