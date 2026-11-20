import type { ButtonHTMLAttributes } from "react";
import { cn } from "../lib/cn";

export type ButtonVariant =
  "primary" | "accent" | "outline" | "outline-light" | "secondary" | "gold" | "white" | "link";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonStyleOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** "pill" for page CTAs, "rounded" for buttons inside cards and forms. */
  shape?: "pill" | "rounded";
  /** Oswald uppercase, used for the big CTAs ("SHOP THE HARVEST"). */
  display?: boolean;
  fullWidth?: boolean;
  className?: string;
}

const variants: Record<ButtonVariant, string> = {
  primary: "bg-primary text-on-primary hover:bg-primary-hover",
  accent: "bg-accent text-on-accent hover:bg-orange-600",
  outline:
    "border-2 border-forest-900 bg-transparent text-forest-900 hover:bg-forest-900 hover:text-white",
  "outline-light":
    "border-2 border-white/85 bg-transparent text-white hover:bg-white hover:text-forest-900",
  secondary: "bg-sand-200 text-ink hover:bg-sand-300",
  gold: "bg-gold-400 text-forest-950 hover:bg-gold-300",
  white: "border border-line-strong bg-white text-ink hover:border-forest-600",
  link: "h-auto min-h-11 px-0 text-forest-600 underline-offset-4 hover:underline",
};

/** Every size is at least 44px tall to meet the touch-target requirement. */
const sizes: Record<ButtonSize, string> = {
  sm: "h-11 px-4 text-md",
  md: "h-12 px-6 text-base",
  lg: "h-14 px-8 text-lg",
};

/**
 * Returns the button class list. Use it on `<a>`/`<Link>` elements so links and buttons share one
 * look without making this package depend on Next.js.
 */
export function buttonVariants({
  variant = "primary",
  size = "md",
  shape = "pill",
  display = false,
  fullWidth = false,
  className,
}: ButtonStyleOptions = {}) {
  return cn(
    "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 font-bold whitespace-nowrap transition-colors duration-200 select-none [&_svg]:shrink-0",
    "disabled:pointer-events-none disabled:opacity-55 aria-disabled:pointer-events-none aria-disabled:opacity-55",
    variant !== "link" && sizes[size],
    variants[variant],
    shape === "pill" ? "rounded-full" : "rounded-lg",
    display && "font-display font-semibold tracking-[0.04em] uppercase",
    display && size === "lg" && "text-xl",
    fullWidth && "w-full",
    className,
  );
}

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, Omit<ButtonStyleOptions, "className"> {}

export function Button({
  variant,
  size,
  shape,
  display,
  fullWidth,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonVariants({ variant, size, shape, display, fullWidth, className })}
      {...props}
    />
  );
}
