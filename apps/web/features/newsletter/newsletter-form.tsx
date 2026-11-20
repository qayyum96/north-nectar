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
        className={cn(
          "mb-2 block text-[14px] leading-[21px]",
          tone === "dark" ? "text-[#cdbf9f]" : "sr-only",
        )}
      >
        Email address
      </label>
      <div className={tone === "dark" ? "flex flex-wrap gap-[10px]" : "flex flex-wrap"}>
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
            tone === "dark"
              ? "h-[52px] min-w-0 flex-[1_1_220px] rounded-[10px] border border-white bg-white px-[18px] text-[16px] text-ink placeholder:text-[#6f6a5d]"
              : // Mockup: input and button joined (10px outer radius); the button wraps below on phones.
                "h-14 min-w-0 flex-[1_1_240px] rounded-l-[10px] border border-r-0 border-[#ddd5c4] bg-white px-5 text-[16px] text-ink placeholder:text-[#6f6a5d]",
            isError && "border-danger-700",
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
            "shrink-0 cursor-pointer transition-colors disabled:opacity-60",
            tone === "dark"
              ? "h-[52px] rounded-[10px] bg-[#d1ae6c] px-7 text-[16px] font-bold text-[#1a3a23] hover:bg-gold-300"
              : "h-14 rounded-r-[10px] bg-forest-600 px-[30px] text-[15px] font-extrabold tracking-[0.08em] text-white uppercase hover:bg-forest-800",
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
