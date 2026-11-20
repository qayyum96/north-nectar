"use client";

import type { DeliveryMethodId, PaymentMethodId } from "@northnectar/types";
import { computeTotals, type Totals } from "@/lib/constants/commerce";
import { useCommerceSettings } from "./commerce-settings";
import { selectCount, selectSubtotal, useCartStore } from "./store";

/**
 * Cart totals with the same rules the order Server Action uses. Pass the address at checkout for
 * the exact delivery fee (shipping rates by city); without it the cheapest zone is an estimate.
 */
export function useCartTotals(
  deliveryMethodId: DeliveryMethodId = "standard",
  paymentMethodId: PaymentMethodId = "cod",
  address?: { city?: string | null; province?: string | null },
): Totals & { count: number } {
  const settings = useCommerceSettings();
  const subtotal = useCartStore(selectSubtotal);
  const count = useCartStore(selectCount);
  const discountCode = useCartStore((s) => s.discountCode);
  return {
    ...computeTotals({
      settings,
      subtotal,
      deliveryMethodId,
      paymentMethodId,
      discountCode,
      city: address?.city,
      province: address?.province,
    }),
    count,
  };
}
