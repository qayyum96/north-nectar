"use client";

import { cn } from "@northnectar/ui";
import { paymentBadges } from "@/lib/constants/commerce";
import { useCommerceSettings } from "./commerce-settings";

/** Outlined payment badges (cart summary and drawer), driven by the payment methods config. */
export function PaymentBadges({ className }: { className?: string }) {
  const settings = useCommerceSettings();
  return (
    <ul
      aria-label="Payment options"
      className={cn("m-0 flex list-none flex-wrap justify-center gap-[6px] p-0", className)}
    >
      {paymentBadges(settings).map((badge) => (
        <li
          key={badge}
          className="rounded-[6px] border border-[#e3d8bf] px-2 py-[3px] text-[14px] font-semibold text-[#4d4a40]"
        >
          {badge}
        </li>
      ))}
    </ul>
  );
}
