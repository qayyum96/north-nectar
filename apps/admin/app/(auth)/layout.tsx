import Image from "next/image";
import type { ReactNode } from "react";

/** Split sign-in layout from the mockup (art panel hidden below 768px). */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-wrap bg-white">
      <div className="relative hidden flex-[1_1_520px] flex-col justify-between overflow-hidden bg-[radial-gradient(at_70%_20%,#2c6340_0%,#173a24_50%,#0e2618_100%)] p-12 text-white md:flex">
        <Image
          src="/images/scene-mountains-cream.svg"
          alt=""
          width={1836}
          height={696}
          unoptimized
          className="pointer-events-none absolute -bottom-5 -left-10 h-auto w-[900px] max-w-none opacity-[0.12]"
        />
        <Image
          src="/images/logo-stacked-cream.svg"
          alt="North Nectar"
          width={1608}
          height={996}
          unoptimized
          priority
          className="relative h-auto w-[170px]"
        />
        <div className="relative flex max-w-[440px] flex-col gap-3">
          <p className="m-0 text-[30px] leading-[1.2] font-bold">
            Run North Nectar from one calm place.
          </p>
          <p className="m-0 text-[15px] leading-[1.6] text-[#cdd8c8]">
            Orders, stock, purchases and your website, all together.
          </p>
        </div>
      </div>
      <main className="flex flex-[1_1_440px] items-center justify-center px-6 py-12">
        {children}
      </main>
    </div>
  );
}
