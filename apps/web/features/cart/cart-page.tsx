"use client";

import type { CartLine } from "@northnectar/types";
import { cn, formatPkr } from "@northnectar/ui";
import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";
import { FloatingLeaf } from "@/components/decor/floating-leaf";
import { cartContent } from "@/content/cart";
import { findDiscountCode } from "@/lib/constants/commerce";
import { images } from "@/lib/images";
import { productPath } from "@/lib/routes";
import { siteConfig } from "@/lib/seo/config";
import { CartBagIcon } from "./cart-bag-icon";
import { CartStepper } from "./cart-stepper";
import { FreeDeliveryProgress } from "./free-delivery-progress";
import { PaymentBadges } from "./payment-badges";
import { useCartStore } from "./store";
import { useCartTotals } from "./use-cart-totals";

const copy = cartContent.page;

/** "3 items · Guest checkout, no account needed", shown under the page title once the cart loads. */
export function CartSubtitle() {
  const hasHydrated = useCartStore((s) => s.hasHydrated);
  const { count } = useCartTotals();
  if (!hasHydrated || count === 0) return null;
  return <p className="m-0 text-[16px] leading-[1.5] text-[#4d4a40]">{copy.subtitle(count)}</p>;
}

/**
 * The /cart page body (mockup values: mobile base, `md:` desktop). The cart lives in the browser,
 * so this renders after the persisted cart is restored; `popular` (server-rendered product cards)
 * is shown under the empty state.
 */
export function CartPageContent({ popular }: { popular: ReactNode }) {
  const hasHydrated = useCartStore((s) => s.hasHydrated);
  const lines = useCartStore((s) => s.lines);
  const notice = useCartStore((s) => s.notice);
  const dismissNotice = useCartStore((s) => s.dismissNotice);
  const totals = useCartTotals();

  if (!hasHydrated) {
    // Reserve space while the saved cart loads (one frame on most devices).
    return <div aria-busy="true" className="min-h-[60vh]" />;
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto flex max-w-[1320px] flex-col gap-14">
        <div
          data-rv="fade"
          className="relative flex flex-col items-center gap-4 overflow-hidden rounded-[28px] border border-[#e8dfcc] bg-white px-[22px] py-11 text-center md:px-10 md:py-[72px]"
        >
          <FloatingLeaf
            image={images.decor.leaf3}
            rotate={-24}
            duration={3.4}
            width={150}
            className="top-5 right-[6%] w-[150px]"
            imageClassName="drop-shadow-none"
          />
          <FloatingLeaf
            image={images.decor.leaf1}
            rotate={150}
            duration={4.1}
            delay={-0.5}
            width={60}
            className="bottom-6 left-[7%] w-[60px]"
            imageClassName="drop-shadow-none"
          />
          <span className="relative inline-flex size-28 items-center justify-center rounded-full bg-[#efe7d6] text-forest-600">
            <CartBagIcon size={48} strokeWidth={1.5} />
          </span>
          <h2 className="relative m-0 font-display text-[34px] leading-none font-bold text-[#0f2a1a] uppercase md:text-[52px]">
            {copy.empty.title}
          </h2>
          <p className="relative m-0 max-w-[460px] text-[17px] leading-[1.6] text-[#4d4a40]">
            {copy.empty.text}
          </p>
          <div className="relative flex flex-wrap justify-center gap-3 pt-[6px]">
            <Link
              href="/shop"
              className="inline-flex h-[58px] items-center rounded-full bg-forest-600 px-8 font-display text-[18px] font-semibold tracking-[0.04em] text-white uppercase hover:bg-forest-700"
            >
              {copy.empty.shop}
            </Link>
            <Link
              href="/"
              className="inline-flex h-[58px] items-center rounded-full bg-[#efe7d6] px-7 text-[16px] font-bold text-ink hover:bg-[#e5dbc4]"
            >
              {copy.empty.home}
            </Link>
          </div>
        </div>
        {popular}
      </div>
    );
  }

  const whatsappText = encodeURIComponent(
    [
      "Hello North Nectar, I would like to order:",
      ...lines.map((l) => `${l.quantity} x ${l.name} (${l.variantLabel})`),
      `Total: ${formatPkr(totals.total)}`,
    ].join("\n"),
  );

  return (
    <div className="mx-auto flex max-w-[1320px] flex-wrap items-start gap-7">
      <div className="flex min-w-0 flex-[1.7_1_560px] flex-col gap-4">
        {notice ? (
          <div
            role="status"
            className="flex items-start justify-between gap-3 rounded-[14px] border border-[#f2d7a8] bg-[#fff6e8] px-4 py-3 text-[15px] text-[#6b3f10]"
          >
            <span>{notice}</span>
            <button
              type="button"
              onClick={dismissNotice}
              className="shrink-0 cursor-pointer font-bold underline"
            >
              Dismiss
            </button>
          </div>
        ) : null}
        <FreeDeliveryProgress subtotal={totals.subtotal - totals.discount} />
        <div className="overflow-hidden rounded-[20px] border border-[#e8dfcc] bg-white">
          <div
            aria-hidden="true"
            className="hidden grid-cols-[1fr_130px_150px_120px_44px] gap-3 border-b border-[#ece4d3] bg-[#faf6ec] px-[22px] py-[14px] text-[14px] leading-[21px] font-bold tracking-[0.06em] text-[#6a665a] uppercase md:grid"
          >
            <span>{copy.columns.product}</span>
            <span>{copy.columns.price}</span>
            <span>{copy.columns.quantity}</span>
            <span className="text-right">{copy.columns.total}</span>
            <span />
          </div>
          <ul className="m-0 list-none p-0" aria-label="Items in your cart">
            {lines.map((line) => (
              <CartRow key={line.variantId} line={line} />
            ))}
          </ul>
        </div>
        <Link
          href="/shop"
          className="self-start text-[15px] leading-[1.5] font-bold text-[#1f6b3a] hover:underline"
        >
          {copy.continueShopping}
        </Link>
      </div>

      <aside
        aria-labelledby="cart-summary-title"
        className="flex min-w-0 flex-[1_1_340px] flex-col gap-4 rounded-[22px] border border-[#e8dfcc] bg-white p-[26px] md:sticky md:top-[150px]"
      >
        <h2
          id="cart-summary-title"
          className="m-0 font-display text-[26px] leading-[1.5] font-bold text-[#0f2a1a] uppercase"
        >
          {copy.summary.title}
        </h2>
        <SummaryRow label={copy.summary.subtotal} value={formatPkr(totals.subtotal)} />
        {totals.discount > 0 ? (
          <SummaryRow label={copy.summary.discount} value={`−${formatPkr(totals.discount)}`} />
        ) : null}
        <SummaryRow
          label={copy.summary.delivery}
          value={totals.delivery === 0 ? copy.summary.free : formatPkr(totals.delivery)}
        />
        <DiscountForm />
        <div className="flex items-baseline justify-between border-t border-[#ece4d3] pt-[14px]">
          <span className="text-[17px] font-bold">{copy.summary.total}</span>
          <span className="font-display text-[32px] leading-[1.5] font-bold uppercase">
            {formatPkr(totals.total)}
          </span>
        </div>
        <Link
          href="/checkout"
          className="inline-flex h-[58px] items-center justify-center rounded-full bg-forest-600 font-display text-[19px] font-semibold tracking-[0.04em] text-white uppercase hover:bg-forest-700"
        >
          {copy.summary.checkout}
        </Link>
        <a
          href={`${siteConfig.contact.whatsappUrl}?text=${whatsappText}`}
          className="relative self-center text-[15px] leading-[1.5] font-bold text-[#1f6b3a] before:absolute before:inset-x-0 before:-inset-y-[10px] before:content-[''] hover:underline"
        >
          {copy.summary.whatsapp}
        </a>
        <PaymentBadges />
      </aside>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-[16px] leading-[1.5]">
      <span>{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}

function CartRow({ line }: { line: CartLine }) {
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const itemName = `${line.name} ${line.variantLabel}`;
  const href = productPath(line.slug, line.variantLabel);

  return (
    <li className="grid grid-cols-[1fr_auto_auto] items-center gap-x-[14px] gap-y-3 border-b border-[#f0e9da] px-[22px] py-[18px] md:grid-cols-[1fr_130px_150px_120px_44px]">
      <div className="col-span-full flex min-w-0 items-center gap-[14px] md:col-span-1">
        <span className="relative size-[74px] shrink-0 overflow-hidden rounded-[12px] border border-[#ece4d3] bg-white md:size-[86px]">
          <Image src={line.image.src} alt="" fill sizes="86px" className="object-contain" />
        </span>
        <span className="flex min-w-0 flex-col gap-1">
          <Link
            href={href}
            className="text-[16px] leading-[1.3] font-bold text-ink hover:underline"
          >
            {line.name}
          </Link>
          <span className="text-[14px] leading-[1.5] text-[#6a665a]">Size {line.variantLabel}</span>
        </span>
      </div>
      <span className="hidden text-[15px] leading-[1.5] text-[#3f4a40] md:inline">
        {formatPkr(line.unitPrice)}
      </span>
      <CartStepper
        value={line.quantity}
        onChange={(q) => setQuantity(line.variantId, q)}
        itemName={itemName}
      />
      <span className="text-right text-[16px] leading-[1.5] font-bold">
        {formatPkr(line.unitPrice * line.quantity)}
      </span>
      <button
        type="button"
        aria-label={`Remove ${itemName}`}
        onClick={() => removeItem(line.variantId)}
        className="relative inline-flex size-10 cursor-pointer items-center justify-center rounded-full border-0 bg-[#f6efe2] text-[#8a4513] before:absolute before:-inset-[2px] before:content-[''] hover:bg-[#efe3cc]"
      >
        <svg
          aria-hidden="true"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
        </svg>
      </button>
    </li>
  );
}

/** Discount code entry. Codes are checked against the config (none exist yet). */
function DiscountForm() {
  const code = useCartStore((s) => s.discountCode);
  const setDiscountCode = useCartStore((s) => s.setDiscountCode);
  const [value, setValue] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const applied = findDiscountCode(code);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const match = findDiscountCode(value);
    if (match) {
      setDiscountCode(match.code);
      setValue("");
      setMessage({ ok: true, text: copy.summary.appliedCode(match.code) });
    } else {
      setMessage({ ok: false, text: copy.summary.invalidCode });
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-[6px]">
      <label htmlFor="discount-code" className="text-[14px] leading-[1.5] font-bold">
        {copy.summary.codeLabel}
      </label>
      <div className="flex gap-2">
        <input
          id="discount-code"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={copy.summary.codePlaceholder}
          autoComplete="off"
          aria-describedby={message ? "discount-code-msg" : undefined}
          className="h-12 min-w-0 flex-1 rounded-[10px] border border-[#ddd3bf] bg-white px-[14px] text-[15px] placeholder:text-[#8a836f]"
        />
        <button
          type="submit"
          className="h-[46px] cursor-pointer rounded-[10px] border-0 bg-[#efe7d6] px-[18px] text-[15px] font-bold text-ink hover:bg-[#e5dbc4]"
        >
          {copy.summary.apply}
        </button>
      </div>
      {applied ? (
        <p className="m-0 flex items-center justify-between text-[14px] text-[#1f6b3a]">
          {copy.summary.appliedCode(applied.code)}
          <button
            type="button"
            onClick={() => {
              setDiscountCode(null);
              setMessage(null);
            }}
            className="cursor-pointer font-bold underline"
          >
            {copy.summary.remove}
          </button>
        </p>
      ) : message ? (
        <p
          id="discount-code-msg"
          role="status"
          className={cn("m-0 text-[14px]", message.ok ? "text-[#1f6b3a]" : "text-[#8a4513]")}
        >
          {message.text}
        </p>
      ) : null}
    </form>
  );
}
