"use client";

import { cn } from "@northnectar/ui";
import { useEffect, useRef, type ReactNode } from "react";
import { Icon } from "./icon";

/**
 * Modal from the admin mockup (export, cancel order...). Built on the native <dialog> element, so
 * focus stays inside, Escape closes it and the page behind is inert.
 */
export function Dialog({
  open,
  onClose,
  title,
  width = 480,
  children,
  footer,
  note,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  width?: number;
  children: ReactNode;
  /** Buttons on the right of the footer. */
  footer?: ReactNode;
  /** Text on the left of the footer. */
  note?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  // A click on the backdrop (the dialog element itself, outside the panel) closes it.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onClick = (e: MouseEvent) => {
      if (e.target === el) onClose();
    };
    el.addEventListener("click", onClick);
    return () => el.removeEventListener("click", onClick);
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      aria-label={title}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      style={{ width: `min(${width}px, calc(100% - 40px))` }}
      className="text-admin-text m-auto max-h-[calc(100%-40px)] overflow-visible rounded-[16px] border-0 bg-transparent p-0 backdrop:bg-[rgba(20,20,18,0.45)]"
    >
      {open ? (
        <div className="flex max-h-[calc(100dvh-40px)] flex-col overflow-y-auto rounded-[16px] bg-white text-[14px] shadow-[0_30px_60px_rgba(0,0,0,0.25)]">
          <div className="border-admin-line flex items-center justify-between border-b px-5 py-[18px]">
            <h2 className="m-0 text-[17px] leading-[1.5] font-bold">{title}</h2>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="grid size-9 cursor-pointer place-items-center rounded-full border-0 bg-[#efefed] hover:bg-[#e6e6e3]"
            >
              <Icon name="x" size={18} />
            </button>
          </div>
          <div className="p-5">{children}</div>
          {footer ? (
            <div className="border-admin-line flex items-center justify-between gap-2 border-t px-5 py-4">
              <span className="text-admin-muted">{note}</span>
              <span className="flex flex-wrap justify-end gap-2">{footer}</span>
            </div>
          ) : null}
        </div>
      ) : null}
    </dialog>
  );
}

/** Red pill button used to confirm destructive actions (mockup "Cancel order"). */
export function DangerButton({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "h-9 cursor-pointer rounded-full border-0 bg-[#b42318] px-4 text-[14px] font-semibold text-white hover:bg-[#9b1f15] disabled:cursor-default disabled:opacity-60",
        className,
      )}
    />
  );
}

/** Panel that slides in from the right (mockup "Adjust stock"). Native <dialog> underneath. */
export function Drawer({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onClick = (e: MouseEvent) => {
      if (e.target === el) onClose();
    };
    el.addEventListener("click", onClick);
    return () => el.removeEventListener("click", onClick);
  }, [onClose]);
  return (
    <dialog
      ref={ref}
      aria-label={title}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      className="text-admin-text fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none border-0 bg-transparent p-0 backdrop:bg-[rgba(20,20,18,0.45)]"
    >
      {open ? (
        <aside className="absolute top-0 right-0 bottom-0 flex w-[min(440px,100%)] flex-col bg-white text-[14px] shadow-[-20px_0_40px_rgba(0,0,0,0.18)]">
          <div className="border-admin-line flex items-center justify-between border-b px-5 py-[18px]">
            <h2 className="m-0 text-[17px] leading-[1.5] font-bold">{title}</h2>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="grid size-9 cursor-pointer place-items-center rounded-full border-0 bg-[#efefed] hover:bg-[#e6e6e3]"
            >
              <Icon name="x" size={18} />
            </button>
          </div>
          <div className="flex flex-1 flex-col gap-[18px] overflow-y-auto p-5">{children}</div>
          {footer ? (
            <div className="border-admin-line flex justify-end gap-2 border-t px-5 py-4">
              {footer}
            </div>
          ) : null}
        </aside>
      ) : null}
    </dialog>
  );
}
