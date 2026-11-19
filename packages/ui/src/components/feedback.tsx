import type { HTMLAttributes, ReactNode } from "react";
import { AlertCircleIcon, CheckCircleIcon, StarIcon } from "../icons";
import { cn } from "../lib/cn";

export function StarRating({
  value = 5,
  label,
  className,
  size = 16,
}: {
  value?: number;
  /** Screen reader text, e.g. "Rated 5 out of 5". */
  label?: string;
  className?: string;
  size?: number;
}) {
  return (
    <span
      className={cn("inline-flex items-center gap-0.5 text-rust-600", className)}
      role="img"
      aria-label={label ?? `Rated ${value} out of 5`}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <StarIcon key={i} size={size} className={i < Math.round(value) ? "" : "opacity-25"} />
      ))}
    </span>
  );
}

export function ProgressBar({
  value,
  max = 100,
  label,
  className,
}: {
  value: number;
  max?: number;
  label: string;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.round(value)}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-sand-200", className)}
    >
      <div
        className="h-full rounded-full bg-forest-500 transition-[width] duration-500 ease-out-expo"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export interface AlertProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  tone?: "error" | "success" | "info";
  title?: ReactNode;
}

export function Alert({ tone = "info", title, children, className, ...props }: AlertProps) {
  const Icon = tone === "success" ? CheckCircleIcon : AlertCircleIcon;
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-3 rounded-xl border px-4 py-3.5 text-md",
        tone === "error" && "border-danger-200 bg-danger-50 text-danger-800",
        tone === "success" && "border-mint-100 bg-mint-50 text-forest-700",
        tone === "info" && "border-line bg-sand-100 text-ink",
        className,
      )}
      {...props}
    >
      <Icon size={20} className="mt-0.5 shrink-0" />
      <div>
        {title ? <p className="font-bold">{title}</p> : null}
        {children}
      </div>
    </div>
  );
}
