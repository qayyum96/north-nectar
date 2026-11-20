"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, type ReactNode } from "react";
import { cn } from "@northnectar/ui";
import { requestPasswordReset, signIn, updatePassword, type AuthFormState } from "./actions";

const initial: AuthFormState = { status: "idle" };

const inputClass = (invalid: boolean) =>
  cn(
    "text-admin-text h-[46px] w-full rounded-[10px] border bg-white px-3 text-[14px] placeholder:text-[#8a8a86]",
    invalid ? "border-[#d92d20]" : "border-admin-field",
  );

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <>
      <Image
        src="/images/emblem-green.svg"
        alt=""
        width={1488}
        height={660}
        unoptimized
        className="h-10 w-auto self-start"
      />
      <div className="flex flex-col gap-1">
        <h1 className="m-0 text-[22px] leading-[1.5] font-bold">{title}</h1>
        <p className="text-admin-muted m-0 text-[14px]">{subtitle}</p>
      </div>
    </>
  );
}

function Notice({ tone, children }: { tone: "error" | "success"; children: ReactNode }) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "rounded-[10px] border px-[14px] py-3 text-[14px]",
        tone === "error"
          ? "border-[#f5c2bc] bg-[#fdecea] text-[#8f1d14]"
          : "border-[#c9e4cf] bg-[#e9f5ec] text-[#1d6b3a]",
      )}
    >
      {children}
    </div>
  );
}

const submitClass =
  "h-11 cursor-pointer rounded-full border-0 bg-forest-600 text-[15px] font-semibold text-white hover:bg-forest-700 disabled:cursor-wait disabled:opacity-70";

const LINK_ERRORS: Record<string, string> = {
  "no-access": "This account doesn't have access to the admin. Ask the store owner to invite you.",
  "link-expired": "That link has expired or was already used. Request a new one below.",
};

export function LoginForm({ next, linkError }: { next: string; linkError?: string }) {
  const [state, action, pending] = useActionState(signIn, initial);
  const error =
    state.status === "error" ? state.message : linkError ? LINK_ERRORS[linkError] : undefined;
  const invalid = state.status === "error";
  return (
    <form action={action} className="flex w-full max-w-[380px] flex-col gap-[18px]" noValidate>
      <Header title="Sign in to your admin" subtitle="North Nectar store · northnectar.com" />
      {error ? <Notice tone="error">{error}</Notice> : null}
      <input type="hidden" name="next" value={next} />
      <label className="flex flex-col gap-[6px]">
        <span className="text-[14px] font-semibold">Email</span>
        <input
          name="email"
          type="email"
          autoComplete="username"
          required
          defaultValue={state.email}
          placeholder="you@northnectar.com"
          aria-invalid={invalid}
          className={inputClass(invalid)}
        />
      </label>
      <div className="flex flex-col gap-[6px]">
        <span className="flex justify-between">
          <label htmlFor="password" className="text-[14px] font-semibold">
            Password
          </label>
          <Link
            href="/forgot-password"
            className="text-[14px] font-semibold text-forest-600 hover:underline"
          >
            Forgot password?
          </Link>
        </span>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="Your password"
          aria-invalid={invalid}
          className={inputClass(invalid)}
        />
      </div>
      <label className="inline-flex cursor-pointer items-center gap-2 self-start text-[14px]">
        <input
          type="checkbox"
          name="remember"
          defaultChecked
          className="m-[3px] size-4 accent-forest-600"
        />
        Keep me signed in on this device
      </label>
      <button type="submit" disabled={pending} className={submitClass}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
      <p className="text-admin-muted m-0 text-center text-[14px]">
        Need access? Ask the store owner to invite you.
      </p>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, initial);
  return (
    <form action={action} className="flex w-full max-w-[380px] flex-col gap-[18px]" noValidate>
      <Header
        title="Reset your password"
        subtitle="We'll email you a link to choose a new password."
      />
      {state.status === "error" ? <Notice tone="error">{state.message}</Notice> : null}
      {state.status === "success" ? <Notice tone="success">{state.message}</Notice> : null}
      <label className="flex flex-col gap-[6px]">
        <span className="text-[14px] font-semibold">Email</span>
        <input
          name="email"
          type="email"
          autoComplete="username"
          required
          defaultValue={state.email}
          placeholder="you@northnectar.com"
          aria-invalid={state.status === "error"}
          className={inputClass(state.status === "error")}
        />
      </label>
      <button type="submit" disabled={pending} className={submitClass}>
        {pending ? "Sending…" : "Send reset link"}
      </button>
      <Link
        href="/login"
        className="text-center text-[14px] font-semibold text-forest-600 hover:underline"
      >
        Back to sign in
      </Link>
    </form>
  );
}

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, initial);
  const invalid = state.status === "error";
  return (
    <form action={action} className="flex w-full max-w-[380px] flex-col gap-[18px]" noValidate>
      <Header title="Choose a new password" subtitle="Use at least 10 characters." />
      {invalid ? <Notice tone="error">{state.message}</Notice> : null}
      <label className="flex flex-col gap-[6px]">
        <span className="text-[14px] font-semibold">New password</span>
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={10}
          aria-invalid={invalid}
          className={inputClass(invalid)}
        />
      </label>
      <label className="flex flex-col gap-[6px]">
        <span className="text-[14px] font-semibold">Repeat new password</span>
        <input
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={10}
          aria-invalid={invalid}
          className={inputClass(invalid)}
        />
      </label>
      <button type="submit" disabled={pending} className={submitClass}>
        {pending ? "Saving…" : "Save new password"}
      </button>
    </form>
  );
}
