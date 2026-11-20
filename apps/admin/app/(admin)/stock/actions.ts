"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { revalidateStorefront } from "@/lib/revalidate";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  variantId: z.string().min(1).max(80),
  mode: z.enum(["add", "remove", "set"]),
  quantity: z.number().int().min(0).max(1_000_000),
  reason: z.string().trim().max(40),
  note: z.string().trim().max(500),
  reorderAt: z.number().int().min(0).max(100_000).nullable(),
  /** null = leave as is, -1 = clear. */
  unitCost: z.number().int().min(-1).max(10_000_000).nullable(),
});

export type AdjustInput = z.input<typeof schema>;
export type AdjustResult = { ok: true; message: string } | { ok: false; error: string };

export async function adjustStock(input: AdjustInput): Promise<AdjustResult> {
  await requireStaff(["owner", "manager"]);
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the quantity." };
  const v = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_adjust_stock", {
    p_variant: v.variantId,
    p_mode: v.mode,
    p_quantity: v.quantity,
    p_reason: v.reason,
    p_note: v.note,
    p_reorder_at: v.reorderAt,
    p_unit_cost: v.unitCost,
  });
  if (error) {
    const reserved = /BELOW_RESERVED:(\d+)/.exec(error.message);
    if (reserved)
      return {
        ok: false,
        error: `${reserved[1]} units are held by open orders, so stock can't go lower.`,
      };
    if (error.message.includes("NOT_ENOUGH_STOCK"))
      return { ok: false, error: "You can't remove more than is on hand." };
    if (error.message.includes("NOT_ALLOWED"))
      return { ok: false, error: "Only owners and managers can adjust stock." };
    return { ok: false, error: "The adjustment couldn't be saved. Please try again." };
  }
  revalidatePath("/stock");
  revalidatePath("/movements");
  revalidatePath("/products");
  revalidatePath("/", "layout");
  await revalidateStorefront();
  return { ok: true, message: data ? `Stock updated · ${data as string}` : "Settings saved" };
}
