"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Icon } from "./icon";

export interface ToastAction {
  label: string;
  /** Opens a link (e.g. a prefilled WhatsApp chat) in a new tab. */
  href?: string;
  onClick?: () => void;
}

interface ToastState {
  id: number;
  text: string;
  actions: ToastAction[];
  tone: "success" | "error";
}

interface ToastApi {
  show: (text: string, action?: ToastAction | ToastAction[]) => void;
  error: (text: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

/** Dark toast at the bottom of the screen (mockup "toast" screen). Hides after 4.2 s. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const open = useCallback((t: Omit<ToastState, "id">) => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ ...t, id: Date.now() });
    // Links (WhatsApp) stay a little longer so there is time to tap them.
    timer.current = setTimeout(() => setToast(null), t.actions.some((a) => a.href) ? 8000 : 4200);
  }, []);

  useEffect(() => () => (timer.current ? clearTimeout(timer.current) : undefined), []);

  const api: ToastApi = {
    show: (text, action) => open({ text, actions: action ? [action].flat() : [], tone: "success" }),
    error: (text) => open({ text, actions: [], tone: "error" }),
  };

  const dismiss = () => setToast(null);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-7 z-[60] flex justify-center px-4"
      >
        {toast ? (
          <div
            key={toast.id}
            role="status"
            className="pointer-events-auto inline-flex max-w-full items-center gap-3 rounded-[12px] bg-[#1a1a1a] py-3 pr-[14px] pl-4 text-[14px] text-white shadow-[0_16px_34px_rgba(0,0,0,0.3)]"
          >
            <span className={toast.tone === "error" ? "text-[#f4a39a]" : "text-[#9ed7a6]"}>
              <Icon name={toast.tone === "error" ? "x" : "check"} size={18} />
            </span>
            <span className="min-w-0 md:whitespace-nowrap">{toast.text}</span>
            {toast.actions.length > 0 ? (
              toast.actions.map((a) =>
                a.href ? (
                  <a
                    key={a.label}
                    href={a.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      a.onClick?.();
                      dismiss();
                    }}
                    className="pl-[6px] font-semibold whitespace-nowrap text-[#9ed7a6] hover:underline"
                  >
                    {a.label}
                  </a>
                ) : (
                  <button
                    key={a.label}
                    type="button"
                    onClick={() => {
                      a.onClick?.();
                      dismiss();
                    }}
                    className="cursor-pointer border-0 bg-transparent p-0 pl-[6px] font-semibold whitespace-nowrap text-[#9ed7a6] hover:underline"
                  >
                    {a.label}
                  </button>
                ),
              )
            ) : (
              <button
                type="button"
                onClick={dismiss}
                className="cursor-pointer border-0 bg-transparent p-0 pl-[6px] font-semibold text-[#9ed7a6] hover:underline"
              >
                Dismiss
              </button>
            )}
          </div>
        ) : null}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
