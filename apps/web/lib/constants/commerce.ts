import {
  type CommerceSettings,
  deliveryOptions,
  paymentMethodsFor,
} from "@northnectar/data/commerce-settings";
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
    transitDays: [3, 5],
    shortLabel: "Standard",
  },
  {
    id: "express",
    label: "Express delivery",
    description: "1 to 2 working days, major cities",
    price: 450,
    freeOverThreshold: false,
    transitDays: [1, 2],
    shortLabel: "Express",
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

/**
 * Badges for the footer, cart and drawer: only the methods enabled in the admin
 * (Settings > Payments), in checkout order.
 */
export function paymentBadges(settings: CommerceSettings): string[] {
  return paymentMethodsFor(settings).flatMap((m) => m.badges);
}

/* ------------------------------------------------------------------------------------------------
 * Discount codes
 * ---------------------------------------------------------------------------------------------- */

export interface DiscountCode {
  /** What the customer types (matched case-insensitively). */
  code: string;
  type: "percent" | "fixed";
  /** Percentage (1 to 100) or a fixed amount in PKR. */
  value: number;
  /** Optional minimum subtotal for the code to apply. */
  minSubtotal?: number;
}

/**
 * Active discount codes. Empty for now, so the cart reports every code as invalid. Add entries here
 * (or move them to Supabase) and the cart, checkout and server totals pick them up automatically.
 */
export const discountCodes: DiscountCode[] = [];

export function findDiscountCode(code: string | null | undefined): DiscountCode | null {
  const wanted = code?.trim().toUpperCase();
  if (!wanted) return null;
  return discountCodes.find((d) => d.code.toUpperCase() === wanted) ?? null;
}

/** Discount for a subtotal, or 0 when the code is unknown or its minimum isn't met. */
export function discountAmount(code: string | null | undefined, subtotal: number): number {
  const discount = findDiscountCode(code);
  if (!discount || subtotal < (discount.minSubtotal ?? 0)) return 0;
  const raw =
    discount.type === "percent" ? Math.round((subtotal * discount.value) / 100) : discount.value;
  return Math.min(subtotal, Math.max(0, raw));
}

/* ------------------------------------------------------------------------------------------------
 * Totals (shared by the cart, checkout and the order Server Action, so they always agree)
 * ---------------------------------------------------------------------------------------------- */

export interface Totals {
  subtotal: number;
  discount: number;
  delivery: number;
  paymentFee: number;
  total: number;
}

/**
 * Delivery depends on the city and province (shipping rates by city in the admin). Without an
 * address (the cart) the cheapest zone is used as an estimate; checkout shows the exact fee.
 */
export function computeTotals({
  settings,
  subtotal,
  deliveryMethodId = "standard",
  paymentMethodId = "cod",
  discountCode,
  city,
  province,
}: {
  settings: CommerceSettings;
  subtotal: number;
  deliveryMethodId?: DeliveryMethod["id"];
  paymentMethodId?: PaymentMethod["id"];
  discountCode?: string | null;
  city?: string | null;
  province?: string | null;
}): Totals {
  const discount = discountAmount(discountCode, subtotal);
  const afterDiscount = subtotal - discount;
  const options = deliveryOptions(settings, { city, province, amount: afterDiscount });
  const delivery = (options.find((o) => o.id === deliveryMethodId) ?? options[0]!).fee;
  const paymentFee =
    subtotal > 0
      ? (paymentMethodsFor(settings).find((m) => m.id === paymentMethodId)?.fee ?? 0)
      : 0;
  return { subtotal, discount, delivery, paymentFee, total: afterDiscount + delivery + paymentFee };
}

/* ------------------------------------------------------------------------------------------------
 * Payment instructions shown at checkout and on the order confirmation
 * ---------------------------------------------------------------------------------------------- */

/**
 * Bank and wallet details now come from the admin (Settings > Payments) through
 * CommerceSettings; see getCommerceSettings() and useCommerceSettings().
 */
