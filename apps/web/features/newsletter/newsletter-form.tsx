"use client";

import { CheckCircleIcon, cn } from "@northnectar/ui";
import { useActionState, useId } from "react";
import { subscribeToNewsletter } from "./actions";
import type { NewsletterState } from "./schema";

const initialState: NewsletterState = { status: "idle" };

/**
 * Works without JavaScript (plain form POST to a Server Action); with JavaScript it shows
 * inline success and error states.
 */
export function NewsletterForm({ tone, source }: { tone: "light" | "dark"; source: string }) {
  const [state, action, pending] = useActionState(subscribeToNewsletter, initialState);
  const id = useId();
  const inputId = `${id}-email`;
  const msgId = `${id}-msg`;
  const isError = state.status === "error";

  if (state.status === "success") {
    return (
      <p
        role="status"
        className={cn(
          "flex items-center gap-3 rounded-xl px-5 py-4 text-base font-semibold",
          tone === "dark" ? "bg-forest-700 text-kraft" : "bg-mint-50 text-forest-700",
        )}
      >
        <CheckCircleIcon size={22} className="shrink-0" />
        {state.message}
      </p>
    );
  }

  return (
    <form action={action} noValidate className="w-full">
      <label
        htmlFor={inputId}
        className={cn("mb-2 block text-md", tone === "dark" ? "text-kraft" : "sr-only")}
      >
        Email address
      </label>
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-0">
        <input
          id={inputId}
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          placeholder={tone === "dark" ? "you@example.com" : "Your email address"}
          aria-invalid={isError || undefined}
          aria-describedby={isError ? msgId : undefined}
          className={cn(
            "h-14 w-full min-w-0 rounded-xl border bg-white px-5 text-base text-ink placeholder:text-muted sm:flex-1 sm:rounded-r-none",
            isError ? "border-danger-700" : tone === "dark" ? "border-white" : "border-line-strong",
            tone === "dark" && "sm:mr-2.5 sm:rounded-r-xl",
          )}
        />
        {/* Honeypot, hidden from people and assistive tech. */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label>
            Company
            <input type="text" name="company" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
        <input type="hidden" name="source" value={source} />
        <button
          type="submit"
          disabled={pending}
          className={cn(
            "h-14 shrink-0 cursor-pointer rounded-xl px-7 font-bold transition-colors disabled:opacity-60 sm:rounded-l-none",
            tone === "dark"
              ? "bg-gold-400 text-forest-950 hover:bg-gold-300 sm:rounded-l-xl"
              : "bg-forest-600 tracking-[0.08em] text-white uppercase hover:bg-forest-800",
          )}
        >
          {pending ? "Subscribing…" : "Subscribe"}
        </button>
      </div>
      {isError ? (
        <p
          id={msgId}
          role="alert"
          className={cn(
            "mt-2 text-sm font-semibold",
            tone === "dark" ? "text-danger-on-dark" : "text-danger-700",
          )}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
