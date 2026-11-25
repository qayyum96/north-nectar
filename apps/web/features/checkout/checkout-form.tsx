"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { CartLine } from "@northnectar/types";
import { AlertCircleIcon, ChevronDownIcon, cn, formatPkr } from "@northnectar/ui";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition, type ReactNode } from "react";
import { useForm, useWatch, type UseFormRegisterReturn } from "react-hook-form";
import { CITIES, PROVINCES, checkoutContent } from "@/content/checkout";
import { CartBagIcon } from "@/features/cart/cart-bag-icon";
import { useCartStore } from "@/features/cart/store";
import { useCartTotals } from "@/features/cart/use-cart-totals";
import { useDeliveryLocation } from "@/features/delivery/location-store";
import {
  deliveryOptions,
  enabledWallets,
  paymentMethodsFor,
} from "@northnectar/data/commerce-settings";
import { useCommerceSettings, useReplaceCommerceSettings } from "@/features/cart/commerce-settings";
import { placeOrder } from "./actions";
import { LockIcon } from "./lock-icon";
import {
  checkoutDefaults,
  checkoutSchema,
  type CheckoutField,
  type CheckoutInput,
  type CheckoutValues,
} from "./schema";

const copy = checkoutContent;

const inputClass =
  "w-full rounded-[12px] border-[1.5px] bg-white px-4 text-[16px] text-ink placeholder:text-[#736c5a]";
const border = (invalid: boolean) => (invalid ? "border-[#b42318]" : "border-[#ddd3bf]");

/**
 * Guest checkout (mockup values: mobile base, `md:` desktop). Validates in the browser with the
 * same Zod schema the Server Action uses; the action re-prices the cart and creates the order.
 */
export function CheckoutForm() {
  const router = useRouter();
  const hasHydrated = useCartStore((s) => s.hasHydrated);
  const lines = useCartStore((s) => s.lines);
  const discountCode = useCartStore((s) => s.discountCode);
  const clear = useCartStore((s) => s.clear);
  const syncWithCatalog = useCartStore((s) => s.syncWithCatalog);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [placed, setPlaced] = useState(false);
  const [pending, startTransition] = useTransition();
  // Payment methods, wallets and delivery rates come from the admin (Settings).
  const settings = useCommerceSettings();
  const replaceSettings = useReplaceCommerceSettings();
  const visiblePayments = paymentMethodsFor(settings);
  const wallets = enabledWallets(settings);

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitted },
  } = useForm<CheckoutInput, unknown, CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      ...checkoutDefaults,
      paymentMethodId: visiblePayments[0]?.id ?? checkoutDefaults.paymentMethodId,
      walletProvider: wallets[0]?.id ?? checkoutDefaults.walletProvider,
    },
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const [deliveryId, paymentId, walletId, city, cityOther, province] = useWatch({
    control,
    name: [
      "deliveryMethodId",
      "paymentMethodId",
      "walletProvider",
      "city",
      "cityOther",
      "province",
    ],
  });
  const address = { city: city === "Other" ? cityOther : city, province };

  // Remember the delivery city, so the top bar and cart show its free-delivery amount next time.
  const chooseCity = useDeliveryLocation((s) => s.choose);
  const chosenCity = address.city?.trim() ?? "";
  useEffect(() => {
    if (chosenCity) chooseCity(chosenCity, province || null);
  }, [chosenCity, province, chooseCity]);
  const totals = useCartTotals(deliveryId, paymentId, address);
  const delivery = deliveryOptions(settings, {
    ...address,
    amount: totals.subtotal - totals.discount,
  });
  const walletLabel =
    wallets.find((w) => w.id === walletId)?.label ?? wallets[0]?.label ?? "JazzCash";

  const err = (field: CheckoutField) => errors[field]?.message;
  const errorCount = Object.keys(errors).length;

  if (!hasHydrated || placed) {
    return <div aria-busy="true" className="min-h-[60vh]" />;
  }

  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-[22px] border border-[#e8dfcc] bg-white px-6 py-14 text-center">
        <span className="inline-flex size-24 items-center justify-center rounded-full bg-[#efe7d6] text-forest-600">
          <CartBagIcon size={42} />
        </span>
        <h2 className="m-0 font-display text-[28px] font-bold text-[#0f2a1a] uppercase">
          {copy.empty.title}
        </h2>
        <p className="m-0 text-[16px] text-[#4d4a40]">{copy.empty.text}</p>
        <Link
          href="/shop"
          className="inline-flex h-[54px] items-center rounded-full bg-forest-600 px-[30px] font-display text-[18px] font-semibold tracking-[0.04em] text-white uppercase hover:bg-forest-700"
        >
          {copy.empty.shop}
        </Link>
      </div>
    );
  }

  const onValid = (values: CheckoutValues) => {
    setFormError(null);
    startTransition(async () => {
      try {
        const result = await placeOrder(
          values as CheckoutInput,
          lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })),
          discountCode,
          totals.total,
        );
        if (result.ok) {
          setPlaced(true);
          clear();
          router.replace("/order-confirmation");
          return;
        }
        if (result.kind === "validation") {
          for (const [field, message] of Object.entries(result.fieldErrors)) {
            setError(field as CheckoutField, { type: "server", message });
          }
        } else if (result.kind === "cart") {
          syncWithCatalog(result.catalog);
          // Delivery rates or payment methods may have changed in the admin since the page loaded.
          replaceSettings(result.settings);
          setFormError(result.message);
        } else {
          setFormError(result.message);
        }
      } catch {
        setFormError(copy.errors.generic);
      }
    });
  };

  const summary = (
    <aside
      aria-labelledby="checkout-summary-title"
      className={cn(
        "min-w-0 flex-[1_1_360px] flex-col gap-4 rounded-[22px] border border-[#e3d8bf] bg-[#f3eee2] p-[26px] md:sticky md:top-6 md:flex",
        summaryOpen ? "flex" : "hidden",
      )}
    >
      <h2
        id="checkout-summary-title"
        className="m-0 font-display text-[24px] leading-[1.5] font-bold text-[#0f2a1a] uppercase"
      >
        {copy.summary.title}
      </h2>
      <ul className="m-0 flex list-none flex-col gap-4 p-0">
        {lines.map((line) => (
          <SummaryLine key={line.variantId} line={line} />
        ))}
      </ul>
      <div className="flex flex-col gap-[10px] border-t border-[#ddd2ba] pt-[14px] text-[16px] leading-[1.5]">
        <Row label={copy.summary.subtotal} value={formatPkr(totals.subtotal)} />
        {totals.discount > 0 ? (
          <Row label={copy.summary.discount} value={`−${formatPkr(totals.discount)}`} />
        ) : null}
        <Row
          label={copy.summary.delivery(delivery.find((m) => m.id === deliveryId)?.shortLabel ?? "")}
          value={totals.delivery === 0 ? copy.summary.free : formatPkr(totals.delivery)}
        />
        {paymentId === "cod" ? (
          <Row
            label={copy.summary.cod}
            value={totals.paymentFee === 0 ? copy.summary.free : formatPkr(totals.paymentFee)}
          />
        ) : null}
      </div>
      <div className="flex items-baseline justify-between border-t border-[#ddd2ba] pt-[14px]">
        <span className="text-[17px] leading-[1.5] font-bold">{copy.summary.total}</span>
        <span className="font-display text-[32px] leading-[1.5] font-bold uppercase">
          {formatPkr(totals.total)}
        </span>
      </div>
      <p className="m-0 inline-flex items-center gap-2 text-[14px] leading-[1.5] text-[#4d4a40]">
        <LockIcon size={16} />
        {copy.summary.secure}
      </p>
    </aside>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setSummaryOpen((o) => !o)}
        aria-expanded={summaryOpen}
        className="flex h-14 cursor-pointer items-center justify-between rounded-[14px] border border-[#e3d8bf] bg-[#f3eee2] px-[18px] text-[15px] font-bold text-[#1f4a2f] md:hidden"
      >
        <span>{summaryOpen ? copy.summaryToggle.hide : copy.summaryToggle.show}</span>
        <span className="font-display text-[20px] text-[#0f2a1a] uppercase">
          {formatPkr(totals.total)}
        </span>
      </button>

      {formError ? (
        <Alert>
          <strong>{formError}</strong>
        </Alert>
      ) : isSubmitted && errorCount > 0 ? (
        <Alert>
          <strong>{copy.errorSummary.strong}</strong>
          {copy.errorSummary.rest(errorCount)}
        </Alert>
      ) : null}

      <div className="flex flex-wrap items-start gap-7">
        <form
          onSubmit={(event) => void handleSubmit(onValid)(event)}
          noValidate
          aria-label="Checkout details"
          className="order-2 flex min-w-0 flex-[1.6_1_560px] flex-col gap-[18px] md:order-none"
        >
          <StepCard n={1} title={copy.contact.title}>
            <p className="m-0 text-[15px] leading-[1.5] text-[#4d4a40]">{copy.contact.note}</p>
            <div className="grid gap-4 md:grid-cols-2">
              <Field id="co-email" label={copy.contact.email} error={err("email")}>
                <input
                  id="co-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  {...aria("co-email", err("email"))}
                  className={cn(inputClass, "h-[52px]", border(Boolean(err("email"))))}
                  {...register("email")}
                />
              </Field>
              <Field id="co-phone" label={copy.contact.phone} error={err("phone")}>
                <input
                  id="co-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel-national"
                  placeholder="03XX XXXXXXX"
                  {...aria("co-phone", err("phone"))}
                  className={cn(inputClass, "h-[52px]", border(Boolean(err("phone"))))}
                  {...register("phone")}
                />
              </Field>
            </div>
            <label className="inline-flex cursor-pointer items-center gap-[10px] text-[15px] leading-[1.5]">
              <input
                type="checkbox"
                className="my-[3px] mr-[3px] ml-1 size-5 accent-forest-600"
                {...register("whatsappUpdates")}
              />
              {copy.contact.whatsapp}
            </label>
          </StepCard>

          <StepCard n={2} title={copy.address.title}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field id="co-name" label={copy.address.fullName} error={err("fullName")} wide>
                <input
                  id="co-name"
                  type="text"
                  autoComplete="name"
                  {...aria("co-name", err("fullName"))}
                  className={cn(inputClass, "h-[52px]", border(Boolean(err("fullName"))))}
                  {...register("fullName")}
                />
              </Field>
              <Field id="co-street" label={copy.address.street} error={err("street")} wide>
                <input
                  id="co-street"
                  type="text"
                  autoComplete="address-line1"
                  placeholder={copy.address.streetPlaceholder}
                  {...aria("co-street", err("street"))}
                  className={cn(inputClass, "h-[52px]", border(Boolean(err("street"))))}
                  {...register("street")}
                />
              </Field>
              <Field
                id="co-landmark"
                label={copy.address.landmark}
                optional
                error={err("landmark")}
                wide
              >
                <input
                  id="co-landmark"
                  type="text"
                  autoComplete="address-line2"
                  placeholder={copy.address.landmarkPlaceholder}
                  {...aria("co-landmark", err("landmark"))}
                  className={cn(inputClass, "h-[52px]", border(Boolean(err("landmark"))))}
                  {...register("landmark")}
                />
              </Field>
              <Field id="co-city" label={copy.address.city} error={err("city")}>
                <Select
                  id="co-city"
                  invalid={Boolean(err("city"))}
                  registration={register("city")}
                  options={CITIES}
                  placeholder={copy.address.select}
                  autoComplete="address-level2"
                />
              </Field>
              <Field id="co-province" label={copy.address.province} error={err("province")}>
                <Select
                  id="co-province"
                  invalid={Boolean(err("province"))}
                  registration={register("province")}
                  options={PROVINCES}
                  placeholder={copy.address.select}
                  autoComplete="address-level1"
                />
              </Field>
              {city === "Other" ? (
                <Field id="co-city-other" label={copy.address.cityOther} error={err("cityOther")}>
                  <input
                    id="co-city-other"
                    type="text"
                    autoComplete="address-level2"
                    {...aria("co-city-other", err("cityOther"))}
                    className={cn(inputClass, "h-[52px]", border(Boolean(err("cityOther"))))}
                    {...register("cityOther")}
                  />
                </Field>
              ) : null}
              <Field
                id="co-postal"
                label={copy.address.postalCode}
                optional
                error={err("postalCode")}
              >
                <input
                  id="co-postal"
                  type="text"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  placeholder="44000"
                  {...aria("co-postal", err("postalCode"))}
                  className={cn(inputClass, "h-[52px]", border(Boolean(err("postalCode"))))}
                  {...register("postalCode")}
                />
              </Field>
            </div>
          </StepCard>

          <StepCard n={3} title={copy.delivery.title}>
            <div
              role="radiogroup"
              aria-label={copy.delivery.title}
              className="flex flex-col gap-[10px]"
            >
              {delivery.map((method) => {
                const fee = method.fee;
                return (
                  <RadioCard
                    key={method.id}
                    registration={register("deliveryMethodId")}
                    value={method.id}
                    title={method.label}
                    description={method.description}
                    right={fee === 0 ? copy.delivery.free : formatPkr(fee)}
                  />
                );
              })}
            </div>
          </StepCard>

          <StepCard n={4} title={copy.payment.title}>
            <div
              role="radiogroup"
              aria-label={copy.payment.title}
              className="flex flex-col gap-[10px]"
            >
              {visiblePayments.map((method) => {
                const disabled = method.status !== "enabled";
                const right = disabled
                  ? copy.payment.comingSoon
                  : method.fee > 0
                    ? `+${formatPkr(method.fee)}`
                    : method.id === "cod"
                      ? copy.payment.free
                      : "";
                return (
                  <RadioCard
                    key={method.id}
                    registration={register("paymentMethodId")}
                    value={method.id}
                    title={method.label}
                    description={method.description}
                    right={right}
                    disabled={disabled}
                  >
                    {method.id === "bank_transfer" && paymentId === "bank_transfer" ? (
                      <p className="m-0 pr-4 pb-4 pl-[52px] text-[15px] leading-[1.6] text-[#3f4a40]">
                        {copy.payment.bankDetails(settings.payments.bank_transfer)}
                      </p>
                    ) : null}
                    {method.id === "mobile_wallet" && paymentId === "mobile_wallet" ? (
                      <div className="flex flex-col gap-[10px] pr-4 pb-4 pl-[52px]">
                        <div role="radiogroup" aria-label="Wallet" className="flex gap-2">
                          {wallets.map((w) => (
                            <label key={w.id} className="relative cursor-pointer">
                              <input
                                type="radio"
                                value={w.id}
                                className="peer sr-only"
                                {...register("walletProvider")}
                              />
                              <span className="inline-flex h-10 items-center rounded-full border-[1.5px] border-[#ddd3bf] bg-white px-4 text-[14px] font-bold text-ink peer-checked:border-forest-600 peer-checked:bg-forest-600 peer-checked:text-white peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-forest-600">
                                {w.label}
                              </span>
                            </label>
                          ))}
                        </div>
                        <label htmlFor="co-wallet" className="text-[14px] leading-[1.5] font-bold">
                          {copy.payment.walletNumber(walletLabel)}
                        </label>
                        <input
                          id="co-wallet"
                          type="tel"
                          inputMode="tel"
                          placeholder="03XX XXXXXXX"
                          {...aria("co-wallet", err("walletNumber"))}
                          className={cn(
                            "h-[50px] w-full rounded-[10px] border-[1.5px] bg-white px-[14px] text-[16px] placeholder:text-[#736c5a]",
                            border(Boolean(err("walletNumber"))),
                          )}
                          {...register("walletNumber")}
                        />
                        {err("walletNumber") ? (
                          <p
                            id="co-wallet-error"
                            className="m-0 text-[14px] font-semibold text-[#b42318]"
                          >
                            {err("walletNumber")}
                          </p>
                        ) : null}
                        <p className="m-0 text-[14px] leading-[1.5] text-[#6a665a]">
                          {copy.payment.walletNote(walletLabel)}
                        </p>
                      </div>
                    ) : null}
                  </RadioCard>
                );
              })}
            </div>
          </StepCard>

          <button
            type="submit"
            disabled={pending}
            className="h-[62px] cursor-pointer rounded-full border-0 bg-forest-600 font-display text-[20px] font-semibold tracking-[0.04em] text-white uppercase hover:bg-forest-700 disabled:cursor-wait disabled:opacity-70"
          >
            {pending ? copy.placing : copy.placeOrder(totals.total)}
          </button>
          <p className="m-0 text-center text-[14px] leading-[1.5] text-[#6a665a]">
            {copy.agreement.before}
            <Link href="/terms-and-conditions" className="underline hover:text-ink">
              {copy.agreement.terms}
            </Link>
            {copy.agreement.middle}
            <Link href="/refund-policy" className="underline hover:text-ink">
              {copy.agreement.refund}
            </Link>
            {copy.agreement.after}
          </p>
        </form>
        {summary}
      </div>
    </>
  );
}

const aria = (id: string, error: string | undefined) => ({
  "aria-invalid": Boolean(error),
  "aria-describedby": error ? `${id}-error` : undefined,
});

function Alert({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-[14px] border border-[#f5c2bc] bg-[#fdecea] px-[18px] py-4 text-[#8f1d14]"
    >
      <AlertCircleIcon size={20} strokeWidth={2.2} className="mt-[2px] shrink-0" />
      <p className="m-0 text-[15px] leading-[1.5]">{children}</p>
    </div>
  );
}

function StepCard({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <fieldset className="m-0 flex min-w-0 flex-col gap-[18px] rounded-[22px] border border-[#e8dfcc] bg-white px-[18px] py-5 md:p-7">
      <legend className="sr-only">{title}</legend>
      <div aria-hidden="true" className="flex items-center gap-3">
        <span className="inline-flex size-[34px] items-center justify-center rounded-full bg-forest-600 font-display text-[17px] font-semibold text-white uppercase">
          {n}
        </span>
        <span className="font-display text-[24px] leading-[1.5] font-bold text-[#0f2a1a] uppercase">
          {title}
        </span>
      </div>
      {children}
    </fieldset>
  );
}

function Field({
  id,
  label,
  optional,
  error,
  wide,
  children,
}: {
  id: string;
  label: string;
  optional?: boolean;
  error?: string;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-[7px]", wide && "md:col-span-2")}>
      <label htmlFor={id} className="text-[15px] leading-[1.5] font-bold">
        {label}
        {optional ? <span className="font-medium text-[#6a665a]"> (optional)</span> : null}
      </label>
      {children}
      {error ? (
        <p
          id={`${id}-error`}
          className="m-0 text-[14px] leading-[1.5] font-semibold text-[#b42318]"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

function Select({
  id,
  invalid,
  registration,
  options,
  placeholder,
  autoComplete,
}: {
  id: string;
  invalid: boolean;
  registration: UseFormRegisterReturn;
  options: readonly string[];
  placeholder: string;
  autoComplete: string;
}) {
  return (
    <div className="relative">
      <select
        id={id}
        autoComplete={autoComplete}
        aria-invalid={invalid}
        aria-describedby={invalid ? `${id}-error` : undefined}
        className={cn(inputClass, "h-[52px] cursor-pointer appearance-none pr-10", border(invalid))}
        {...registration}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <ChevronDownIcon
        size={18}
        strokeWidth={2}
        className="pointer-events-none absolute top-[17px] right-[14px] text-[#5e5a4e]"
      />
    </div>
  );
}

/** Selectable card with a native radio input (keyboard arrows work), styled as in the mockup. */
function RadioCard({
  registration,
  value,
  title,
  description,
  right,
  disabled,
  children,
}: {
  registration: UseFormRegisterReturn;
  value: string;
  title: string;
  description: string;
  right: string;
  disabled?: boolean;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "group overflow-hidden rounded-[14px] border-2 border-[#e3d8bf] bg-white has-checked:border-forest-600 has-checked:bg-[#f3f8f0] has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-forest-600",
        disabled && "opacity-60",
      )}
    >
      <label
        className={cn(
          "flex items-center gap-[14px] p-4",
          disabled ? "cursor-not-allowed" : "cursor-pointer",
        )}
      >
        <input
          type="radio"
          value={value}
          disabled={disabled}
          className="peer sr-only"
          {...registration}
        />
        <span className="inline-flex size-[26px] shrink-0 items-center justify-center rounded-full border-2 border-[#bfb397] peer-checked:border-forest-600 peer-checked:[&>span]:bg-forest-600">
          <span className="size-[10px] rounded-full" />
        </span>
        <span className="flex flex-1 flex-col gap-[2px]">
          <span className="text-[16px] leading-[1.5] font-bold text-ink">{title}</span>
          <span className="text-[14px] leading-[1.5] text-[#6a665a]">{description}</span>
        </span>
        <span className="text-[15px] leading-[1.5] font-bold whitespace-nowrap text-ink">
          {right}
        </span>
      </label>
      {children}
    </div>
  );
}

function SummaryLine({ line }: { line: CartLine }) {
  return (
    <li className="flex items-center gap-[14px]">
      <span className="relative block h-[73px] w-[66px] shrink-0">
        <span className="relative block size-[66px] overflow-hidden rounded-[12px] border border-[#e3d8bf] bg-white">
          <Image src={line.image.src} alt="" fill sizes="64px" className="object-contain" />
        </span>
        <span className="absolute -top-2 -right-2 h-[22px] min-w-[22px] rounded-full bg-forest-600 px-[6px] text-center text-[14px] leading-[22px] font-bold text-white">
          <span className="sr-only">Quantity </span>
          {line.quantity}
        </span>
      </span>
      <span className="flex flex-1 flex-col leading-[1.3]">
        <span className="text-[15px] font-bold">{line.name}</span>
        <span className="text-[14px] text-[#6a665a]">{line.variantLabel}</span>
      </span>
      <span className="text-[15px] leading-[1.5] font-bold">
        {formatPkr(line.unitPrice * line.quantity)}
      </span>
    </li>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}
