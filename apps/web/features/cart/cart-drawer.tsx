"use client";

import { Drawer, formatPkr } from "@northnectar/ui";
import Image from "next/image";
import Link from "next/link";
import { cartContent } from "@/content/cart";
import type { NavLink } from "@/lib/routes";
import { CartLineItem } from "./cart-line-item";
import type { CartSuggestion } from "./cart-suggestion";
import { CartBagIcon } from "./cart-bag-icon";
import { FreeDeliveryProgress } from "./free-delivery-progress";
import { PaymentBadges } from "./payment-badges";
import { selectCount, selectSubtotal, useCartStore } from "./store";

const copy = cartContent.drawer;

/**
 * Slide-out cart (mockup values), mounted once in the root layout and opened from the header
 * cart button. Quick links and the "Pairs well" suggestion come from the server, so they follow
 * the catalogue.
 */
export function CartDrawer({
  quickLinks = [],
  suggestions = [],
}: {
  quickLinks?: NavLink[];
  suggestions?: CartSuggestion[];
}) {
  const isOpen = useCartStore((s) => s.isOpen);
  const close = useCartStore((s) => s.closeDrawer);
  const lines = useCartStore((s) => s.lines);
  const addItem = useCartStore((s) => s.addItem);
  const count = useCartStore(selectCount);
  const subtotal = useCartStore(selectSubtotal);
  const hasLines = lines.length > 0;
  const suggestion = suggestions.find((s) => !lines.some((l) => l.productId === s.productId));

  const footer = hasLines ? (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <span className="text-[16px] font-semibold">{copy.subtotal}</span>
        <span className="font-display text-[24px] font-bold uppercase">{formatPkr(subtotal)}</span>
      </div>
      <p className="m-0 text-[14px] text-[#6a665a]">{copy.note}</p>
      <Link
        href="/checkout"
        onClick={close}
        className="inline-flex h-14 items-center justify-center rounded-full bg-forest-600 font-display text-[18px] font-semibold tracking-[0.04em] text-white uppercase hover:bg-forest-700"
      >
        {copy.checkout}
      </Link>
      <Link
        href="/cart"
        onClick={close}
        className="inline-flex h-[50px] items-center justify-center rounded-full bg-[#efe7d6] text-[15px] font-bold text-ink hover:bg-[#e5dbc4]"
      >
        {copy.viewCart}
      </Link>
      <PaymentBadges />
    </div>
  ) : null;

  return (
    <Drawer
      open={isOpen}
      onClose={close}
      closeLabel="Close cart"
      className="max-w-[440px] bg-[#fbf8f1] leading-[normal] text-ink shadow-[-24px_0_50px_rgba(0,0,0,0.25)] open:backdrop:bg-[rgba(10,22,13,0.55)]"
      classNames={{
        header: "border-[#e8dfcc] px-[22px] py-5",
        title: "text-[24px] leading-[normal] text-[#0f2a1a]",
        close: "bg-[#f1ebde] hover:bg-[#e8dfcc]",
        body: hasLines ? "px-[22px] py-2" : "flex",
        footer: "border-[#e8dfcc] px-[22px] pt-[18px] pb-[22px]",
      }}
      title={
        <>
          {copy.title} <span className="text-[#8a836f]">({count})</span>
        </>
      }
      beforeBody={hasLines ? <FreeDeliveryProgress subtotal={subtotal} variant="bar" /> : null}
      footer={footer}
    >
      {hasLines ? (
        <>
          <ul className="m-0 list-none p-0" aria-label="Items in your cart">
            {lines.map((line) => (
              <CartLineItem key={line.variantId} line={line} onNavigate={close} />
            ))}
          </ul>
          {suggestion ? (
            <div className="mt-[18px] mb-[10px] flex items-center gap-3 rounded-[16px] border border-[#e8dfcc] bg-white p-[14px]">
              <span className="relative size-14 shrink-0 overflow-hidden rounded-[10px] bg-white">
                <Image
                  src={suggestion.image.src}
                  alt=""
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              </span>
              <span className="flex flex-1 flex-col leading-[1.3]">
                <span className="text-[14px] font-bold text-[#1f7a3f]">{copy.pairsWell}</span>
                <span className="text-[15px] font-semibold">
                  {suggestion.shortName} · {formatPkr(suggestion.price)}
                </span>
              </span>
              <button
                type="button"
                onClick={() =>
                  addItem({
                    productId: suggestion.productId,
                    variantId: suggestion.variantId,
                    slug: suggestion.slug,
                    name: suggestion.name,
                    variantLabel: suggestion.variantLabel,
                    unitPrice: suggestion.price,
                    image: suggestion.image,
                  })
                }
                className="relative inline-flex h-[38px] cursor-pointer items-center rounded-full border-0 bg-[#efe7d6] px-4 text-[14px] font-bold text-ink before:absolute before:inset-x-0 before:-inset-y-[3px] before:content-[''] hover:bg-[#e5dbc4]"
              >
                {copy.add}
                <span className="sr-only">
                  {" "}
                  {suggestion.name} {suggestion.variantLabel} to cart
                </span>
              </button>
            </div>
          ) : null}
        </>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-[14px] px-7 py-8 text-center">
          <span className="inline-flex size-24 items-center justify-center rounded-full bg-[#efe7d6] text-forest-600">
            <CartBagIcon size={42} strokeWidth={1.6} />
          </span>
          <p className="m-0 font-display text-[28px] font-bold text-[#0f2a1a] uppercase">
            {copy.emptyTitle}
          </p>
          <p className="m-0 text-[16px] leading-[1.5] text-[#4d4a40]">{copy.emptyText}</p>
          <Link
            href="/shop"
            onClick={close}
            className="mt-[6px] inline-flex h-[54px] items-center justify-center rounded-full bg-forest-600 px-[30px] font-display text-[18px] font-semibold tracking-[0.04em] text-white uppercase hover:bg-forest-700"
          >
            {copy.shop}
          </Link>
          {quickLinks.length > 0 ? (
            <ul
              aria-label="Popular products"
              className="m-0 flex list-none flex-wrap justify-center gap-2 p-0 pt-[10px]"
            >
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={close}
                    className="relative inline-block rounded-full border border-[#e3d8bf] bg-white px-[14px] py-2 text-[14px] font-semibold text-ink before:absolute before:inset-x-0 before:-inset-y-[6px] before:content-[''] hover:border-forest-600"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      )}
    </Drawer>
  );
}
