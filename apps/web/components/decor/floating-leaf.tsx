import type { ImageAsset } from "@northnectar/types";
import { cn } from "@northnectar/ui";
import Image from "next/image";
import type { CSSProperties } from "react";

/**
 * Decorative leaf with a gentle CSS float (no JavaScript). Hidden from assistive tech and frozen
 * when the visitor prefers reduced motion.
 */
export function FloatingLeaf({
  image,
  className,
  rotate = 0,
  delay = 0,
  duration = 4.2,
  width = 120,
}: {
  image: ImageAsset;
  className?: string;
  rotate?: number;
  /** Seconds. Negative values start mid-animation so leaves don't move in sync. */
  delay?: number;
  duration?: number;
  /** Rendered width in px, used for `sizes`. */
  width?: number;
}) {
  // The float animation drives `rotate`/`translate` on the image, so the static tilt sits on the
  // wrapper's `transform` and the two combine instead of overriding each other.
  const wrapperStyle = { transform: `rotate(${rotate}deg)` } satisfies CSSProperties;
  const imageStyle = {
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`,
  } satisfies CSSProperties;

  return (
    <span
      aria-hidden="true"
      style={wrapperStyle}
      className={cn("pointer-events-none absolute block", className)}
    >
      <Image
        src={image.src}
        width={image.width}
        height={image.height}
        alt=""
        sizes={`${width}px`}
        style={imageStyle}
        className="h-auto w-full animate-leaf-float drop-shadow-[0_14px_16px_rgba(30,60,20,0.22)]"
      />
    </span>
  );
}
