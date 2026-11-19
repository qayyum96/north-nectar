import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/cn";

export interface RadioCardProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "title"
> {
  id: string;
  title: ReactNode;
  description?: ReactNode;
  /** Right-hand text, e.g. a price or "Free". */
  aside?: ReactNode;
  /** Extra content shown under the option, e.g. bank details when selected. */
  children?: ReactNode;
}

/** Large selectable option used for delivery and payment methods. Native radio, styled. */
export function RadioCard({
  id,
  title,
  description,
  aside,
  children,
  className,
  disabled,
  ...props
}: RadioCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border-2 border-line-strong bg-white transition-colors has-checked:border-forest-600 has-checked:bg-mint-50",
        disabled && "opacity-60",
        className,
      )}
    >
      <label
        htmlFor={id}
        className={cn(
          "flex min-h-16 items-center gap-4 px-4 py-3.5",
          disabled ? "cursor-not-allowed" : "cursor-pointer",
        )}
      >
        <input
          id={id}
          type="radio"
          disabled={disabled}
          className="size-5 shrink-0 cursor-pointer accent-forest-600 disabled:cursor-not-allowed"
          {...props}
        />
        <span className="flex-1">
          <span className="block text-base font-bold text-ink">{title}</span>
          {description ? <span className="block text-sm text-subtle">{description}</span> : null}
        </span>
        {aside ? <span className="text-md font-bold text-ink">{aside}</span> : null}
      </label>
      {children}
    </div>
  );
}
