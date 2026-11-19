import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";

export type BadgeTone =
  "green" | "orange" | "kraft" | "dark" | "soft-green" | "soft-orange" | "sun" | "outline";

const tones: Record<BadgeTone, string> = {
  green: "bg-forest-600 text-white",
  orange: "bg-rust-600 text-white",
  kraft: "bg-kraft text-ink",
  dark: "bg-ink text-white",
  "soft-green": "bg-mint-100 text-forest-700",
  "soft-orange": "bg-peach-100 text-rust-700",
  sun: "bg-sun-400 text-forest-950",
  outline: "border border-line-strong bg-white text-ink",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

export function Badge({ tone = "green", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-sm leading-tight font-bold",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
