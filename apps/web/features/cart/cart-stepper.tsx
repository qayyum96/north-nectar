"use client";

import { cn } from "@northnectar/ui";
import { commerceConfig } from "@/lib/constants/commerce";

/**
 * Quantity stepper as in the mockup: pill with "−" and "+" (42px tall on the cart page, 36px in
 * the drawer). The drawer's buttons are smaller than 44px, so their hit areas are extended.
 */
export function CartStepper({
  value,
  onChange,
  itemName,
  size = "md",
  max = commerceConfig.maxQuantityPerLine,
  className,
}: {
  value: number;
  onChange: (value: number) => void;
  itemName: string;
  size?: "sm" | "md";
  max?: number;
  className?: string;
}) {
  const button = cn(
    "relative cursor-pointer border-0 bg-transparent text-[18px] leading-none text-ink disabled:cursor-default",
    size === "md"
      ? "h-10 w-[42px]"
      : "h-[34px] w-9 before:absolute before:-inset-[5px] before:content-['']",
  );
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-[#ddd3bf] bg-white",
        size === "md" ? "h-11" : "h-[38px]",
        className,
      )}
    >
      <button
        type="button"
        aria-label={`Decrease quantity of ${itemName}`}
        disabled={value <= 1}
        onClick={() => onChange(value - 1)}
        className={button}
      >
        −
      </button>
      <span
        aria-live="polite"
        aria-label={`Quantity ${value}`}
        className="min-w-[22px] text-center text-[15px] font-bold"
      >
        {value}
      </span>
      <button
        type="button"
        aria-label={`Increase quantity of ${itemName}`}
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
        className={button}
      >
        +
      </button>
    </div>
  );
}
