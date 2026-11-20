"use server";

import type { ContactMessage } from "@northnectar/types";
import {
  contactDefaults,
  contactSchema,
  errorSummary,
  type ContactField,
  type ContactInput,
  type ContactState,
} from "./schema";

const text = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
};

/**
 * Contact form Server Action. Validates with the same Zod schema as the browser, drops bot
 * submissions (honeypot) silently, and logs the message on the server.
 */
export async function sendContactMessage(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const values: ContactInput = {
    name: text(formData, "name"),
    email: text(formData, "email"),
    phone: text(formData, "phone"),
    subject: (text(formData, "subject") || contactDefaults.subject) as ContactInput["subject"],
    message: text(formData, "message"),
  };

  // Honeypot: hidden from people, often filled in by bots. Bots get a fake success.
  if (text(formData, "company").trim() !== "") {
    return { status: "success", id: crypto.randomUUID(), firstName: "there", email: values.email };
  }

  const parsed = contactSchema.safeParse(values);
  if (!parsed.success) {
    const fieldErrors: Partial<Record<ContactField, string>> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as ContactField | undefined;
      if (field && !fieldErrors[field]) fieldErrors[field] = issue.message;
    }
    const count = Object.keys(fieldErrors).length;
    return { status: "error", message: errorSummary(count), fieldErrors, values };
  }

  const data = parsed.data;
  const message: ContactMessage = {
    id: crypto.randomUUID(),
    name: data.name,
    email: data.email,
    ...(data.phone ? { phone: data.phone } : {}),
    subject: data.subject,
    message: data.message,
    createdAt: new Date().toISOString(),
    source: text(formData, "source").slice(0, 200) || "/contact",
  };

  // TODO(supabase): insert `message` into a `contact_messages` table (see packages/data/docs/supabase.md).
  // TODO(email): notify info@northnectar.com (e.g. Resend) and send the customer a confirmation.
  // Until then submissions are only written to the server log.
  console.info("[contact] message received", message);

  return {
    status: "success",
    id: message.id,
    firstName: data.name.split(/\s+/)[0] ?? data.name,
    email: data.email,
  };
}
