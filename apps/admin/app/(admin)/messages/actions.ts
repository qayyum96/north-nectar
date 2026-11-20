"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type Result = { ok: true; message: string } | { ok: false; error: string };
const id = z.string().uuid();

async function update(
  messageId: string,
  values: Record<string, unknown>,
  done: string,
): Promise<Result> {
  await requireStaff();
  if (!id.safeParse(messageId).success)
    return { ok: false, error: "That message no longer exists." };
  const supabase = await createClient();
  const { error } = await supabase.from("contact_messages").update(values).eq("id", messageId);
  if (error) return { ok: false, error: "Something went wrong. Please try again." };
  revalidatePath("/messages");
  revalidatePath("/", "layout");
  return { ok: true, message: done };
}

export async function resolveMessage(messageId: string) {
  return update(
    messageId,
    { status: "resolved", resolved_at: new Date().toISOString() },
    "Message marked as resolved",
  );
}

export async function reopenMessage(messageId: string) {
  return update(messageId, { status: "open", resolved_at: null }, "Message reopened");
}

export async function markUnread(messageId: string) {
  return update(messageId, { read_at: null }, "Marked as unread");
}
