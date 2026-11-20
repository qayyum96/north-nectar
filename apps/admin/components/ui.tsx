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

/* ----------------------------------------------------------------------------------------------
 * Shared pieces for the list and detail pages (orders, customers, messages...)
 * -------------------------------------------------------------------------------------------- */

export const extraButtonStyles = {
  /** Secondary button with red text (Cancel order). */
  danger: cn(buttonStyles.secondary, "text-[#b42318]"),
  /** 36px toolbar button (Sort, Columns, Export in a card toolbar, pagination). */
  tool: "border-admin-field text-admin-text inline-flex h-9 cursor-pointer items-center gap-[6px] rounded-[8px] border bg-white px-3 text-[14px] font-semibold whitespace-nowrap hover:bg-[#fafaf9] disabled:cursor-default disabled:opacity-50",
};

export interface KpiItem {
  label: string;
  value: string;
  note?: ReactNode;
  /** Red value and note (e.g. orders waiting to be confirmed). */
  alert?: boolean;
  /** Green value (e.g. stock went up). */
  good?: boolean;
}

/** Row of headline numbers in one white card, divided by hairlines (mockup KPI strip). */
export function KpiStrip({ items }: { items: KpiItem[] }) {
  return (
    <div className="border-admin-line grid grid-cols-2 overflow-hidden rounded-[12px] border bg-white md:grid-cols-[repeat(auto-fit,minmax(210px,1fr))]">
      {items.map((k) => (
        <div
          key={k.label}
          className="flex min-w-0 flex-col gap-1 px-4 py-[14px] shadow-[-1px_0_0_#e3e3e3,0_-1px_0_#e3e3e3] md:px-5 md:py-[18px]"
        >
          <span className="text-admin-label text-[14px] leading-[1.35] font-semibold tracking-[0.05em] uppercase">
            {k.label}
          </span>
          <span
            className={cn(
              "overflow-hidden text-[22px] leading-[1.25] font-bold tracking-[-0.02em] text-ellipsis whitespace-nowrap md:text-[28px]",
              k.alert ? "text-[#b42318]" : k.good ? "text-[#1d6b3a]" : "text-admin-text",
            )}
          >
            {k.value}
          </span>
          {k.note ? (
            <span className={cn("text-[14px]", k.alert ? "text-[#b42318]" : "text-admin-muted")}>
              {k.note}
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

/** Round initials avatar (34px in tables). */
export function Avatar({ initials, size = 34 }: { initials: string; size?: number }) {
  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size }}
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#efebe4] text-[14px] font-semibold text-[#5c5446]"
    >
      {initials}
    </span>
  );
}

/** Text field, select and textarea styles from the mockup forms. */
export const fieldStyles = {
  input:
    "text-admin-text box-border h-10 w-full rounded-[10px] border border-[#d4d4d1] bg-white px-3 text-[14px] placeholder:text-[#8a8a86]",
  textarea:
    "text-admin-text box-border min-h-[92px] w-full resize-y rounded-[10px] border border-[#d4d4d1] bg-white px-3 py-[10px] text-[14px] placeholder:text-[#8a8a86]",
  label: "text-admin-text text-[14px] font-semibold",
};

/** Native select with the mockup's chevron. */
export function SelectBox({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <span className="relative block">
      <select
        {...props}
        className={cn(fieldStyles.input, "cursor-pointer appearance-none pr-[34px]", className)}
      >
        {children}
      </select>
      <span className="text-admin-muted pointer-events-none absolute top-[11px] right-[10px]">
        <Icon name="down" size={16} />
      </span>
    </span>
  );
}

/** Labelled form field (label above the control). */
export function Field({
  label,
  hint,
  error,
  children,
  htmlFor,
}: {
  label: string;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="flex flex-col gap-[6px]">
      <label htmlFor={htmlFor} className={fieldStyles.label}>
        {label}
      </label>
      {children}
      {error ? (
        <span className="text-[14px] text-[#b42318]">{error}</span>
      ) : hint ? (
        <span className="text-admin-muted text-[14px]">{hint}</span>
      ) : null}
    </div>
  );
}

/** Table frame: header row background shades the last (actions) column like the mockup. */
export const tableStyles = {
  head: "text-admin-label grid min-h-[46px] items-center gap-4 border-b border-admin-line px-4 text-[14px] font-semibold tracking-[0.05em] uppercase",
  headShade: "bg-[linear-gradient(to_left,#efede8_62px,#f4f2ee_62px)]",
  row: "text-admin-text box-border grid items-center gap-4 border-b border-[#ecebe7] px-4 py-[10px] text-[14px]",
  rowShade: "bg-[linear-gradient(to_left,#f7f6f3_62px,#ffffff_62px)]",
};

/** On/off switch (mockup payment toggles): 42 × 24, forest green when on. */
export function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-[42px] shrink-0 cursor-pointer rounded-full border-0 p-0 transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-forest-600" : "bg-[#d4d4d1]",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute top-[3px] size-[18px] rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.3)] transition-[left]",
          checked ? "left-[21px]" : "left-[3px]",
        )}
      />
    </button>
  );
}
