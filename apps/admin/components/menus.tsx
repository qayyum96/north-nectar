"use client";

import { cn } from "@northnectar/ui";
import Link from "next/link";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Icon, type IconName } from "./icon";

export interface RowAction {
  label: string;
  href?: string;
  onSelect?: () => void;
  danger?: boolean;
}

/** Closes on outside click and Escape. */
function useDismiss(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);
  return ref;
}

/** The "⋮" button at the end of a table row. Actions open in a row to its left (mockup). */
export function RowMenu({
  actions,
  label = "More actions",
}: {
  actions: RowAction[];
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, () => setOpen(false));
  const id = useId();
  return (
    <div ref={ref} className="relative flex justify-center">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "border-admin-field text-admin-text inline-flex h-8 w-[38px] cursor-pointer items-center justify-center rounded-[8px] border",
          open ? "bg-admin-bg" : "bg-white hover:bg-[#fafaf9]",
        )}
      >
        <Icon name="kebab" size={18} strokeWidth={2.6} />
      </button>
      {open ? (
        <div
          id={id}
          role="menu"
          className="border-admin-line absolute top-1/2 right-[46px] z-[5] flex -translate-y-1/2 gap-[2px] rounded-[10px] border bg-white p-1 whitespace-nowrap shadow-[0_10px_24px_rgba(0,0,0,0.12)]"
        >
          {actions.map((a) => {
            const cls = cn(
              "hover:bg-admin-bg inline-flex h-8 cursor-pointer items-center rounded-[7px] border-0 bg-transparent px-3 text-[14px] font-semibold",
              a.danger ? "text-[#b42318]" : "text-admin-text",
            );
            return a.href ? (
              <Link
                key={a.label}
                role="menuitem"
                href={a.href}
                className={cls}
                onClick={() => setOpen(false)}
              >
                {a.label}
              </Link>
            ) : (
              <button
                key={a.label}
                type="button"
                role="menuitem"
                className={cls}
                onClick={() => {
                  setOpen(false);
                  a.onSelect?.();
                }}
              >
                {a.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

/** Toolbar button (Sort, Columns...) that opens a small panel below it. */
export function Popover({
  label,
  icon,
  iconOnly,
  align = "right",
  children,
}: {
  label: string;
  icon: IconName;
  iconOnly?: boolean;
  align?: "left" | "right";
  children: (close: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, () => setOpen(false));
  const id = useId();
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={iconOnly ? label : undefined}
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "border-admin-field text-admin-text inline-flex h-9 cursor-pointer items-center gap-[6px] rounded-[8px] border text-[14px] font-semibold whitespace-nowrap",
          iconOnly ? "px-[9px]" : "px-3",
          open ? "bg-admin-bg" : "bg-white hover:bg-[#fafaf9]",
        )}
      >
        <Icon name={icon} size={16} />
        {iconOnly ? null : label}
      </button>
      {open ? (
        <div
          id={id}
          className={cn(
            "border-admin-line absolute top-[calc(100%+6px)] z-30 min-w-[220px] rounded-[12px] border bg-white p-[6px] text-[14px] shadow-[0_12px_32px_rgba(0,0,0,0.14)]",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          {children(() => setOpen(false))}
        </div>
      ) : null}
    </div>
  );
}

/** One choice inside a Popover. */
export function PopoverItem({
  active,
  onSelect,
  children,
}: {
  active?: boolean;
  onSelect: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={cn(
        "hover:bg-admin-bg flex h-9 w-full cursor-pointer items-center justify-between gap-3 rounded-[8px] border-0 bg-transparent px-[10px] text-left text-[14px]",
        active ? "font-semibold" : "font-medium",
      )}
    >
      {children}
      {active ? <Icon name="check" size={16} className="text-forest-600" /> : null}
    </button>
  );
}
