import { cn, formatPkr } from "@northnectar/ui";

/** Current price with an optional struck-through original price. Server- and client-safe. */
export function Price({
  price,
  compareAt,
  prefix,
  size = "md",
  className,
}: {
  price: number;
  compareAt?: number | null;
  /** e.g. "From" for price ranges. */
  prefix?: string;
  size?: "md" | "lg";
  className?: string;
}) {
  const onSale = typeof compareAt === "number" && compareAt > price;
  return (
    <p className={cn("flex flex-wrap items-baseline gap-x-2", className)}>
      {prefix ? <span className="text-md text-subtle">{prefix}</span> : null}
      <span
        className={cn(
          "font-bold text-ink tabular-nums",
          size === "lg" ? "font-display text-display-md text-forest-900" : "text-lg",
        )}
      >
        {formatPkr(price)}
      </span>
      {onSale ? (
        <span className="text-md text-muted tabular-nums line-through">
          <span className="sr-only">Was </span>
          {formatPkr(compareAt)}
        </span>
      ) : null}
    </p>
  );
}
