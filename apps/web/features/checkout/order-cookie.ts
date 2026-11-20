import "server-only";
import { cookies } from "next/headers";
import { deliveryOptions } from "@northnectar/data/commerce-settings";
import { getCommerceSettings } from "@/lib/commerce/settings";
import { estimateDelivery } from "@/lib/commerce/delivery-estimate";
import { supabaseService } from "@/lib/supabase/server";
import type { PlacedOrder } from "./order-summary";

const COOKIE = "nn-last-order";

/**
 * Remembers the order just placed so /order-confirmation can show it. The cookie only holds the
 * order number and its private access token; the order itself is read from the database.
 */
export async function rememberOrder(ref: { number: string; token: string }): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE, JSON.stringify(ref), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

interface OrderRow {
  number: string;
  created_at: string;
  email: string | null;
  phone: string;
  whatsapp_updates: boolean;
  shipping_address: {
    fullName: string;
    street: string;
    landmark?: string;
    city: string;
    province?: string;
    postalCode?: string;
  };
  delivery_method_id: "standard" | "express";
  delivery_label: string;
  payment_method_id: PlacedOrder["paymentMethodId"];
  payment_label: string;
  payment_details: { walletLabel?: string } | null;
  subtotal: number;
  discount: number;
  delivery_fee: number;
  payment_fee: number;
  total: number;
  order_lines: {
    name: string;
    variant_label: string;
    quantity: number;
    line_total: number;
    image: string | null;
  }[];
}

/** The last order placed in this browser, or null if there is none (or it can't be read). */
export async function readLastOrder(): Promise<PlacedOrder | null> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  let ref: { number?: unknown; token?: unknown };
  try {
    ref = JSON.parse(raw) as typeof ref;
  } catch {
    return null;
  }
  if (typeof ref.number !== "string" || typeof ref.token !== "string") return null;
  if (!/^[0-9a-f-]{36}$/i.test(ref.token)) return null;

  const { data, error } = await supabaseService()
    .from("orders")
    .select(
      "number, created_at, email, phone, whatsapp_updates, shipping_address, delivery_method_id, delivery_label, payment_method_id, payment_label, payment_details, subtotal, discount, delivery_fee, payment_fee, total, order_lines(name, variant_label, quantity, line_total, image)",
    )
    .eq("number", ref.number)
    .eq("access_token", ref.token)
    .maybeSingle<OrderRow>();
  if (error || !data) return null;

  const a = data.shipping_address;
  // Delivery days for the order's city (shipping rates by city in the admin).
  const options = deliveryOptions(await getCommerceSettings(), {
    city: a.city,
    province: a.province,
    amount: 1,
  });
  const method = options.find((m) => m.id === data.delivery_method_id) ?? options[0]!;
  return {
    number: data.number,
    createdAt: data.created_at,
    email: data.email ?? "",
    phone: data.phone,
    whatsappUpdates: data.whatsapp_updates,
    fullName: a.fullName,
    addressLines: [
      a.street,
      a.landmark ?? "",
      [a.city, a.postalCode].filter(Boolean).join(", "),
    ].filter(Boolean),
    deliveryMethodId: data.delivery_method_id,
    deliveryLabel: data.delivery_label,
    eta: estimateDelivery(method.transitDays, new Date(data.created_at)).label,
    paymentMethodId: data.payment_method_id,
    paymentLabel: data.payment_label,
    ...(data.payment_details?.walletLabel ? { walletLabel: data.payment_details.walletLabel } : {}),
    lines: data.order_lines.map((l) => ({
      name: l.name,
      label: l.variant_label,
      quantity: l.quantity,
      lineTotal: l.line_total,
      image: l.image ?? "",
    })),
    totals: {
      subtotal: data.subtotal,
      discount: data.discount,
      delivery: data.delivery_fee,
      paymentFee: data.payment_fee,
      total: data.total,
    },
  };
}
