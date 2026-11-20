import { cn } from "@northnectar/ui";
import type { ReactNode } from "react";

/**
 * Section heading as in the mockup: 14px sage eyebrow, Oswald h2 (34px mobile, 54px desktop,
 * line-height 1.15) with the "mask" reveal, optional right-hand action.
 */
export function HomeHeading({
  id,
  eyebrow,
  title,
  action,
  align = "left",
  weight = 600,
  className,
}: {
  id: string;
  eyebrow?: string;
  title: ReactNode;
  action?: ReactNode;
  align?: "left" | "center";
  weight?: 600 | 700;
  className?: string;
}) {
  const block = (
    <div
      className={cn("flex flex-col gap-[10px]", align === "center" && "items-center text-center")}
    >
      {eyebrow ? (
        <p className="text-[14px] leading-[21px] font-bold tracking-[0.14em] text-[#4e6a52] uppercase">
          {eyebrow}
        </p>
      ) : null}
      <h2
        id={id}
        data-rv="mask"
        className={cn(
          "m-0 font-display text-[34px] leading-[1.15] uppercase md:text-[54px]",
          weight === 700 ? "font-bold" : "font-semibold",
        )}
      >
        {title}
      </h2>
    </div>
  );

  if (!action) return <div className={className}>{block}</div>;
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-4", className)}>
      {block}
      {action}
    </div>
  );
}
