"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { revalidateStorefront } from "@/lib/revalidate";
import { createClient } from "@/lib/supabase/server";

const line = z
  .object({
    variantId: z.string().max(80),
    description: z.string().trim().max(160),
    detail: z.string().trim().max(160),
    quantity: z.number().int().min(1, "Add a quantity").max(10_000_000),
    unitCost: z.number().int().min(0, "Add a unit cost").max(100_000_000),
  })
  .refine((l) => l.variantId || l.description, {
    message: "Choose a product or describe the item",
    path: ["description"],
  });

const schema = z.object({
  supplierId: z.string().uuid("Choose a supplier"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose the purchase date"),
  reference: z.string().trim().max(60),
  lines: z.array(line).min(1, "Add at least one item").max(60),
  deliveryCost: z.number().int().min(0).max(10_000_000),
  payment: z.enum(["paid", "partly", "unpaid"]),
  amountPaid: z.number().int().min(0).max(1_000_000_000),
  paidBy: z.string().trim().max(40),
  notes: z.string().trim().max(2000),
  bill: z
    .object({ path: z.string().max(300), name: z.string().max(200), size: z.number().int() })
    .nullable(),
});

export type PurchaseInput = z.input<typeof schema>;
export type PurchaseResult =
  | { ok: true; id: string; number: string; message: string }
  | { ok: false; error: string; fields?: Record<string, string> };

async function after() {
  revalidatePath("/purchases");
  revalidatePath("/suppliers");
  revalidatePath("/stock");
  revalidatePath("/movements");
  revalidatePath("/products");
  revalidatePath("/", "layout");
  await revalidateStorefront();
}

export async function recordPurchase(input: PurchaseInput): Promise<PurchaseResult> {
  await requireStaff(["owner", "manager"]);
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const i of parsed.error.issues) fields[i.path.join(".")] ??= i.message;
    return { ok: false, error: "Please check the highlighted fields.", fields };
  }
  const v = parsed.data;
  const total = v.lines.reduce((s, l) => s + l.quantity * l.unitCost, 0) + v.deliveryCost;
  const paid =
    v.payment === "paid" ? total : v.payment === "unpaid" ? 0 : Math.min(v.amountPaid, total);
  if (v.payment === "partly" && (paid <= 0 || paid >= total)) {
    return {
      ok: false,
      error: "For a part payment, enter an amount between zero and the total.",
      fields: { amountPaid: "Between 0 and the total" },
    };
  }
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_record_purchase", {
    p: {
      supplier_id: v.supplierId,
      purchase_date: v.date,
      reference: v.reference,
      delivery_cost: v.deliveryCost,
      amount_paid: paid,
      paid_by: paid > 0 ? v.paidBy : "",
      notes: v.notes,
      bill_path: v.bill?.path ?? "",
      bill_name: v.bill?.name ?? "",
      bill_size: v.bill?.size ?? null,
      lines: v.lines.map((l) => ({
        variant_id: l.variantId || null,
        description: l.description,
        detail: l.detail,
        quantity: l.quantity,
        unit_cost: l.unitCost,
      })),
    },
  });
  if (error) {
    if (error.message.includes("NOT_ALLOWED"))
      return { ok: false, error: "Only owners and managers can record purchases." };
    return { ok: false, error: "The purchase couldn't be saved. Please try again." };
  }
  const row = (data as { purchase_id: string; purchase_number: string }[])[0]!;
  await after();
  const units = v.lines.filter((l) => l.variantId).reduce((s, l) => s + l.quantity, 0);
  return {
    ok: true,
    id: row.purchase_id,
    number: row.purchase_number,
    message: `Purchase ${row.purchase_number} saved${units ? ` · ${units.toLocaleString("en-US")} units added to stock` : ""}`,
  };
}

export async function recordPayment(purchaseId: string, amount: number, paidBy: string) {
  await requireStaff(["owner", "manager"]);
  if (!/^[0-9a-f-]{36}$/i.test(purchaseId) || !Number.isInteger(amount) || amount <= 0) {
    return { ok: false as const, error: "Enter the amount paid." };
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_record_purchase_payment", {
    p_purchase: purchaseId,
    p_amount: amount,
    p_paid_by: paidBy.slice(0, 40),
  });
  if (error)
    return { ok: false as const, error: "The payment couldn't be saved. Please try again." };
  revalidatePath("/purchases");
  revalidatePath(`/purchases/${purchaseId}`);
  revalidatePath("/suppliers");
  return { ok: true as const, message: "Payment recorded" };
}
