"use server";

import type { OrderLine } from "@northnectar/types";
import { checkoutContent } from "@/content/checkout";
import { getVariantCatalog } from "@/lib/commerce/get-variant-catalog";
import { normalisePakistanMobile } from "@/lib/commerce/phone";
import type { VariantCatalog } from "@/lib/commerce/variant-catalog";
import {
  deliveryOptions,
  enabledWallets,
  paymentMethodsFor,
} from "@northnectar/data/commerce-settings";
import { getCommerceSettings } from "@/lib/commerce/settings";
import { computeTotals, findDiscountCode } from "@/lib/constants/commerce";
import { supabaseService } from "@/lib/supabase/server";
import { rememberOrder } from "./order-cookie";
import {
  checkoutSchema,
  orderLinesSchema,
  type CheckoutField,
  type CheckoutInput,
  type OrderLineInput,
} from "./schema";

export type PlaceOrderResult =
  | { ok: true; number: string }
  | { ok: false; kind: "validation"; fieldErrors: Partial<Record<CheckoutField, string>> }
  /** The cart changed (item gone, out of stock or re-priced). `catalog` lets the browser re-sync. */
  | { ok: false; kind: "cart"; message: string; catalog: VariantCatalog }
  | { ok: false; kind: "error"; message: string };

/**
 * Places an order. Everything that matters is decided here, never trusted from the browser:
 * prices, stock, delivery fee, discount and payment method all come from the data layer and config.
 */
export async function placeOrder(
  details: CheckoutInput,
  cartLines: OrderLineInput[],
  discountCode: string | null,
  expectedTotal: number,
): Promise<PlaceOrderResult> {
  const parsed = checkoutSchema.safeParse(details);
  if (!parsed.success) {
    const fieldErrors: Partial<Record<CheckoutField, string>> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as CheckoutField | undefined;
      if (field && !fieldErrors[field]) fieldErrors[field] = issue.message;
    }
    return { ok: false, kind: "validation", fieldErrors };
  }
  const linesParsed = orderLinesSchema.safeParse(cartLines);
  if (!linesParsed.success) {
    return { ok: false, kind: "error", message: checkoutContent.errors.generic };
  }

  const values = parsed.data;
  // Payment methods and delivery rates as set in the admin right now (never cached).
  const settings = await getCommerceSettings();
  const city = values.city === "Other" ? values.cityOther : values.city;
  const payment = paymentMethodsFor(settings).find((m) => m.id === values.paymentMethodId);
  const delivery = deliveryOptions(settings, { city, province: values.province, amount: 1 }).find(
    (m) => m.id === values.deliveryMethodId,
  );
  if (!payment || payment.status !== "enabled" || !delivery) {
    return { ok: false, kind: "error", message: checkoutContent.errors.generic };
  }

  // Re-price every line from the data layer and check stock.
  const catalog = await getVariantCatalog();
  const lines: (OrderLine & { image: string })[] = [];
  for (const { variantId, quantity } of linesParsed.data) {
    const variant = catalog[variantId];
    if (!variant || variant.stock < quantity) {
      return { ok: false, kind: "cart", message: checkoutContent.errors.unavailable, catalog };
    }
    lines.push({
      productId: variant.productId,
      variantId,
      sku: variant.sku,
      name: variant.name,
      variantLabel: variant.label,
      unitPrice: variant.price,
      quantity,
      lineTotal: variant.price * quantity,
      image: variant.image.src,
    });
  }

  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  const code = findDiscountCode(discountCode)?.code ?? null;
  const totals = computeTotals({
    settings,
    city,
    province: values.province,
    subtotal,
    deliveryMethodId: delivery.id,
    paymentMethodId: payment.id,
    discountCode: code,
  });
  if (totals.total !== expectedTotal) {
    return { ok: false, kind: "cart", message: checkoutContent.errors.priceChanged, catalog };
  }

  const phone = normalisePakistanMobile(values.phone) ?? values.phone;
  const wallet =
    payment.id === "mobile_wallet"
      ? enabledWallets(settings).find((w) => w.id === values.walletProvider)
      : undefined;
  if (payment.id === "mobile_wallet" && !wallet) {
    return { ok: false, kind: "error", message: checkoutContent.errors.generic };
  }

  // The database function locks each size, re-checks price and available stock, reserves the
  // units and writes the order, lines, customer and timeline in one transaction.
  const { data, error } = await supabaseService().rpc("create_order", {
    p: {
      source: "online",
      email: values.email,
      phone,
      whatsapp_updates: values.whatsappUpdates,
      shipping_address: {
        fullName: values.fullName,
        street: values.street,
        ...(values.landmark ? { landmark: values.landmark } : {}),
        city,
        province: values.province,
        ...(values.postalCode ? { postalCode: values.postalCode } : {}),
        country: "PK",
      },
      delivery_method_id: delivery.id,
      delivery_label: delivery.label,
      payment_method_id: payment.id,
      payment_label: payment.label,
      payment_details: wallet
        ? {
            walletProvider: wallet.id,
            walletLabel: wallet.label,
            walletNumber: normalisePakistanMobile(values.walletNumber) ?? values.walletNumber,
          }
        : null,
      lines: lines.map((l) => ({
        variant_id: l.variantId,
        quantity: l.quantity,
        unit_price: l.unitPrice,
      })),
      subtotal: totals.subtotal,
      discount: totals.discount,
      delivery_fee: totals.delivery,
      payment_fee: totals.paymentFee,
      total: totals.total,
      discount_code: code,
    },
  });

  if (error) {
    const reason = error.message.split(":")[0] ?? "";
    if (
      [
        "PRICE_CHANGED",
        "OUT_OF_STOCK",
        "VARIANT_UNAVAILABLE",
        "VARIANT_NOT_FOUND",
        "TOTAL_MISMATCH",
      ].includes(reason)
    ) {
      // Something changed in the meantime: send fresh prices and stock so the cart can update.
      const fresh = await getVariantCatalog({ fresh: true });
      return {
        ok: false,
        kind: "cart",
        message:
          reason === "PRICE_CHANGED" || reason === "TOTAL_MISMATCH"
            ? checkoutContent.errors.priceChanged
            : checkoutContent.errors.unavailable,
        catalog: fresh,
      };
    }
    console.error("[order] create_order failed", error.message);
    return { ok: false, kind: "error", message: checkoutContent.errors.generic };
  }

  const row = (Array.isArray(data) ? data[0] : data) as
    { order_id: string; order_number: string; access_token: string } | undefined;
  if (!row) return { ok: false, kind: "error", message: checkoutContent.errors.generic };

  // TODO(email): send the customer a receipt and notify the shop (Resend) once the domain is set
  // up. WhatsApp updates are sent from the admin with one tap.
  await rememberOrder({ number: row.order_number, token: row.access_token });

  return { ok: true, number: row.order_number };
}
