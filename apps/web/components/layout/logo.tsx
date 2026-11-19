import { cn } from "@northnectar/ui";
import Image from "next/image";
import Link from "next/link";
import { images } from "@/lib/images";
import { siteConfig } from "@/lib/seo/config";

/**
 * Emblem + wordmark lock-up. The images are decorative (alt=""), and the link carries the
 * accessible name. SVGs are served as-is (`unoptimized`); they are small and sharp at any size.
 */
export function Logo({
  showTagline = true,
  className,
}: {
  showTagline?: boolean;
  className?: string;
}) {
  const { emblemGreen, wordmarkGreen } = images.brand;
  return (
    <Link
      href="/"
      aria-label={`${siteConfig.name}, home`}
      className={cn(
        "inline-flex min-h-11 shrink-0 items-center gap-2.5 rounded-lg lg:gap-4",
        className,
      )}
    >
      <Image
        src={emblemGreen.src}
        width={emblemGreen.width}
        height={emblemGreen.height}
        alt=""
        unoptimized
        loading="eager"
        className="h-[30px] w-auto lg:h-11"
      />
      <span className="flex flex-col gap-1">
        <Image
          src={wordmarkGreen.src}
          width={wordmarkGreen.width}
          height={wordmarkGreen.height}
          alt=""
          unoptimized
          loading="eager"
          className="h-4 w-auto lg:h-[22px]"
        />
        {showTagline ? (
          <span className="hidden text-md leading-none tracking-wide text-sage-600 lg:block">
            {siteConfig.tagline}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
