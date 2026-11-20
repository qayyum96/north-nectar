"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2, "Add the supplier's name").max(80),
  supplies: z.string().trim().max(120),
  contactName: z.string().trim().max(80),
  phone: z.string().trim().max(30),
  email: z.string().trim().email("Enter a valid email").max(120).or(z.literal("")),
  city: z.string().trim().max(60),
  address: z.string().trim().max(240),
  paymentTerms: z.string().trim().max(600),
  notes: z.string().trim().max(2000),
});

export type SupplierInput = z.input<typeof schema>;
export type SupplierResult =
  | { ok: true; id: string; message: string }
  | { ok: false; error: string; fields?: Record<string, string> };

export async function saveSupplier(input: SupplierInput): Promise<SupplierResult> {
  await requireStaff(["owner", "manager"]);
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const i of parsed.error.issues) fields[i.path.join(".")] ??= i.message;
    return { ok: false, error: "Please check the highlighted fields.", fields };
  }
  const v = parsed.data;
  const row = {
    name: v.name,
    supplies: v.supplies,
    contact_name: v.contactName || null,
    phone: v.phone || null,
    email: v.email || null,
    city: v.city || null,
    address: v.address || null,
    payment_terms: v.paymentTerms,
    notes: v.notes,
  };
  const supabase = await createClient();
  const { data, error } = v.id
    ? await supabase
        .from("suppliers")
        .update(row)
        .eq("id", v.id)
        .select("id")
        .single<{ id: string }>()
    : await supabase.from("suppliers").insert(row).select("id").single<{ id: string }>();
  if (error || !data) {
    if (error?.code === "23505")
      return {
        ok: false,
        error: "You already have a supplier with this name.",
        fields: { name: "Already used" },
      };
    return { ok: false, error: "The supplier couldn't be saved. Please try again." };
  }
  revalidatePath("/suppliers");
  revalidatePath(`/suppliers/${data.id}`);
  revalidatePath("/purchases");
  return { ok: true, id: data.id, message: v.id ? "Supplier saved" : `${v.name} added` };
}

export async function deleteSupplier(id: string): Promise<SupplierResult> {
  await requireStaff(["owner", "manager"]);
  const supabase = await createClient();
  const { count } = await supabase
    .from("purchases")
    .select("id", { count: "exact", head: true })
    .eq("supplier_id", id);
  if ((count ?? 0) > 0)
    return { ok: false, error: "This supplier has purchases, so it can't be deleted." };
  const { error } = await supabase.from("suppliers").delete().eq("id", id);
  if (error) return { ok: false, error: "The supplier couldn't be deleted." };
  revalidatePath("/suppliers");
  return { ok: true, id, message: "Supplier deleted" };
}
