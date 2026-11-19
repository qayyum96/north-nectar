import type {
  InputHTMLAttributes,
  LabelHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { AlertCircleIcon, ChevronDownIcon } from "../icons";
import { cn } from "../lib/cn";

const fieldBase =
  "w-full rounded-xl border border-field bg-white px-4 text-base text-ink transition-colors placeholder:text-muted hover:border-sand-300 focus:border-forest-600 aria-invalid:border-danger-700 disabled:cursor-not-allowed disabled:bg-sand-100";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldBase, "h-12", className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea className={cn(fieldBase, "min-h-36 py-3 leading-relaxed", className)} {...props} />
  );
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        className={cn(fieldBase, "h-12 cursor-pointer appearance-none pr-11", className)}
        {...props}
      >
        {children}
      </select>
      <ChevronDownIcon
        size={18}
        className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-subtle"
      />
    </div>
  );
}

export function Checkbox({
  className,
  label,
  id,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { label: ReactNode; id: string }) {
  return (
    <label
      htmlFor={id}
      className={cn("flex min-h-11 cursor-pointer items-center gap-3", className)}
    >
      <input
        id={id}
        type="checkbox"
        className="size-5 shrink-0 cursor-pointer rounded accent-forest-600"
        {...props}
      />
      <span className="text-md text-ink">{label}</span>
    </label>
  );
}

export function Label({
  className,
  required,
  optional,
  children,
  ...props
}: LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean; optional?: boolean }) {
  return (
    <label className={cn("mb-2 block text-md font-bold text-ink", className)} {...props}>
      {children}
      {required ? (
        <span className="text-danger-700" aria-hidden="true">
          {" "}
          *
        </span>
      ) : null}
      {optional ? <span className="font-normal text-subtle"> (optional)</span> : null}
    </label>
  );
}

export function FieldError({ id, children }: { id: string; children?: ReactNode }) {
  if (!children) return null;
  return (
    <p id={id} className="mt-2 flex items-start gap-1.5 text-sm font-semibold text-danger-700">
      <AlertCircleIcon size={16} className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

export function FieldHint({ id, children }: { id: string; children?: ReactNode }) {
  if (!children) return null;
  return (
    <p id={id} className="mt-2 text-sm text-muted">
      {children}
    </p>
  );
}

/** Builds the aria attributes that connect a control to its hint and error message. */
export function fieldA11y(id: string, opts: { error?: string | null; hint?: string | null } = {}) {
  const describedBy = [opts.hint ? `${id}-hint` : null, opts.error ? `${id}-error` : null]
    .filter(Boolean)
    .join(" ");
  return {
    id,
    "aria-invalid": opts.error ? (true as const) : undefined,
    "aria-describedby": describedBy || undefined,
  };
}

export interface FormFieldProps {
  id: string;
  label: ReactNode;
  required?: boolean;
  optional?: boolean;
  hint?: string | null;
  error?: string | null;
  className?: string;
  children: ReactNode;
}

/** Label + control + hint + error, wired together for screen readers via `fieldA11y`. */
export function FormField({
  id,
  label,
  required,
  optional,
  hint,
  error,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={className}>
      <Label htmlFor={id} required={required} optional={optional}>
        {label}
      </Label>
      {children}
      <FieldHint id={`${id}-hint`}>{hint}</FieldHint>
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </div>
  );
}
