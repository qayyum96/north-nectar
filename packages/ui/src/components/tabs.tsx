"use client";

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "../lib/cn";

export interface TabItem {
  id: string;
  label: ReactNode;
  /** Panel content. Rendered on the server and kept in the DOM (hidden when inactive). */
  content: ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  /** Accessible name for the tab list. */
  label: string;
  variant?: "pill" | "underline";
  defaultTab?: string;
  /** Classes for the tab list wrapper (e.g. alignment). */
  listClassName?: string;
  className?: string;
  /** Optional slot rendered next to the tab list (e.g. a section heading). */
  header?: ReactNode;
}

/**
 * WAI-ARIA tabs: arrow keys / Home / End move between tabs, only the active tab is in the tab
 * order, and every panel is server-rendered (inactive ones are `hidden`), so all content is
 * crawlable and works with JavaScript disabled for the first tab.
 */
export function Tabs({
  items,
  label,
  variant = "pill",
  defaultTab,
  listClassName,
  className,
  header,
}: TabsProps) {
  const baseId = useId();
  const [active, setActive] = useState(defaultTab ?? items[0]?.id);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const focusTab = (index: number) => {
    const next = (index + items.length) % items.length;
    const item = items[next];
    if (!item) return;
    setActive(item.id);
    tabRefs.current[next]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const keys: Record<string, () => void> = {
      ArrowRight: () => focusTab(index + 1),
      ArrowLeft: () => focusTab(index - 1),
      Home: () => focusTab(0),
      End: () => focusTab(items.length - 1),
    };
    const action = keys[event.key];
    if (action) {
      event.preventDefault();
      action();
    }
  };

  return (
    <div className={className}>
      <div
        className={cn(
          "flex flex-col gap-5 md:flex-row md:items-end md:justify-between",
          !header && "md:justify-end",
        )}
      >
        {header}
        <div
          role="tablist"
          aria-label={label}
          className={cn(
            "flex max-w-full overflow-x-auto [scrollbar-width:none]",
            variant === "pill"
              ? "w-max gap-1 rounded-full bg-[#efe7d6] p-1"
              : "w-full gap-[22px] border-b border-[#e3d8bf] md:gap-10",
            listClassName,
          )}
        >
          {items.map((item, index) => {
            const selected = item.id === active;
            return (
              <button
                key={item.id}
                ref={(el) => {
                  tabRefs.current[index] = el;
                }}
                type="button"
                role="tab"
                id={`${baseId}-tab-${item.id}`}
                aria-selected={selected}
                aria-controls={`${baseId}-panel-${item.id}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActive(item.id)}
                onKeyDown={(e) => onKeyDown(e, index)}
                className={cn(
                  "shrink-0 cursor-pointer whitespace-nowrap transition-colors",
                  variant === "pill"
                    ? cn(
                        "h-10 rounded-full px-[18px] text-[15px] font-semibold",
                        selected ? "bg-forest-600 text-white" : "text-ink hover:bg-sand-300",
                      )
                    : cn(
                        "h-14 px-[2px] font-display text-[17px] font-semibold tracking-[0.04em] uppercase md:text-[20px]",
                        selected
                          ? "text-[#0f2a1a] shadow-[inset_0_-3px_0_#234c2e]"
                          : "text-[#8a836f] hover:text-[#0f2a1a]",
                      ),
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
      {items.map((item) => (
        <div
          key={item.id}
          role="tabpanel"
          id={`${baseId}-panel-${item.id}`}
          aria-labelledby={`${baseId}-tab-${item.id}`}
          hidden={item.id !== active}
          tabIndex={0}
          className="outline-offset-4"
        >
          {item.content}
        </div>
      ))}
    </div>
  );
}
