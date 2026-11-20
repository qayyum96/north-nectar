"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/service";

const phone = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s-]/g, ""))
  .refine(
    (v) => /^(\+92|0092|92|0)?3\d{9}$/.test(v),
    "Enter a Pakistani mobile number, e.g. 0321 1234567",
  )
  .transform((v) => `0${v.slice(-10)}`);

const schema = z.object({
  customer: z.object({
    name: z.string().trim().min(2, "Enter the customer's name").max(80),
    phone,
    email: z.string().trim().email("Enter a valid email").max(120).or(z.literal("")),
    whatsapp: z.boolean(),
  }),
  address: z.object({
    street: z.string().trim().min(3, "Enter the street address").max(160),
    landmark: z.string().trim().max(120),
    city: z.string().trim().min(2, "Enter the city").max(60),
    province: z.string().trim().min(2, "Choose a province").max(60),
    postalCode: z.string().trim().max(10),
  }),
  lines: z
    .array(
      z.object({ variantId: z.string().min(1).max(80), quantity: z.number().int().min(1).max(99) }),
    )
    .min(1, "Add at least one product")
    .max(30),
  delivery: z.object({
    method: z.enum(["standard", "express", "pickup"]),
    fee: z.number().int().min(0).max(20000),
  }),
  payment: z.object({
    method: z.enum(["cod", "bank_transfer", "jazzcash", "easypaisa"]),
    paid: z.boolean(),
  }),
  note: z.string().trim().max(1000),
});

export type CreateOrderInput = z.input<typeof schema>;
export type CreateOrderResult =
  { ok: true; number: string } | { ok: false; error: string; fields?: Record<string, string> };

const DELIVERY_LABEL = {
  standard: "Standard delivery",
  express: "Express delivery",
  pickup: "Pickup",
};
const PAYMENT = {
  cod: { id: "cod", label: "Cash on delivery", details: null },
  bank_transfer: { id: "bank_transfer", label: "Bank transfer", details: null },
  jazzcash: {
    id: "mobile_wallet",
    label: "JazzCash or Easypaisa",
    details: { walletProvider: "jazzcash", walletLabel: "JazzCash" },
  },
  easypaisa: {
    id: "mobile_wallet",
    label: "JazzCash or Easypaisa",
    details: { walletProvider: "easypaisa", walletLabel: "Easypaisa" },
  },
} as const;

/**
 * Creates an order from the admin (phone or WhatsApp orders). Prices come from the database, not
 * the form, and the same create_order function as the website reserves stock.
 */
export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  const staff = await requireStaff();
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) fields[issue.path.join(".")] ??= issue.message;
    return { ok: false, error: "Please check the highlighted fields.", fields };
  }
  const v = parsed.data;

  // Merge repeated sizes and price every line from the database.
  const qty = new Map<string, number>();
  for (const l of v.lines) qty.set(l.variantId, (qty.get(l.variantId) ?? 0) + l.quantity);
  const db = createServiceClient();
  const { data: variants, error: vErr } = await db
    .from("product_variants")
    .select("id, price, stock, reserved, label, products(name)")
    .in("id", [...qty.keys()]);
  if (vErr || !variants || variants.length !== qty.size)
    return {
      ok: false,
      error: "One of the products is no longer available. Refresh and try again.",
    };

  const lines = (variants as { id: string; price: number }[]).map((row) => ({
    variant_id: row.id,
    quantity: qty.get(row.id)!,
    unit_price: row.price,
  }));
  const subtotal = lines.reduce((s, l) => s + l.unit_price * l.quantity, 0);
  const pay = PAYMENT[v.payment.method];

  const { data, error } = await db.rpc("create_order", {
    p: {
      source: "admin",
      actor_id: staff.userId,
      email: v.customer.email,
      phone: v.customer.phone,
      whatsapp_updates: v.customer.whatsapp,
      shipping_address: {
        fullName: v.customer.name,
        street: v.address.street,
        landmark: v.address.landmark || undefined,
        city: v.address.city,
        province: v.address.province,
        postalCode: v.address.postalCode || undefined,
        country: "PK",
      },
      delivery_method_id: v.delivery.method,
      delivery_label: DELIVERY_LABEL[v.delivery.method],
      payment_method_id: pay.id,
      payment_label: pay.label,
      payment_details: pay.details,
      payment_status: v.payment.paid ? "paid" : "unpaid",
      lines,
      subtotal,
      discount: 0,
      delivery_fee: v.delivery.fee,
      payment_fee: 0,
      total: subtotal + v.delivery.fee,
      internal_notes: v.note,
    },
  });
  if (error) {
    if (error.message.includes("OUT_OF_STOCK"))
      return { ok: false, error: "Not enough stock for one of the products. Lower the quantity." };
    if (error.message.includes("VARIANT_UNAVAILABLE"))
      return {
        ok: false,
        error: "One of the products is a draft or quote-only, so it can't be ordered.",
      };
    return { ok: false, error: "The order couldn't be saved. Please try again." };
  }
  const created = (data as { order_number: string }[] | null)?.[0];
  revalidatePath("/orders");
  revalidatePath("/", "layout");
  return created
    ? { ok: true, number: created.order_number }
    : { ok: false, error: "The order couldn't be saved." };
}
