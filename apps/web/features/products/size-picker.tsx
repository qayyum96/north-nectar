"use client";

import { cn, formatPkr } from "@northnectar/ui";
import type { ProductVariant } from "@northnectar/types";
import { useId } from "react";

/**
 * Size selection as a native radio group (keyboard and screen-reader friendly), styled two ways:
 * - "chips": compact pills used on product cards
 * - "cards": larger boxes with price and optional tag, used in the spotlight and product page
 */
export function SizePicker({
  variants,
  value,
  onChange,
  look = "chips",
  legend = "Size",
  className,
}: {
  variants: ProductVariant[];
  value: string | undefined;
  onChange: (variantId: string) => void;
  look?: "chips" | "cards";
  legend?: string;
  className?: string;
}) {
  const name = useId();
  if (variants.length < 2) return null;

  return (
    <fieldset className={className}>
      <legend className="sr-only">{legend}</legend>
      <div className={cn("flex flex-wrap", look === "chips" ? "gap-2" : "gap-3")}>
        {variants.map((v) => {
          const checked = v.id === value;
          const soldOut = v.stock <= 0;
          return (
            <label
              key={v.id}
              className={cn("relative", soldOut ? "cursor-not-allowed" : "cursor-pointer")}
            >
              <input
                type="radio"
                name={name}
                value={v.id}
                checked={checked}
                disabled={soldOut}
                onChange={() => onChange(v.id)}
                className="peer sr-only"
              />
              {look === "chips" ? (
                <span
                  className={cn(
                    "inline-flex min-h-11 min-w-12 items-center justify-center rounded-full border px-3.5 text-md font-semibold transition-colors peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-forest-600",
                    checked
                      ? "border-forest-600 bg-forest-600 text-white"
                      : "border-line-strong bg-white text-ink hover:border-forest-600",
                    soldOut && "line-through opacity-50",
                  )}
                >
                  {v.label}
                  {soldOut ? <span className="sr-only"> (sold out)</span> : null}
                </span>
              ) : (
                <span
                  className={cn(
                    "flex min-h-16 min-w-26 flex-col justify-center rounded-xl border-2 px-4 py-2.5 transition-colors peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-forest-600",
                    checked
                      ? "border-forest-600 bg-white"
                      : "border-line-strong bg-cream-50 hover:border-forest-600",
                    soldOut && "opacity-50",
                  )}
                >
                  <span className="text-base font-bold text-ink">{v.label}</span>
                  <span className="text-sm text-subtle tabular-nums">
                    {soldOut ? "Sold out" : formatPkr(v.price)}
                  </span>
                  {v.tag ? (
                    <span className="absolute -top-2.5 right-2 rounded-full bg-accent px-2 text-sm leading-5 font-bold text-on-accent">
                      {v.tag}
                    </span>
                  ) : null}
                </span>
              )}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
