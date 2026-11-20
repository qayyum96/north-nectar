import { cn, formatPkr } from "@northnectar/ui";
import { commerceConfig } from "@/lib/constants/commerce";

/**
 * "You are Rs 951 away from free delivery" with a progress bar. `card` is the rounded box on the
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
  const threshold = commerceConfig.freeDeliveryThreshold;
  const left = Math.max(0, threshold - subtotal);
  const pct = Math.min(100, Math.round((subtotal / threshold) * 100));
  const message =
    left > 0
      ? `You are ${formatPkr(left)} away from free delivery`
      : "You have unlocked free delivery";

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
