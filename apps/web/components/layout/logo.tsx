import { cn } from "@northnectar/ui";
import Image from "next/image";
import Link from "next/link";
import { images } from "@/lib/images";
import { siteConfig } from "@/lib/seo/config";

/**
 * Emblem + wordmark lock-up. Mockup sizes: mobile emblem 30px / wordmark 16px / gap 8px;
 * desktop emblem 46px / wordmark 22px / tagline 14px, gap 14px.
 */
export function Logo({ className }: { className?: string }) {
  const { emblemGreen, wordmarkGreen } = images.brand;
  return (
    <Link
      href="/"
      aria-label={`${siteConfig.name}, home`}
      className={cn(
        "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg lg:gap-[14px]",
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
        className="h-[30px] w-auto lg:h-[46px]"
      />
      <span className="flex flex-col gap-[5px]">
        <Image
          src={wordmarkGreen.src}
          width={wordmarkGreen.width}
          height={wordmarkGreen.height}
          alt=""
          unoptimized
          loading="eager"
          className="h-4 w-auto lg:h-[22px]"
        />
        <span className="hidden text-[14px] leading-[21px] tracking-[0.04em] whitespace-nowrap text-[#4e6a52] lg:block">
          {siteConfig.tagline}
        </span>
      </span>
    </Link>
  );
}
