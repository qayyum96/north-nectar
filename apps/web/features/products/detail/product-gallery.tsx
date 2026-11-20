"use client";

import type { ImageAsset, ProductBadge } from "@northnectar/types";
import { cn } from "@northnectar/ui";
import Image from "next/image";
import { useState } from "react";

const BADGE_TONES: Record<string, string> = {
  green: "bg-forest-600 text-white",
  orange: "bg-[#b2561a] text-white",
  kraft: "bg-[#efe2c4] text-ink",
  dark: "bg-ink text-white",
};

/**
 * Product gallery (mockup): 88px thumbnails in a column on desktop, 72px in a row below the image
 * on mobile; square main image (24px radius) with badge and "1 / 4" counter. The first image is
 * preloaded as the page's LCP element; the others load when selected.
 */
export function ProductGallery({
  images,
  badge,
  productName,
}: {
  images: ImageAsset[];
  badge?: ProductBadge | null;
  productName: string;
}) {
  const [index, setIndex] = useState(0);
  const current = images[index] ?? images[0];
  if (!current) return null;

  return (
    <div className="flex min-w-0 flex-[1_1_520px] flex-col-reverse gap-[14px] md:sticky md:top-[150px] md:flex-row">
      {images.length > 1 ? (
        <ul
          aria-label={`${productName} images`}
          className="m-0 flex flex-none list-none flex-row gap-[10px] p-0 md:flex-col"
        >
          {images.map((img, i) => (
            <li key={img.src}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-pressed={i === index}
                aria-label={`Show image ${i + 1} of ${images.length}: ${img.alt}`}
                className={cn(
                  "relative block size-[72px] cursor-pointer overflow-hidden rounded-[14px] border-2 p-1 md:size-[88px]",
                  i === index ? "border-forest-600" : "border-[#e3d8bf] hover:border-[#cdbf9f]",
                )}
                style={{ background: img.background ?? "#ffffff" }}
              >
                <span className="relative block h-full w-full">
                  <Image
                    src={img.src}
                    alt=""
                    fill
                    sizes="(min-width: 768px) 76px, 60px"
                    className="rounded-[10px] object-contain"
                  />
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div
        className="relative aspect-square flex-auto overflow-hidden rounded-[24px] border border-[#ece4d3]"
        style={{ background: current.background ?? "#ffffff" }}
      >
        <Image
          key={current.src}
          src={current.src}
          alt={current.alt}
          fill
          preload={index === 0}
          fetchPriority={index === 0 ? "high" : undefined}
          sizes="(min-width: 1384px) 570px, (min-width: 768px) 45vw, 92vw"
          className={cn("object-contain", index > 0 && "p-7")}
        />
        {badge ? (
          <span
            className={cn(
              "absolute top-4 left-4 rounded-full px-[14px] py-[6px] text-[14px] leading-[21px] font-bold",
              BADGE_TONES[badge.tone],
            )}
          >
            {badge.label}
          </span>
        ) : null}
        {images.length > 1 ? (
          <span
            aria-hidden="true"
            className="absolute right-4 bottom-4 rounded-full bg-white/[0.92] px-3 py-[6px] text-[14px] leading-[21px] font-semibold text-ink"
          >
            {index + 1} / {images.length}
          </span>
        ) : null}
      </div>
    </div>
  );
}
