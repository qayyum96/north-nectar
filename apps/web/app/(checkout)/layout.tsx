import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Motion } from "@/components/motion/motion";
import { checkoutContent } from "@/content/checkout";
import { LockIcon } from "@/features/checkout/lock-icon";
import { images } from "@/lib/images";
import { siteConfig } from "@/lib/seo/config";

/** Checkout keeps distractions out: logo, "Secure checkout" and a one-line footer (mockup values). */
export default function CheckoutLayout({ children }: { children: ReactNode }) {
  const { emblemGreen, wordmarkGreen } = images.brand;
  const { footer } = checkoutContent;
  return (
    <>
      <a
        href="#main"
        className="sr-only z-50 rounded-full bg-forest-600 px-5 py-3 font-semibold text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <header className="border-b border-[#e8dfcc] bg-white">
        <div className="mx-auto flex h-16 max-w-[1304px] items-center justify-between gap-4 px-4 md:h-20 md:px-8">
          <Link
            href="/"
            aria-label={`${siteConfig.name} home`}
            className="inline-flex shrink-0 items-center gap-[10px]"
          >
            <Image
              src={emblemGreen.src}
              width={emblemGreen.width}
              height={emblemGreen.height}
              alt=""
              unoptimized
              loading="eager"
              className="h-[30px] w-auto md:h-[42px]"
            />
            <Image
              src={wordmarkGreen.src}
              width={wordmarkGreen.width}
              height={wordmarkGreen.height}
              alt=""
              unoptimized
              loading="eager"
              className="h-4 w-auto md:h-[22px]"
            />
          </Link>
          <p className="m-0 inline-flex items-center gap-2 text-[15px] leading-[1.5] font-bold text-[#1f4a2f]">
            <LockIcon />
            <span className="max-[359px]:sr-only">{checkoutContent.header.secure}</span>
          </p>
        </div>
      </header>
      <main id="main" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <footer className="border-t border-[#e8dfcc] px-4 py-[22px] text-center text-[14px] leading-[1.5] text-[#6a665a] md:px-8">
        {footer.copyright(new Date().getFullYear())}
        {footer.links.map((link) => (
          <span key={link.href}>
            {" · "}
            <Link href={link.href} className="hover:text-ink hover:underline">
              {link.label}
            </Link>
          </span>
        ))}
      </footer>
      <Motion />
    </>
  );
}
