import type { DeliveryMethod, PaymentMethod } from "@northnectar/types";

/**
 * Store rules in one place. Prices are whole PKR.
 *
 * PAYMENT METHODS ARE CONFIG-DRIVEN. To add a local card gateway or switch on Stripe later:
 *   1. set the method's `status` to "enabled" (or add a new entry),
 *   2. implement its handler in features/checkout (Phase 5 leaves a typed stub per method).
 * Status meanings: "enabled" = selectable at checkout and shown as a payment badge,
 * "coming_soon" = listed at checkout but disabled (no badge), "hidden" = not shown anywhere.
 * Payment badges (footer, cart, drawer) only ever show enabled methods, so a new gateway's badges
 * appear automatically the moment it is enabled.
 */
export const paymentMethods: PaymentMethod[] = [
  {
    id: "cod",
    label: "Cash on delivery",
    description: "Pay in cash when your order arrives",
    status: "enabled",
    fee: 0,
    badges: ["Cash on delivery"],
  },
  {
    id: "bank_transfer",
    label: "Bank transfer",
    description: "Transfer after placing your order",
    status: "enabled",
    fee: 0,
    badges: ["Bank transfer"],
  },
  {
    id: "mobile_wallet",
    label: "JazzCash or Easypaisa",
    description: "Pay from your mobile wallet",
    status: "enabled",
    fee: 0,
    badges: ["JazzCash", "Easypaisa"],
  },
  {
    // Planned Stripe / local card gateway. Set to "enabled" once the integration exists.
    id: "card",
    label: "Debit or credit card",
    description: "Visa and Mastercard",
    status: "hidden",
    fee: 0,
    badges: ["Visa", "Mastercard"],
  },
];

export const deliveryMethods: DeliveryMethod[] = [
  {
    id: "standard",
    label: "Standard delivery",
    description: "3 to 5 working days, all of Pakistan",
    price: 250,
    freeOverThreshold: true,
  },
  {
    id: "express",
    label: "Express delivery",
    description: "1 to 2 working days, major cities",
    price: 450,
    freeOverThreshold: false,
  },
];

export const commerceConfig = {
  currency: "PKR",
  freeDeliveryThreshold: 5000,
  maxQuantityPerLine: 20,
  lowStockThreshold: 5,
  paymentMethods,
  deliveryMethods,
  /** Values used in Product structured data (shipping and returns). */
  structuredData: {
    standardDeliveryFee: 250,
    handlingDays: [0, 1] as const,
    transitDays: [3, 5] as const,
    returnDays: 7,
  },
} as const;

/** Methods a customer can choose right now. */
export function enabledPaymentMethods(): PaymentMethod[] {
  return paymentMethods.filter((m) => m.status === "enabled");
}

/** Badges for the footer, cart and drawer: only selectable methods, in config order. */
export function paymentBadges(): string[] {
  return enabledPaymentMethods().flatMap((m) => m.badges);
}

/** Delivery fee for a subtotal and method, applying the free-delivery threshold. */
export function deliveryFee(subtotal: number, methodId: DeliveryMethod["id"] = "standard"): number {
  const method = deliveryMethods.find((m) => m.id === methodId) ?? deliveryMethods[0]!;
  if (subtotal <= 0) return 0;
  if (method.freeOverThreshold && subtotal >= commerceConfig.freeDeliveryThreshold) return 0;
  return method.price;
}
