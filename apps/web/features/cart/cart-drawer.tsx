"use client";

import { BagIcon, Drawer, buttonVariants, chipVariants, formatPkr } from "@northnectar/ui";
import Link from "next/link";
import { paymentBadges } from "@/lib/constants/commerce";
import { CartLineItem } from "./cart-line-item";
import { FreeDeliveryProgress } from "./free-delivery-progress";
import { selectCount, selectSubtotal, useCartStore } from "./store";

export interface QuickLink {
  label: string;
  href: string;
}

/**
 * Slide-out cart, mounted once in the root layout and opened from the header cart button.
 * `quickLinks` (shown when the cart is empty) come from the server so they follow the catalog.
 */
export function CartDrawer({ quickLinks = [] }: { quickLinks?: QuickLink[] }) {
  const isOpen = useCartStore((s) => s.isOpen);
  const close = useCartStore((s) => s.closeDrawer);
  const lines = useCartStore((s) => s.lines);
  const count = useCartStore(selectCount);
  const subtotal = useCartStore(selectSubtotal);

  const footer =
    lines.length > 0 ? (
      <div className="space-y-4">
        <div className="flex items-baseline justify-between">
          <span className="text-lg font-bold text-ink">Subtotal</span>
          <span className="font-display text-display-sm font-bold text-forest-900 tabular-nums">
            {formatPkr(subtotal)}
          </span>
        </div>
        <p className="text-sm text-subtle">
          Delivery calculated at checkout. Cash on delivery available.
        </p>
        <div className="grid gap-3">
          <Link
            href="/checkout"
            onClick={close}
            className={buttonVariants({ size: "lg", display: true, fullWidth: true })}
          >
            Checkout
          </Link>
          <Link
            href="/cart"
            onClick={close}
            className={buttonVariants({ variant: "secondary", size: "md", fullWidth: true })}
          >
            View cart
          </Link>
        </div>
        <ul className="hidden flex-wrap justify-center gap-2 sm:flex" aria-label="Payment options">
          {paymentBadges().map((badge) => (
            <li
              key={badge}
              className="rounded-md border border-line-strong bg-white px-2.5 py-1 text-sm text-subtle"
            >
              {badge}
            </li>
          ))}
        </ul>
      </div>
    ) : null;

  return (
    <Drawer
      open={isOpen}
      onClose={close}
      closeLabel="Close cart"
      title={
        <>
          Your cart <span className="text-subtle">({count})</span>
        </>
      }
      footer={footer}
    >
      {lines.length > 0 ? (
        <>
          <FreeDeliveryProgress
            subtotal={subtotal}
            className="rounded-none border-x-0 border-t-0"
          />
          <ul className="divide-y divide-line px-5" aria-label="Items in your cart">
            {lines.map((line) => (
              <CartLineItem key={line.variantId} line={line} onNavigate={close} />
            ))}
          </ul>
        </>
      ) : (
        <div className="flex flex-col items-center px-6 py-14 text-center">
          <span className="grid size-24 place-items-center rounded-full bg-sand-200 text-forest-700">
            <BagIcon size={36} />
          </span>
          <p className="mt-6 font-display text-display-sm font-bold text-forest-900 uppercase">
            Your cart is empty
          </p>
          <p className="mt-2 max-w-xs text-md text-subtle">
            Pure goodness from Gilgit-Baltistan is one tap away.
          </p>
          <Link
            href="/shop"
            onClick={close}
            className={buttonVariants({ size: "lg", display: true, className: "mt-6" })}
          >
            Shop the harvest
          </Link>
          {quickLinks.length > 0 ? (
            <ul className="mt-6 flex flex-wrap justify-center gap-2" aria-label="Popular products">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} onClick={close} className={chipVariants({ size: "sm" })}>
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
