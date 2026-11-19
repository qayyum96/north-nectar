"use client";

import type { CartLine } from "@northnectar/types";
import { QuantityStepper, formatPkr } from "@northnectar/ui";
import Image from "next/image";
import Link from "next/link";
import { commerceConfig } from "@/lib/constants/commerce";
import { useCartStore } from "./store";

/** One cart row, used by the drawer (and reused by the cart page in Phase 5). */
export function CartLineItem({ line, onNavigate }: { line: CartLine; onNavigate?: () => void }) {
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  return (
    <li className="flex gap-4 py-5">
      <div className="relative size-20 shrink-0 overflow-hidden rounded-xl border border-line bg-white">
        <Image
          src={line.image.src}
          alt={line.image.alt}
          fill
          sizes="80px"
          className="object-cover"
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <Link
            href={`/products/${line.slug}`}
            onClick={onNavigate}
            className="text-base leading-snug font-bold text-ink hover:underline"
          >
            {line.name}
          </Link>
          <p className="shrink-0 text-base font-bold text-ink tabular-nums">
            {formatPkr(line.unitPrice * line.quantity)}
          </p>
        </div>
        <p className="mt-0.5 text-sm text-subtle">
          {line.variantLabel} · {formatPkr(line.unitPrice)} each
        </p>
        <div className="mt-3 flex items-center justify-between gap-3">
          <QuantityStepper
            size="sm"
            value={line.quantity}
            max={commerceConfig.maxQuantityPerLine}
            onChange={(q) => setQuantity(line.variantId, q)}
            itemName={`${line.name} ${line.variantLabel}`}
          />
          <button
            type="button"
            onClick={() => removeItem(line.variantId)}
            className="min-h-11 cursor-pointer px-1 text-md font-semibold text-rust-700 underline underline-offset-4 hover:text-rust-600"
          >
            Remove
            <span className="sr-only">
              {" "}
              {line.name} {line.variantLabel}
            </span>
          </button>
        </div>
      </div>
    </li>
  );
}
