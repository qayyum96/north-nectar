"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2, "Enter the customer's name").max(80),
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s-]/g, ""))
    .refine(
      (v) => /^(\+92|0092|92|0)?3\d{9}$/.test(v),
      "Enter a Pakistani mobile number, e.g. 0321 1234567",
    )
    .transform((v) => `0${v.slice(-10)}`),
  email: z.string().trim().email("Enter a valid email").max(120).or(z.literal("")),
  whatsapp: z.boolean(),
  street: z.string().trim().max(160),
  landmark: z.string().trim().max(120),
  city: z.string().trim().max(60),
  province: z.string().trim().max(60),
  postalCode: z.string().trim().max(10),
  notes: z.string().trim().max(2000),
});

export type CustomerInput = z.input<typeof schema>;
export type CustomerResult =
  | { ok: true; id: string; message: string }
  | { ok: false; error: string; fields?: Record<string, string>; existingId?: string };

/** Add a customer or save changes to one (Add customer / Edit dialog). */
export async function saveCustomer(input: CustomerInput): Promise<CustomerResult> {
  await requireStaff();
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) fields[issue.path.join(".")] ??= issue.message;
    return { ok: false, error: "Please check the highlighted fields.", fields };
  }
  const v = parsed.data;
  const supabase = await createClient();

  const { data: clash } = await supabase
    .from("customers")
    .select("id, name")
    .eq("phone", v.phone)
    .maybeSingle<{ id: string; name: string }>();
  if (clash && clash.id !== v.id) {
    return {
      ok: false,
      error: `${clash.name} already has this mobile number.`,
      fields: { phone: "Another customer has this number" },
      existingId: clash.id,
    };
  }

  const hasAddress = v.street || v.city;
  const row = {
    name: v.name,
    phone: v.phone,
    email: v.email || null,
    whatsapp_opt_in: v.whatsapp,
    city: v.city || null,
    default_address: hasAddress
      ? {
          fullName: v.name,
          street: v.street,
          landmark: v.landmark || undefined,
          city: v.city,
          province: v.province,
          postalCode: v.postalCode || undefined,
          country: "PK",
        }
      : null,
    notes: v.notes,
  };

  if (v.id) {
    const { error } = await supabase.from("customers").update(row).eq("id", v.id);
    if (error) return { ok: false, error: "Couldn't save the customer. Please try again." };
    revalidatePath("/customers");
    revalidatePath(`/customers/${v.id}`);
    return { ok: true, id: v.id, message: "Customer saved" };
  }
  const { data, error } = await supabase
    .from("customers")
    .insert(row)
    .select("id")
    .single<{ id: string }>();
  if (error || !data) return { ok: false, error: "Couldn't add the customer. Please try again." };
  revalidatePath("/customers");
  return { ok: true, id: data.id, message: `${v.name} added` };
}
