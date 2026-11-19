"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { CloseIcon } from "../icons";
import { cn } from "../lib/cn";

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  /** Visible heading, also used as the dialog's accessible name. */
  title: ReactNode;
  side?: "right" | "left";
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  closeLabel?: string;
}

/**
 * Slide-out panel built on the native <dialog> element. `showModal()` gives us focus trapping,
 * Escape to close, an inert page behind and focus returning to the trigger, with no extra library.
 * The slide animation is pure CSS (@starting-style) and is switched off for reduced motion.
 */
export function Drawer({
  open,
  onClose,
  title,
  side = "right",
  children,
  footer,
  className,
  closeLabel = "Close",
}: DrawerProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        // A click on the backdrop targets the <dialog> itself, not its content.
        if (e.target === e.currentTarget) onClose();
      }}
      className={cn(
        "fixed inset-y-0 m-0 h-dvh max-h-dvh w-full max-w-[28rem] overflow-hidden bg-cream p-0 text-ink shadow-drawer",
        "transition-[translate,overlay,display] transition-discrete duration-300 ease-out-expo motion-reduce:transition-none",
        "backdrop:bg-forest-950/0 backdrop:transition-[background-color,overlay,display] backdrop:transition-discrete backdrop:duration-300",
        "open:backdrop:bg-forest-950/50 starting:open:backdrop:bg-forest-950/0",
        side === "right"
          ? "right-0 left-auto translate-x-full open:translate-x-0 starting:open:translate-x-full"
          : "right-auto left-0 -translate-x-full open:translate-x-0 starting:open:-translate-x-full",
        className,
      )}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between gap-4 border-b border-line bg-white px-5 py-4">
          <h2
            id={titleId}
            className="font-display text-display-sm font-bold text-forest-900 uppercase"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="grid size-11 cursor-pointer place-items-center rounded-full bg-sand-200 text-ink transition-colors hover:bg-sand-300"
            aria-label={closeLabel}
          >
            <CloseIcon size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain">{children}</div>
        {footer ? <div className="border-t border-line bg-white px-5 py-4">{footer}</div> : null}
      </div>
    </dialog>
  );
}
