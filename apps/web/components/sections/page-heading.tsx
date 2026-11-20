import { cn } from "@northnectar/ui";
import type { ReactNode } from "react";

/** Eyebrow label used above inner-page headings (mockup: 14px, bold, 0.14em tracking). */
export function Eyebrow({
  children,
  tone = "light",
  className,
  as: Tag = "p",
  id,
}: {
  children: ReactNode;
  tone?: "light" | "dark";
  className?: string;
  as?: "p" | "h2";
  id?: string;
}) {
  return (
    <Tag
      id={id}
      className={cn(
        "m-0 text-[14px] leading-[21px] font-bold tracking-[0.14em] uppercase",
        tone === "dark" ? "text-[#9ed7a6]" : "text-[#1c7039]",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

/**
 * Inner-page section heading (About, Contact): eyebrow plus Oswald h2, 36px on phones and 56px on
 * desktop (line-height 1.02), with the mockup's "mask" reveal.
 */
export function PageHeading({
  id,
  eyebrow,
  title,
  align = "left",
  tone = "light",
  className,
}: {
  id: string;
  eyebrow: string;
  title: ReactNode;
  align?: "left" | "center";
  tone?: "light" | "dark";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-[10px]",
        align === "center" && "items-center text-center",
        className,
      )}
    >
      <Eyebrow tone={tone}>{eyebrow}</Eyebrow>
      <h2
        id={id}
        data-rv="mask"
        className={cn(
          "m-0 font-display text-[36px] leading-[1.02] font-bold uppercase md:text-[56px]",
          tone === "light" && "text-[#0f2a1a]",
        )}
      >
        {title}
      </h2>
    </div>
  );
}
