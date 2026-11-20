"use client";

import type { DeliveryMethodId, PaymentMethodId } from "@northnectar/types";
import { computeTotals, type Totals } from "@/lib/constants/commerce";
import { selectCount, selectSubtotal, useCartStore } from "./store";

/** Cart totals with the same rules the order Server Action uses. */
export function useCartTotals(
  deliveryMethodId: DeliveryMethodId = "standard",
  paymentMethodId: PaymentMethodId = "cod",
): Totals & { count: number } {
  const subtotal = useCartStore(selectSubtotal);
  const count = useCartStore(selectCount);
  const discountCode = useCartStore((s) => s.discountCode);
  return {
    ...computeTotals({ subtotal, deliveryMethodId, paymentMethodId, discountCode }),
    count,
  };
}
