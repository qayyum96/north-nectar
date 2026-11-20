"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { firstName, whatsappLink } from "@/lib/format";
import {
  COURIERS,
  type Fulfilment,
  type PaymentStatus,
  type WhatsappKind,
  whatsappText,
} from "@/lib/orders";
import { createClient } from "@/lib/supabase/server";

export type ActionResult =
  | { ok: true; message: string; whatsapp?: string | null; undo?: "confirm" | "paid" }
  | { ok: false; error: string };

const id = z.string().uuid();

function friendlyError(message: string | undefined): string {
  if (!message) return "Something went wrong. Please try again.";
  if (message.includes("BAD_TRANSITION"))
    return "This order has already moved on. Refresh the page to see its latest status.";
  if (message.includes("NOT_ALLOWED")) return "You don't have permission to do that.";
  if (message.includes("ORDER_NOT_FOUND")) return "That order no longer exists.";
  return "Something went wrong. Please try again.";
}

function refresh(number?: string) {
  revalidatePath("/orders");
  if (number) revalidatePath(`/orders/${number}`);
  // Sidebar counts, notifications and the dashboard.
  revalidatePath("/", "layout");
}

async function orderInfo(orderId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select(
      "number, phone, total, payment_method_id, courier, tracking_number, cancel_reason, whatsapp_updates, shipping_address",
    )
    .eq("id", orderId)
    .maybeSingle<{
      number: string;
      phone: string;
      total: number;
      payment_method_id: string;
      courier: string | null;
      tracking_number: string | null;
      cancel_reason: string | null;
      whatsapp_updates: boolean;
      shipping_address: { fullName?: string } | null;
    }>();
  return data;
}

function messageLink(info: NonNullable<Awaited<ReturnType<typeof orderInfo>>>, kind: WhatsappKind) {
  return whatsappLink(
    info.phone,
    whatsappText(kind, {
      ...info,
      name: info.shipping_address?.fullName,
      reason: info.cancel_reason,
    }),
  );
}

const statusInput = z.object({
  orderId: id,
  to: z.enum(["pending", "confirmed", "shipped", "delivered", "returned", "cancelled"]),
  reason: z.string().trim().max(200).optional(),
  courier: z.string().trim().max(60).optional(),
  tracking: z.string().trim().max(60).optional(),
  restock: z.boolean().optional(),
  refund: z.boolean().optional(),
});

/** Confirm, ship, deliver, cancel or return an order (stock moves in the same transaction). */
export async function updateOrderStatus(input: z.input<typeof statusInput>): Promise<ActionResult> {
  await requireStaff();
  const parsed = statusInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the details and try again." };
  const v = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.rpc("order_update_status", {
    p_order: v.orderId,
    p_to: v.to,
    p_reason: v.reason || null,
    p_courier: v.courier || null,
    p_tracking: v.tracking || null,
    p_restock: v.restock ?? true,
    p_refund: v.refund ?? false,
  });
  if (error) return { ok: false, error: friendlyError(error.message) };

  const info = await orderInfo(v.orderId);
  refresh(info?.number);
  if (!info) return { ok: true, message: "Order updated" };
  const n = `#${info.number}`;
  const messages: Record<Fulfilment, string> = {
    confirmed: `Order ${n} confirmed`,
    pending: `Order ${n} is back to pending`,
    shipped: `Order ${n} marked as shipped`,
    delivered: `Order ${n} marked as delivered`,
    cancelled: `Order ${n} cancelled · stock released`,
    returned: `Order ${n} marked as returned`,
  };
  const kind: WhatsappKind | null =
    v.to === "confirmed" || v.to === "shipped" || v.to === "cancelled" || v.to === "delivered"
      ? v.to
      : null;
  return {
    ok: true,
    message: messages[v.to],
    whatsapp: kind ? messageLink(info, kind) : null,
    undo: v.to === "confirmed" ? "confirm" : undefined,
  };
}

const paymentInput = z.object({
  orderId: id,
  status: z.enum(["unpaid", "paid", "refunded"]),
});

export async function setPaymentStatus(input: {
  orderId: string;
  status: PaymentStatus;
}): Promise<ActionResult> {
  await requireStaff();
  const parsed = paymentInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please try again." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("order_set_payment", {
    p_order: parsed.data.orderId,
    p_status: parsed.data.status,
  });
  if (error) return { ok: false, error: friendlyError(error.message) };
  const info = await orderInfo(parsed.data.orderId);
  refresh(info?.number);
  const n = info ? `#${info.number}` : "";
  return {
    ok: true,
    message:
      parsed.data.status === "paid"
        ? `Order ${n} marked as paid`
        : parsed.data.status === "refunded"
          ? `Order ${n} marked as refunded`
          : `Order ${n} marked as unpaid`,
    undo: parsed.data.status === "paid" ? "paid" : undefined,
  };
}

/** Confirm several pending orders at once (orders list bulk bar). */
export async function confirmOrders(orderIds: string[]): Promise<ActionResult> {
  await requireStaff();
  const ids = z.array(id).max(200).safeParse(orderIds);
  if (!ids.success || ids.data.length === 0)
    return { ok: false, error: "Select some orders first." };
  const supabase = await createClient();
  const { data: pending } = await supabase
    .from("orders")
    .select("id")
    .in("id", ids.data)
    .eq("fulfilment_status", "pending");
  let done = 0;
  for (const o of (pending ?? []) as { id: string }[]) {
    const { error } = await supabase.rpc("order_update_status", {
      p_order: o.id,
      p_to: "confirmed",
    });
    if (!error) done++;
  }
  refresh();
  const skipped = ids.data.length - done;
  return {
    ok: true,
    message:
      done === 0
        ? "None of the selected orders were pending"
        : `${done} ${done === 1 ? "order" : "orders"} marked as confirmed${skipped ? ` · ${skipped} skipped (not pending)` : ""}`,
  };
}

export async function addOrderNote(orderId: string, text: string): Promise<ActionResult> {
  const staff = await requireStaff();
  const note = z.string().trim().min(1).max(1000).safeParse(text);
  if (!id.safeParse(orderId).success || !note.success)
    return { ok: false, error: "Write a note first." };
  const supabase = await createClient();
  const { error } = await supabase.from("order_events").insert({
    order_id: orderId,
    type: "note",
    message: `Note from ${firstName(staff.name)}`,
    detail: note.data,
    actor_id: staff.userId,
  });
  if (error) return { ok: false, error: friendlyError(error.message) };
  const info = await orderInfo(orderId);
  if (info) revalidatePath(`/orders/${info.number}`);
  return { ok: true, message: "Note added to the timeline" };
}

export async function saveInternalNotes(orderId: string, text: string): Promise<ActionResult> {
  await requireStaff();
  const notes = z.string().max(4000).safeParse(text);
  if (!id.safeParse(orderId).success || !notes.success)
    return { ok: false, error: "Notes are too long." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("orders")
    .update({ internal_notes: notes.data.trim() })
    .eq("id", orderId);
  if (error) return { ok: false, error: friendlyError(error.message) };
  return { ok: true, message: "Notes saved" };
}

export async function saveDelivery(
  orderId: string,
  courier: string,
  tracking: string,
): Promise<ActionResult> {
  await requireStaff();
  const parsed = z
    .object({
      courier: z.enum(COURIERS).or(z.literal("")),
      tracking: z.string().trim().max(60),
    })
    .safeParse({ courier, tracking });
  if (!id.safeParse(orderId).success || !parsed.success)
    return { ok: false, error: "Please check the courier and tracking number." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("orders")
    .update({
      courier: parsed.data.courier || null,
      tracking_number: parsed.data.tracking || null,
    })
    .eq("id", orderId);
  if (error) return { ok: false, error: friendlyError(error.message) };
  return { ok: true, message: "Delivery details saved" };
}

export async function saveTags(orderId: string, tags: string[]): Promise<ActionResult> {
  await requireStaff();
  const parsed = z.array(z.string().trim().min(1).max(30)).max(12).safeParse(tags);
  if (!id.safeParse(orderId).success || !parsed.success)
    return { ok: false, error: "Tags must be short (up to 30 characters)." };
  const unique = [...new Set(parsed.data)];
  const supabase = await createClient();
  const { error } = await supabase.from("orders").update({ tags: unique }).eq("id", orderId);
  if (error) return { ok: false, error: friendlyError(error.message) };
  const info = await orderInfo(orderId);
  if (info) revalidatePath(`/orders/${info.number}`);
  return { ok: true, message: "Tags saved" };
}

const MESSAGE_TITLES: Record<WhatsappKind, string> = {
  confirmed: "Confirmation message opened in WhatsApp",
  shipped: "Shipping message opened in WhatsApp",
  delivered: "Follow-up message opened in WhatsApp",
  cancelled: "Cancellation message opened in WhatsApp",
  general: "WhatsApp chat opened",
};

/** Notes on the timeline that a prefilled WhatsApp message was opened (we can't see if it was sent). */
export async function logWhatsapp(orderId: string, kind: WhatsappKind): Promise<void> {
  const staff = await requireStaff();
  if (!id.safeParse(orderId).success || !(kind in MESSAGE_TITLES)) return;
  const supabase = await createClient();
  await supabase.from("order_events").insert({
    order_id: orderId,
    type: "message",
    message: MESSAGE_TITLES[kind],
    detail: `By ${firstName(staff.name)}`,
    actor_id: staff.userId,
  });
  const info = await orderInfo(orderId);
  if (info) revalidatePath(`/orders/${info.number}`);
}
