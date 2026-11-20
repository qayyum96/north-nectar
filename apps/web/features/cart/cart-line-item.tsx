"use client";

import type { CartLine } from "@northnectar/types";
import { formatPkr } from "@northnectar/ui";
import Image from "next/image";
import Link from "next/link";
import { productPath } from "@/lib/routes";
import { CartStepper } from "./cart-stepper";
import { useCartStore } from "./store";

/** One row in the cart drawer (mockup values). */
export function CartLineItem({ line, onNavigate }: { line: CartLine; onNavigate?: () => void }) {
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const itemName = `${line.name} ${line.variantLabel}`;

  return (
    <li className="flex gap-[14px] border-b border-[#ece4d3] py-4">
      <span className="relative size-[82px] shrink-0 overflow-hidden rounded-[12px] border border-[#ece4d3] bg-white">
        <Image src={line.image.src} alt="" fill sizes="80px" className="object-contain" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-[6px]">
        <div className="flex justify-between gap-[10px]">
          <Link
            href={productPath(line.slug, line.variantLabel)}
            onClick={onNavigate}
            className="text-[15px] leading-[1.3] font-bold text-ink hover:underline"
          >
            {line.name}
          </Link>
          <span className="text-[15px] leading-[1.3] font-bold whitespace-nowrap">
            {formatPkr(line.unitPrice * line.quantity)}
          </span>
        </div>
        <span className="text-[14px] text-[#6a665a]">
          {line.variantLabel} · {formatPkr(line.unitPrice)} each
        </span>
        <div className="flex items-center justify-between gap-[10px] pt-[2px]">
          <CartStepper
            size="sm"
            value={line.quantity}
            onChange={(q) => setQuantity(line.variantId, q)}
            itemName={itemName}
          />
          <button
            type="button"
            onClick={() => removeItem(line.variantId)}
            className="relative cursor-pointer border-0 bg-transparent px-[6px] py-px text-[14px] font-semibold text-[#8a4513] underline before:absolute before:-inset-x-2 before:-inset-y-3 before:content-[''] hover:text-[#6f370f]"
          >
            Remove<span className="sr-only"> {itemName}</span>
          </button>
        </div>
      </div>
    </li>
  );
}
