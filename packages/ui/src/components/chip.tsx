import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export interface ChipStyleOptions {
  selected?: boolean;
  size?: "sm" | "md";
  className?: string;
}

/**
 * Pill used for filters and size choices. Exposed as a class helper so it works on links
 * (crawlable filters), buttons and labels alike.
 */
export function chipVariants({ selected = false, size = "md", className }: ChipStyleOptions = {}) {
  return cn(
    "inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border font-semibold whitespace-nowrap transition-colors",
    size === "md" ? "px-5 text-md" : "px-3.5 text-sm",
    selected
      ? "border-forest-600 bg-forest-600 text-white"
      : "border-line-strong bg-white text-ink hover:border-forest-600",
    className,
  );
}

export function ChipCount({ selected, children }: { selected?: boolean; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-grid min-w-6 place-items-center rounded-full px-1.5 text-sm leading-6 font-bold",
        selected ? "bg-forest-400 text-white" : "bg-sand-200 text-subtle",
      )}
    >
      {children}
    </span>
  );
}
