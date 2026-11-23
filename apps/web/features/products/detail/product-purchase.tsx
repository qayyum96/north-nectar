"use client";

import { getDefaultVariant, getVariantByLabel } from "@northnectar/data/utils";
import { ChatIcon, CheckIcon, cn, formatPkr, formatPricePer100g } from "@northnectar/ui";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useId, useState, type ReactNode } from "react";
import { useAddToCart } from "@/features/cart/use-add-to-cart";
import { commerceConfig } from "@/lib/constants/commerce";
import { productPath, wholesaleEnquiryPath } from "@/lib/routes";
import { siteConfig } from "@/lib/seo/config";
import type { PurchasableProduct } from "../purchasable";

interface Props {
  product: PurchasableProduct;
  /** Server-rendered description, placed between the price and the size picker (mockup order). */
  children: ReactNode;
}

/** Reads ?size= from the URL (rendered inside <Suspense>). */
export function ProductPurchase(props: Props) {
  const searchParams = useSearchParams();
  return <ProductPurchaseView {...props} sizeParam={searchParams.get("size")} />;
}

/** Static fallback (default size), so the price is in the page source. */
export function ProductPurchaseFallback(props: Props) {
  return <ProductPurchaseView {...props} sizeParam={null} />;
}

function ProductPurchaseView({
  product,
  children,
  sizeParam,
}: Props & { sizeParam: string | null }) {
  const router = useRouter();
  const groupName = useId();
  const defaultVariant = getDefaultVariant(product);
  const [variantId, setVariantId] = useState(
    () => (getVariantByLabel(product, sizeParam) ?? defaultVariant)?.id,
  );
  const [quantity, setQuantity] = useState(1);
  const { add, added } = useAddToCart(product);
  const variant = product.variants.find((v) => v.id === variantId);
  const soldOut = !variant || variant.stock <= 0;
  const maxQty = Math.min(commerceConfig.maxQuantityPerLine, variant?.stock ?? 1);

  const chooseSize = (id: string) => {
    setVariantId(id);
    setQuantity(1);
    const v = product.variants.find((x) => x.id === id);
    // Keep the URL shareable (?size=250g) without a navigation or re-render of the page.
    const url =
      v && v.id !== defaultVariant?.id
        ? productPath(product.slug, v.label)
        : productPath(product.slug);
    window.history.replaceState(null, "", url);
  };

  const whatsappText = encodeURIComponent(
    variant
      ? `Hi North Nectar, I would like to order ${product.name} (${variant.label}) x ${quantity}.`
      : `Hi North Nectar, I would like to ask about ${product.name}.`,
  );
  const whatsapp = (
    <a
      href={`${siteConfig.contact.whatsappUrl}?text=${whatsappText}`}
      className="inline-flex items-center gap-2 self-center text-[15px] leading-[23px] font-bold text-[#1f6b3a] hover:underline"
    >
      <ChatIcon size={18} />
      Prefer WhatsApp? Order on {siteConfig.contact.phoneDisplay}
    </a>
  );

  if (product.purchaseMode === "quote" || product.variants.length === 0) {
    return (
      <>
        <p className="m-0 py-1 font-display text-[34px] font-bold text-[#0f2a1a] uppercase md:text-[44px]">
          Bulk supply only
        </p>
        {children}
        <Link
          href={wholesaleEnquiryPath(product.slug)}
          className="inline-flex h-14 items-center justify-center rounded-full bg-forest-600 font-display text-[18px] font-semibold tracking-[0.04em] text-white uppercase hover:bg-forest-800"
        >
          Request a quote
        </Link>
        {whatsapp}
      </>
    );
  }

  return (
    <>
      {variant ? (
        <p className="m-0 flex flex-wrap items-baseline gap-3 py-1">
          <span className="font-display text-[34px] font-bold text-[#0f2a1a] uppercase tabular-nums md:text-[44px]">
            {formatPkr(variant.price)}
          </span>
          {variant.compareAtPrice && variant.compareAtPrice > variant.price ? (
            <s className="text-[17px] text-[#6f6a5d] tabular-nums">
              <span className="sr-only">Was </span>
              {formatPkr(variant.compareAtPrice)}
            </s>
          ) : null}
          {/* Unit price for comparing sizes, from the size's weight (e.g. 1 kg at Rs 26,000 ->
              "Rs 2,600 per 100g"). Sizes without a weight show nothing here. */}
          {formatPricePer100g(variant.price, variant.weightGrams) ? (
            <span className="text-[15px] text-[#5e5a4e]">
              {formatPricePer100g(variant.price, variant.weightGrams)}
            </span>
          ) : null}
        </p>
      ) : null}

      {children}

      {product.variants.length > 1 ? (
        <fieldset className="m-0 flex flex-col gap-[10px] border-0 p-0">
          <legend className="mb-[10px] p-0 text-[15px] leading-[23px] font-bold">
            Size: <span className="font-medium text-[#4d4a40]">{variant?.label}</span>
          </legend>
          <div className="grid grid-cols-3 gap-[10px]">
            {product.variants.map((v) => {
              const checked = v.id === variantId;
              const out = v.stock <= 0;
              return (
                <label key={v.id} className={out ? "cursor-not-allowed" : "cursor-pointer"}>
                  <input
                    type="radio"
                    name={groupName}
                    value={v.id}
                    checked={checked}
                    disabled={out}
                    onChange={() => chooseSize(v.id)}
                    className="peer sr-only"
                  />
                  <span
                    className={cn(
                      "relative flex flex-col items-start gap-[2px] rounded-[14px] border-2 px-[14px] pt-[14px] pb-3 text-left peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-forest-600",
                      checked
                        ? "border-forest-600 bg-[#f3f8f0]"
                        : "border-[#e3d8bf] bg-white hover:border-[#cdbf9f]",
                      out && "opacity-50",
                    )}
                  >
                    <span className="font-display text-[20px] leading-[30px] font-semibold text-[#0f2a1a] uppercase">
                      {v.label}
                    </span>
                    <span className="text-[15px] leading-[23px] font-semibold text-[#3f4a40] tabular-nums">
                      {out ? "Sold out" : formatPkr(v.price)}
                    </span>
                    {v.tag ? (
                      <span className="absolute -top-[11px] right-[10px] rounded-full bg-[#f4a12e] px-[9px] py-[2px] text-[14px] leading-[21px] font-bold text-[#1b1a12]">
                        {v.tag}
                      </span>
                    ) : null}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      ) : variant?.label ? (
        // One size only: no picker, but still say what the price is for ("Size: 1 kg").
        <p className="m-0 text-[15px] leading-[23px] font-bold">
          Size: <span className="font-medium text-[#4d4a40]">{variant.label}</span>
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3 pt-1">
        <div
          role="group"
          aria-label={`Quantity of ${product.name}`}
          className="inline-flex h-14 items-center rounded-full border border-[#ddd3bf] bg-white"
        >
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            aria-label="Decrease quantity"
            className="h-[54px] w-[52px] cursor-pointer text-[22px] text-ink disabled:cursor-not-allowed disabled:opacity-40"
          >
            −
          </button>
          <output
            aria-live="polite"
            className="min-w-8 text-center text-[17px] font-bold tabular-nums"
          >
            {quantity}
          </output>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
            disabled={quantity >= maxQty}
            aria-label="Increase quantity"
            className="h-[54px] w-[52px] cursor-pointer text-[22px] text-ink disabled:cursor-not-allowed disabled:opacity-40"
          >
            +
          </button>
        </div>
        <button
          type="button"
          disabled={soldOut}
          onClick={() => variant && add(variant, quantity)}
          className={cn(
            "inline-flex h-14 flex-[1_1_220px] cursor-pointer items-center justify-center gap-[10px] rounded-full font-display text-[18px] font-semibold tracking-[0.04em] text-white uppercase disabled:cursor-not-allowed disabled:opacity-55",
            added ? "bg-[#3d7a4f]" : "bg-forest-600 hover:bg-forest-800",
          )}
        >
          {added ? <CheckIcon size={20} className="shrink-0" /> : null}
          {soldOut
            ? "Sold out"
            : added
              ? "Added to cart"
              : `Add to cart · ${formatPkr(variant.price * quantity)}`}
        </button>
        <span className="sr-only" role="status" aria-live="polite">
          {added && variant
            ? `${quantity} × ${product.name}, ${variant.label}, added to your cart`
            : ""}
        </span>
      </div>

      <button
        type="button"
        disabled={soldOut}
        onClick={() => {
          if (!variant) return;
          add(variant, quantity);
          router.push("/checkout");
        }}
        className="inline-flex h-14 cursor-pointer items-center justify-center rounded-full bg-[#f4a12e] font-display text-[18px] font-semibold tracking-[0.04em] text-[#1b1a12] uppercase hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-55"
      >
        Buy it now
      </button>

      {whatsapp}
    </>
  );
}
