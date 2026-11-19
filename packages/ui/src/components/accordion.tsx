import type { ReactNode } from "react";
import { MinusIcon, PlusIcon } from "../icons";
import { cn } from "../lib/cn";

export interface AccordionItemProps {
  /**
   * Items sharing a `group` name behave as an exclusive accordion (one open at a time).
   * This uses the native `<details name>` attribute, so it needs no client JavaScript.
   */
  group: string;
  title: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export function AccordionItem({
  group,
  title,
  children,
  defaultOpen,
  className,
}: AccordionItemProps) {
  return (
    <details
      name={group}
      open={defaultOpen}
      className={cn("group rounded-card border border-line bg-white", className)}
    >
      <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 rounded-card px-5 py-4 text-lg font-bold text-forest-900 [&::-webkit-details-marker]:hidden">
        <span>{title}</span>
        <span
          aria-hidden="true"
          className="grid size-8 shrink-0 place-items-center rounded-full bg-sand-200 text-ink transition-colors group-open:bg-forest-600 group-open:text-white"
        >
          <PlusIcon size={16} className="group-open:hidden" />
          <MinusIcon size={16} className="hidden group-open:block" />
        </span>
      </summary>
      <div className="px-5 pb-5 text-md leading-relaxed text-body">{children}</div>
    </details>
  );
}
