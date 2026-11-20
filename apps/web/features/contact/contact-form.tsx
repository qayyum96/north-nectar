"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CONTACT_SUBJECTS } from "@northnectar/types";
import { AlertCircleIcon, CheckIcon, ChevronDownIcon, cn } from "@northnectar/ui";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useForm } from "react-hook-form";
import { contactContent } from "@/content/contact";
import { sendContactMessage } from "./actions";
import {
  contactDefaults,
  contactSchema,
  errorSummary,
  type ContactField,
  type ContactInput,
  type ContactState,
  type ContactValues,
} from "./schema";

export interface ContactProductOption {
  slug: string;
  name: string;
}

const initialState: ContactState = { status: "idle" };
const copy = contactContent.form;

const control =
  "w-full rounded-[12px] border-[1.5px] bg-white px-4 text-[16px] text-ink placeholder:text-[#8a836f]";
const controlBorder = (invalid: boolean) => (invalid ? "border-[#b42318]" : "border-[#ddd3bf]");

/** Reads ?subject= and ?product= (e.g. a product page's wholesale link) to prefill the form. */
function useInitialValues(products: ContactProductOption[]): ContactInput {
  const params = useSearchParams();
  const subjectParam = params.get("subject");
  const subject = CONTACT_SUBJECTS.find((s) => s.value === subjectParam)?.value;
  const product = products.find((p) => p.slug === params.get("product"));
  return {
    ...contactDefaults,
    subject: subject ?? (product ? "wholesale" : contactDefaults.subject),
    message: product ? copy.wholesaleMessage(product.name) : "",
  };
}

/** The contact form, prefilled from the URL. Render inside <Suspense> with <ContactFormFallback>. */
export function ContactForm({ products }: { products: ContactProductOption[] }) {
  return <ContactFormBody initial={useInitialValues(products)} />;
}

/** Same form without URL prefill: the static HTML, shown until the URL has been read. */
export function ContactFormFallback() {
  return <ContactFormBody initial={contactDefaults} />;
}

/**
 * Validates in the browser with React Hook Form + Zod (errors on submit, then live as fields are
 * corrected), then posts to the Server Action, which validates again. Without JavaScript the form
 * still posts to the Server Action and renders its errors or success state.
 */
function ContactFormBody({ initial }: { initial: ContactInput }) {
  const [state, formAction, pending] = useActionState(sendContactMessage, initialState);
  const [dismissedId, setDismissedId] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const serverError = state.status === "error" ? state : null;
  // Also rendered into the HTML so values survive a no-JavaScript round trip.
  const defaults = serverError?.values ?? initial;

  const {
    register,
    handleSubmit,
    reset,
    setError,
    setFocus,
    formState: { errors, isSubmitted },
  } = useForm<ContactInput, unknown, ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: defaults,
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  // Errors only the server found (rare: the browser runs the same schema) join the client errors.
  useEffect(() => {
    if (state.status !== "error") return;
    for (const [field, message] of Object.entries(state.fieldErrors)) {
      setError(field as ContactField, { type: "server", message });
    }
  }, [state, setError]);

  const fieldError = (field: ContactField) =>
    errors[field]?.message ?? (!isSubmitted ? serverError?.fieldErrors[field] : undefined);
  const fields: ContactField[] = ["name", "email", "phone", "subject", "message"];
  const errorCount = fields.filter((f) => fieldError(f)).length;

  if (state.status === "success" && state.id !== dismissedId) {
    return (
      <div role="status" className="flex flex-col items-start gap-4 py-3">
        <span className="inline-flex size-[72px] items-center justify-center rounded-full bg-[#e7efe2] text-[#1f6b3a]">
          <CheckIcon size={34} strokeWidth={2.4} />
        </span>
        <h2 className="m-0 font-display text-[30px] leading-[1.02] font-bold text-[#0f2a1a] uppercase md:text-[40px]">
          {copy.success.title}
        </h2>
        <p className="m-0 text-[17px] leading-[1.6] text-[#3f4a40]">
          {copy.success.before(state.firstName)}
          <strong>{state.email}</strong>
          {copy.success.after}
        </p>
        <div className="flex flex-wrap gap-3 pt-[6px]">
          <Link
            href="/shop"
            className="inline-flex h-[52px] items-center rounded-full bg-forest-600 px-[26px] font-display text-[17px] font-semibold tracking-[0.04em] text-white uppercase hover:bg-forest-700"
          >
            {copy.success.shop}
          </Link>
          {/* A link so it also works without JavaScript (reloads a fresh form). */}
          <a
            href="/contact"
            onClick={(event) => {
              event.preventDefault();
              setDismissedId(state.id);
              reset(contactDefaults);
              requestAnimationFrame(() => setFocus("name"));
            }}
            className="inline-flex h-[52px] items-center rounded-full bg-[#efe7d6] px-6 text-[15px] font-bold text-ink hover:bg-[#e5dbc4]"
          >
            {copy.success.again}
          </a>
        </div>
      </div>
    );
  }

  const onValid = () => {
    const form = formRef.current;
    if (!form) return;
    startTransition(() => formAction(new FormData(form)));
  };

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={(event) => void handleSubmit(onValid)(event)}
      noValidate
      aria-labelledby="contact-form-title"
      className="flex flex-col gap-5"
    >
      <div className="flex flex-col gap-[6px]">
        <h2
          id="contact-form-title"
          className="m-0 font-display text-[30px] leading-[1.02] font-bold text-[#0f2a1a] uppercase md:text-[40px]"
        >
          {copy.title}
        </h2>
        <p className="m-0 text-[15px] leading-[1.5] text-[#6a665a]">{copy.requiredNote}</p>
      </div>

      {errorCount > 0 ? (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-[14px] border border-[#f5c2bc] bg-[#fdecea] px-4 py-[14px] text-[#8f1d14]"
        >
          <AlertCircleIcon size={20} strokeWidth={2.2} className="mt-[2px] shrink-0" />
          <p className="m-0 text-[15px] leading-[1.5]">
            <strong>{errorSummary(errorCount)}</strong> and try again.
          </p>
        </div>
      ) : null}

      <div className="grid gap-[18px] md:grid-cols-2">
        <Field id="cf-name" label="Full name" required error={fieldError("name")}>
          <input
            id="cf-name"
            type="text"
            autoComplete="name"
            aria-required="true"
            aria-invalid={Boolean(fieldError("name"))}
            aria-describedby={fieldError("name") ? "cf-name-error" : undefined}
            className={cn(control, "h-[54px]", controlBorder(Boolean(fieldError("name"))))}
            defaultValue={defaults.name}
            {...register("name")}
          />
        </Field>
        <Field id="cf-email" label="Email" required error={fieldError("email")}>
          <input
            id="cf-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            aria-required="true"
            aria-invalid={Boolean(fieldError("email"))}
            aria-describedby={fieldError("email") ? "cf-email-error" : undefined}
            className={cn(control, "h-[54px]", controlBorder(Boolean(fieldError("email"))))}
            defaultValue={defaults.email}
            {...register("email")}
          />
        </Field>
        <Field id="cf-phone" label="Phone" optional error={fieldError("phone")}>
          <input
            id="cf-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            aria-invalid={Boolean(fieldError("phone"))}
            aria-describedby={fieldError("phone") ? "cf-phone-error" : undefined}
            className={cn(control, "h-[54px]", controlBorder(Boolean(fieldError("phone"))))}
            defaultValue={defaults.phone}
            {...register("phone")}
          />
        </Field>
        <Field id="cf-subject" label="Subject" error={fieldError("subject")}>
          <div className="relative">
            <select
              id="cf-subject"
              className={cn(
                control,
                "h-[54px] cursor-pointer appearance-none pr-10",
                controlBorder(Boolean(fieldError("subject"))),
              )}
              defaultValue={defaults.subject}
              {...register("subject")}
            >
              {CONTACT_SUBJECTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <ChevronDownIcon
              size={18}
              strokeWidth={2}
              className="pointer-events-none absolute top-[18px] right-[14px] text-[#5e5a4e]"
            />
          </div>
        </Field>
      </div>

      <Field id="cf-message" label="Message" required error={fieldError("message")}>
        <textarea
          id="cf-message"
          aria-required="true"
          aria-invalid={Boolean(fieldError("message"))}
          aria-describedby={fieldError("message") ? "cf-message-error" : undefined}
          className={cn(
            control,
            "block h-[150px] resize-y py-[14px]",
            controlBorder(Boolean(fieldError("message"))),
          )}
          defaultValue={defaults.message}
          {...register("message")}
        />
      </Field>

      {/* Honeypot, hidden from people and assistive tech. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Company
          <input type="text" name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <input type="hidden" name="source" value="/contact" />

      <button
        type="submit"
        disabled={pending}
        className="h-[58px] cursor-pointer self-start rounded-full bg-forest-600 px-[34px] font-display text-[18px] font-semibold tracking-[0.04em] text-white uppercase transition-colors hover:bg-forest-700 disabled:cursor-wait disabled:opacity-70"
      >
        {pending ? copy.sending : copy.submit}
      </button>
    </form>
  );
}

function Field({
  id,
  label,
  required,
  optional,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  optional?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-[15px] leading-[1.5] font-bold text-ink">
        {label}{" "}
        {required ? (
          <span aria-hidden="true" className="text-[#b42318]">
            *
          </span>
        ) : null}
        {optional ? <span className="font-medium text-[#6a665a]">(optional)</span> : null}
      </label>
      {children}
      {error ? (
        <p
          id={`${id}-error`}
          className="m-0 inline-flex items-center gap-[6px] text-[14px] leading-[1.5] font-semibold text-[#b42318]"
        >
          <AlertCircleIcon size={16} strokeWidth={2.2} className="shrink-0" />
          {error}
        </p>
      ) : null}
    </div>
  );
}
