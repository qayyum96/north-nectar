"use client";

import { MinusIcon, PlusIcon } from "../icons";
import { cn } from "../lib/cn";

export interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  /** Used in the button labels, e.g. "Decrease quantity of Sea Buckthorn Berries". */
  itemName?: string;
  size?: "sm" | "md";
  className?: string;
}

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 20,
  itemName,
  size = "md",
  className,
}: QuantityStepperProps) {
  const suffix = itemName ? ` of ${itemName}` : "";
  const btn =
    "grid size-11 shrink-0 cursor-pointer place-items-center rounded-full text-ink transition-colors hover:bg-sand-200 disabled:cursor-not-allowed disabled:opacity-40";
  return (
    <div
      role="group"
      aria-label={`Quantity${suffix}`}
      className={cn(
        "inline-flex items-center rounded-full border border-line-strong bg-white",
        size === "md" ? "h-14 px-1" : "h-11",
        className,
      )}
    >
      <button
        type="button"
        className={btn}
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label={`Decrease quantity${suffix}`}
      >
        <MinusIcon size={16} />
      </button>
      <output aria-live="polite" className="min-w-8 text-center text-base font-bold tabular-nums">
        {value}
      </output>
      <button
        type="button"
        className={btn}
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label={`Increase quantity${suffix}`}
      >
        <PlusIcon size={16} />
      </button>
    </div>
  );
}
