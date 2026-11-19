import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/cn";

type PolymorphicProps<T extends ElementType> = { as?: T } & HTMLAttributes<HTMLElement>;

/** Centred page container: 16px gutter on phones, 24px on tablets, 32px on desktop. */
export function Container<T extends ElementType = "div">({
  as,
  className,
  ...props
}: PolymorphicProps<T>) {
  const Tag = (as ?? "div") as ElementType;
  return (
    <Tag className={cn("mx-auto w-full max-w-site px-4 sm:px-6 lg:px-8", className)} {...props} />
  );
}

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-card border border-line bg-surface", className)} {...props} />;
}

export function VisuallyHidden({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("sr-only", className)} {...props} />;
}

export function Eyebrow({
  className,
  tone = "light",
  ...props
}: HTMLAttributes<HTMLParagraphElement> & { tone?: "light" | "dark" | "warm" }) {
  return (
    <p
      className={cn(
        "text-sm font-bold tracking-eyebrow uppercase",
        tone === "light" && "text-leaf-600",
        tone === "dark" && "text-mint-300",
        tone === "warm" && "text-rust-700",
        className,
      )}
      {...props}
    />
  );
}

type HeadingLevel = "h1" | "h2" | "h3";

export interface SectionHeadingProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** Right-aligned slot on wide screens (e.g. "View all products" or tabs). */
  action?: ReactNode;
  as?: HeadingLevel;
  align?: "left" | "center";
  tone?: "light" | "dark";
  id?: string;
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  as: Heading = "h2",
  align = "left",
  tone = "light",
  id,
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-5 md:flex-row md:items-end md:justify-between",
        align === "center" && "items-center text-center md:flex-col md:items-center",
        className,
      )}
    >
      <div className={cn("max-w-3xl", align === "center" && "mx-auto")}>
        {eyebrow ? (
          <Eyebrow tone={tone === "dark" ? "dark" : "light"} className="mb-3">
            {eyebrow}
          </Eyebrow>
        ) : null}
        <Heading
          id={id}
          className={cn(
            "font-display text-display-lg font-bold uppercase",
            tone === "dark" ? "text-white" : "text-forest-900",
          )}
        >
          {title}
        </Heading>
        {description ? (
          <p className={cn("mt-4 text-lg", tone === "dark" ? "text-sand-100/85" : "text-body")}>
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
