"use client";

import { cn, formatPkr } from "@northnectar/ui";
import { useDeliveryZone } from "@/features/delivery/use-delivery-zone";

/**
 * "You are Rs 951 away from free delivery to Islamabad" with a progress bar. Uses the visitor’s
 * delivery city (top bar or checkout); until it is known, the lowest zone amount, marked as
 * depending on the city. `card` is the rounded box on the
 * cart page; `bar` is the full-width strip under the drawer header.
 */
export function FreeDeliveryProgress({
  subtotal,
  variant = "card",
  className,
}: {
  subtotal: number;
  variant?: "card" | "bar";
  className?: string;
}) {
  const { place, zone, freeOver: threshold } = useDeliveryZone();
  if (threshold === null) return null;
  const left = Math.max(0, threshold - subtotal);
  const pct = Math.min(100, Math.round((subtotal / threshold) * 100));
  const to = zone && place ? ` to ${place}` : "";
  const message = !zone
    ? left > 0
      ? `Free delivery from ${formatPkr(threshold)}, depending on your city`
      : "You may qualify for free delivery: choose your city at checkout"
    : left > 0
      ? `You are ${formatPkr(left)} away from free delivery${to}`
      : `You have unlocked free delivery${to}`;

  return (
    <div
      className={cn(
        "border-[#e3ecdc] bg-[#f3f8f0]",
        variant === "card"
          ? "rounded-[16px] border px-5 py-4"
          : "border-b px-[22px] py-4 leading-[normal]",
        className,
      )}
    >
      <div className="flex flex-col gap-2">
        <p aria-live="polite" className="m-0 text-[15px] font-semibold text-[#1f4a2f]">
          {message}
        </p>
        <span
          role="progressbar"
          aria-label="Progress towards free delivery"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          className="block h-2 overflow-hidden rounded-full bg-[#e9e1cc]"
        >
          <span
            className="block h-full rounded-full bg-[#2f7d45] transition-[width] duration-800 ease-[cubic-bezier(.16,1,.3,1)]"
            style={{ width: `${pct}%` }}
          />
        </span>
      </div>
    </div>
  );
}
