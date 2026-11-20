import Image from "next/image";
import { newsletterCopy } from "@/content/site";
import { NewsletterForm } from "@/features/newsletter/newsletter-form";
import { images } from "@/lib/images";

/** Newsletter strip above the footer: "light" on the home page, "dark" everywhere else (as in the mockup). */
export function NewsletterBand({ tone }: { tone: "light" | "dark" }) {
  const copy = newsletterCopy[tone];

  if (tone === "dark") {
    // Dark band at the top of the footer on inner pages (mockup values; mobile base, `md:` desktop).
    return (
      <section
        aria-labelledby="newsletter-title"
        className="on-dark relative border-b border-[#2f5238] bg-[#1a3a23]"
      >
        <div className="mx-auto flex max-w-site flex-wrap items-center justify-between gap-x-12 gap-y-6 px-5 py-12 md:px-8 md:py-14">
          <div className="flex flex-[1_1_380px] flex-col gap-2">
            <h2
              id="newsletter-title"
              className="m-0 font-display text-[26px] leading-[1.2] font-semibold text-white uppercase md:text-[32px]"
            >
              {copy.title}
            </h2>
            <p className="m-0 text-[16px] leading-6 text-[#cdbf9f]">{copy.text}</p>
          </div>
          <div className="flex-[1_1_420px]">
            <NewsletterForm tone="dark" source="footer-dark" />
          </div>
        </div>
      </section>
    );
  }

  // Light band (home page), mockup values: mobile base, `md:` desktop.
  const { showcaseWhiteApricot } = images.home;
  const branch = images.decor.branchPatternGreen;
  return (
    <section
      aria-labelledby="newsletter-title"
      className="relative overflow-hidden border-b border-[#e3ddd0] bg-[#f1efe9]"
    >
      <Image
        src={branch.src}
        width={branch.width}
        height={branch.height}
        alt=""
        unoptimized
        aria-hidden="true"
        className="pointer-events-none absolute -top-[30px] -left-10 h-auto w-[240px] opacity-[0.06]"
      />
      <Image
        src={branch.src}
        width={branch.width}
        height={branch.height}
        alt=""
        unoptimized
        aria-hidden="true"
        className="pointer-events-none absolute -right-[30px] -bottom-[60px] h-auto w-[260px] -scale-x-100 opacity-[0.06]"
      />
      <div className="relative mx-auto flex max-w-site flex-wrap items-center gap-x-10 gap-y-6 px-5 py-10 md:px-8 md:py-9">
        <Image
          src={showcaseWhiteApricot.src}
          width={showcaseWhiteApricot.width}
          height={showcaseWhiteApricot.height}
          alt="White Apricot pouch with a bowl of apricots"
          sizes="(min-width: 768px) 200px, 150px"
          className="h-auto w-[150px] flex-none drop-shadow-[0_18px_22px_rgba(0,0,0,0.22)] md:-mt-[70px] md:-mb-10 md:w-[200px]"
        />
        <div className="flex flex-[1_1_280px] flex-col gap-[6px]">
          <h2
            id="newsletter-title"
            data-rv="mask"
            className="m-0 text-[26px] leading-[39px] font-extrabold text-[#1f4a2f]"
          >
            {copy.title}
          </h2>
          <p className="m-0 text-[16px] leading-[1.5] text-[#3f4a40]">{copy.text}</p>
        </div>
        <div className="flex-[1_1_460px]">
          <NewsletterForm tone="light" source="footer-light" />
        </div>
      </div>
    </section>
  );
}
