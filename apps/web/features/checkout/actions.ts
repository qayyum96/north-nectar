"use server";

import { randomInt } from "node:crypto";
import type { Order, OrderLine } from "@northnectar/types";
import { checkoutContent } from "@/content/checkout";
import { estimateDelivery } from "@/lib/commerce/delivery-estimate";
import { getVariantCatalog } from "@/lib/commerce/get-variant-catalog";
import { normalisePakistanMobile } from "@/lib/commerce/phone";
import type { VariantCatalog } from "@/lib/commerce/variant-catalog";
import {
  computeTotals,
  deliveryMethods,
  findDiscountCode,
  paymentInstructions,
  paymentMethods,
} from "@/lib/constants/commerce";
import { rememberOrder } from "./order-cookie";
import type { PlacedOrder } from "./order-summary";
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
  const payment = paymentMethods.find((m) => m.id === values.paymentMethodId);
  const delivery = deliveryMethods.find((m) => m.id === values.deliveryMethodId);
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
    subtotal,
    deliveryMethodId: delivery.id,
    paymentMethodId: payment.id,
    discountCode: code,
  });
  if (totals.total !== expectedTotal) {
    return { ok: false, kind: "cart", message: checkoutContent.errors.priceChanged, catalog };
  }

  const createdAt = new Date();
  const number = `NN-${randomInt(10000, 100000)}`;
  const phone = normalisePakistanMobile(values.phone) ?? values.phone;
  const city = values.city === "Other" ? values.cityOther : values.city;
  const wallet =
    payment.id === "mobile_wallet"
      ? paymentInstructions.wallets.find((w) => w.id === values.walletProvider)
      : undefined;

  const order: Order = {
    id: crypto.randomUUID(),
    number,
    status: "pending",
    createdAt: createdAt.toISOString(),
    customer: { email: values.email, phone, whatsappUpdates: values.whatsappUpdates },
    shippingAddress: {
      fullName: values.fullName,
      street: values.street,
      ...(values.landmark ? { landmark: values.landmark } : {}),
      city,
      province: values.province,
      ...(values.postalCode ? { postalCode: values.postalCode } : {}),
      country: "PK",
    },
    lines: lines.map(({ image: _image, ...line }) => line),
    deliveryMethodId: delivery.id,
    paymentMethodId: payment.id,
    ...(wallet
      ? {
          paymentDetails: {
            walletProvider: wallet.id,
            walletNumber: normalisePakistanMobile(values.walletNumber) ?? values.walletNumber,
          },
        }
      : {}),
    totals,
    discountCode: code,
  };

  // TODO(supabase): insert `order` (and its lines) into `orders` / `order_lines`, decrement stock.
  // TODO(email): send the customer a receipt and notify the shop (e.g. Resend), plus a WhatsApp
  // message when `whatsappUpdates` is on. Until then orders are only written to the server log.
  console.info("[order] placed", JSON.stringify(order));

  const placed: PlacedOrder = {
    number,
    createdAt: order.createdAt,
    email: values.email,
    phone,
    whatsappUpdates: values.whatsappUpdates,
    fullName: values.fullName,
    addressLines: [
      values.street,
      values.landmark,
      [city, values.postalCode].filter(Boolean).join(", "),
    ].filter(Boolean),
    deliveryMethodId: delivery.id,
    deliveryLabel: delivery.label,
    eta: estimateDelivery(delivery.id, createdAt).label,
    paymentMethodId: payment.id,
    paymentLabel: payment.label,
    ...(wallet ? { walletLabel: wallet.label } : {}),
    lines: lines.map((l) => ({
      name: l.name,
      label: l.variantLabel,
      quantity: l.quantity,
      lineTotal: l.lineTotal,
      image: l.image,
    })),
    totals,
  };
  await rememberOrder(placed);

  return { ok: true, number };
}
