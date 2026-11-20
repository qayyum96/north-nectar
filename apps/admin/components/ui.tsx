import { cn } from "@northnectar/ui";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { Icon, type IconName } from "./icon";

/* Admin primitives with the admin mockup's values. */

export function PageHeader({
  crumbs,
  title,
  subtitle,
  actions,
  badge,
}: {
  crumbs: { label: string; href?: string }[];
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  badge?: ReactNode;
}) {
  return (
    <div className="border-admin-line bg-admin-panel sticky top-14 z-[15] border-b">
      <div className="mx-auto max-w-[1320px] px-4 pt-[14px] pb-5 md:px-8 md:pt-[18px]">
        <nav
          aria-label="Breadcrumb"
          className="text-admin-muted flex min-h-5 flex-wrap items-center gap-[6px] text-[14px]"
        >
          {crumbs.map((c, i) => (
            <span key={`${c.label}-${i}`} className="inline-flex items-center gap-[6px]">
              {i > 0 ? (
                <span aria-hidden="true" className="text-[#b5b5b0]">
                  /
                </span>
              ) : null}
              {c.href ? (
                <Link href={c.href} className="hover:text-admin-text hover:underline">
                  {c.label}
                </Link>
              ) : (
                <span aria-current={i === crumbs.length - 1 ? "page" : undefined}>{c.label}</span>
              )}
            </span>
          ))}
        </nav>
        <div className="mt-[6px] flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-[10px]">
              <h1 className="text-admin-text m-0 text-[22px] leading-[1.25] font-bold tracking-[-0.015em] md:text-[26px]">
                {title}
              </h1>
              {badge}
            </div>
            {subtitle ? <div className="text-admin-muted mt-1 text-[14px]">{subtitle}</div> : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
      </div>
    </div>
  );
}

export function PageBody({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-[1320px] px-4 md:px-8">
      <div className="flex flex-col gap-4 pt-4 md:pt-5">{children}</div>
    </div>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <section
      className={cn(
        "border-admin-line box-border rounded-[12px] border bg-white p-5 shadow-[0_1px_0_rgba(0,0,0,0.03)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function CardHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 pb-[14px]">
      <h2 className="text-admin-text m-0 text-[15px] leading-[1.5] font-[650]">{title}</h2>
      {action}
    </div>
  );
}

export function TextLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="text-[14px] font-semibold text-forest-600 hover:underline">
      {children}
    </Link>
  );
}

const buttonBase =
  "inline-flex h-[38px] cursor-pointer items-center gap-[6px] rounded-[8px] border text-[14px] font-semibold whitespace-nowrap";
export const buttonStyles = {
  secondary: cn(
    buttonBase,
    "border-admin-field text-admin-text bg-white px-4 shadow-[0_1px_1px_rgba(0,0,0,0.04)] hover:bg-[#fafaf9]",
  ),
  primary: cn(
    buttonBase,
    "border-forest-600 bg-forest-600 px-[18px] text-white shadow-[0_1px_1px_rgba(0,0,0,0.08)] hover:bg-forest-700",
  ),
};

export function ButtonLink({
  href,
  variant = "secondary",
  icon,
  children,
  ...rest
}: {
  href: string;
  variant?: "primary" | "secondary";
  icon?: IconName;
  children: ReactNode;
} & Omit<ComponentProps<"a">, "href">) {
  return (
    <Link href={href} className={buttonStyles[variant]} {...rest}>
      {icon ? <Icon name={icon} size={16} /> : null}
      {children}
    </Link>
  );
}

/** Segmented control (mockup "tablist" pills). Items are links so filters live in the URL. */
export function Segmented({
  label,
  items,
}: {
  label: string;
  items: { label: string; href: string; active: boolean }[];
}) {
  return (
    <nav
      aria-label={label}
      className="bg-admin-seg inline-flex max-w-full gap-[2px] overflow-x-auto rounded-[10px] p-[3px]"
    >
      {items.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          aria-current={item.active ? "true" : undefined}
          scroll={false}
          className={cn(
            "text-admin-text inline-flex h-8 shrink-0 items-center rounded-[8px] px-[14px] text-[14px] whitespace-nowrap",
            item.active
              ? "bg-white font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.12)]"
              : "font-medium hover:bg-white/60",
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

/** Status colours from the mockup. */
const BADGE: Record<string, [string, string]> = {
  pending: ["#fff1d6", "#8a5a00"],
  confirmed: ["#e3eefc", "#1f5fae"],
  shipped: ["#efe7fb", "#6a3fb5"],
  delivered: ["#e3f4e8", "#1d6b3a"],
  cancelled: ["#ececea", "#555555"],
  returned: ["#fde8e6", "#9b2c22"],
  paid: ["#e3f4e8", "#1d6b3a"],
  unpaid: ["#fff1d6", "#8a5a00"],
  refunded: ["#ececea", "#555555"],
  active: ["#e3f4e8", "#1d6b3a"],
  draft: ["#ececea", "#555555"],
  "in stock": ["#e3f4e8", "#1d6b3a"],
  "low stock": ["#fff1d6", "#8a5a00"],
  "out of stock": ["#fde8e6", "#9b2c22"],
  open: ["#fff1d6", "#8a5a00"],
  resolved: ["#e3f4e8", "#1d6b3a"],
};

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const [bg, fg] = BADGE[status.toLowerCase()] ?? ["#ececea", "#555555"];
  const text = label ?? status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span
      className="inline-flex h-6 items-center gap-[6px] justify-self-start rounded-full px-[10px] text-[14px] font-semibold whitespace-nowrap"
      style={{ background: bg, color: fg }}
    >
      <span aria-hidden="true" className="size-[6px] rounded-full" style={{ background: fg }} />
      {text}
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  children,
}: {
  icon: IconName;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
      <span className="grid size-10 place-items-center rounded-full bg-[#eef3ec] text-forest-600">
        <Icon name={icon} size={18} />
      </span>
      <p className="m-0 font-semibold">{title}</p>
      {children ? <div className="text-admin-muted max-w-[360px]">{children}</div> : null}
    </div>
  );
}
