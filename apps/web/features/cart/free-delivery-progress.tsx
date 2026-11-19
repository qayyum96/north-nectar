import { ProgressBar, cn, formatPkr } from "@northnectar/ui";
import { commerceConfig } from "@/lib/constants/commerce";

export function FreeDeliveryProgress({
  subtotal,
  className,
}: {
  subtotal: number;
  className?: string;
}) {
  const threshold = commerceConfig.freeDeliveryThreshold;
  const left = Math.max(0, threshold - subtotal);
  const message =
    left > 0 ? (
      <>
        You are <strong className="font-bold">{formatPkr(left)}</strong> away from free delivery
      </>
    ) : (
      <strong className="font-bold">You have unlocked free delivery</strong>
    );

  return (
    <div className={cn("rounded-xl border border-mint-100 bg-mint-50 px-5 py-4", className)}>
      <p className="mb-2.5 text-md text-forest-700" aria-live="polite">
        {message}
      </p>
      <ProgressBar
        value={Math.min(subtotal, threshold)}
        max={threshold}
        label="Progress towards free delivery"
      />
    </div>
  );
}
