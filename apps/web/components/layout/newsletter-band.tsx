import Image from "next/image";
import { newsletterCopy } from "@/content/site";
import { NewsletterForm } from "@/features/newsletter/newsletter-form";
import { images } from "@/lib/images";

/** Newsletter strip above the footer: "light" on the home page, "dark" everywhere else (as in the mockup). */
export function NewsletterBand({ tone }: { tone: "light" | "dark" }) {
  const copy = newsletterCopy[tone];

  if (tone === "dark") {
    return (
      <section
        aria-labelledby="newsletter-title"
        className="on-dark border-b border-white/10 bg-forest-800"
      >
        <div className="mx-auto grid max-w-site gap-6 px-4 py-12 sm:px-6 md:grid-cols-2 md:items-end md:gap-10 lg:px-8 lg:py-14">
          <div>
            <h2
              id="newsletter-title"
              className="font-display text-display-md font-bold text-white uppercase"
            >
              {copy.title}
            </h2>
            <p className="mt-2 text-md text-kraft">{copy.text}</p>
          </div>
          <NewsletterForm tone="dark" source="footer-dark" />
        </div>
      </section>
    );
  }

  const { showcaseWhiteApricot } = images.home;
  return (
    <section aria-labelledby="newsletter-title" className="relative overflow-hidden bg-linen">
      <Image
        src={images.decor.branchPatternGreen.src}
        width={images.decor.branchPatternGreen.width}
        height={images.decor.branchPatternGreen.height}
        alt=""
        unoptimized
        className="pointer-events-none absolute top-1/2 -right-24 hidden w-80 -translate-y-1/2 opacity-[0.08] lg:block"
      />
      <div className="relative mx-auto grid max-w-site items-center gap-6 px-4 py-10 sm:px-6 md:grid-cols-[auto_1fr] lg:grid-cols-[12rem_1fr_minmax(0,38rem)] lg:gap-10 lg:px-8 lg:py-8">
        <Image
          src={showcaseWhiteApricot.src}
          width={showcaseWhiteApricot.width}
          height={showcaseWhiteApricot.height}
          alt=""
          sizes="192px"
          className="hidden h-auto w-48 mix-blend-multiply lg:block"
        />
        <div>
          <h2
            id="newsletter-title"
            className="text-2xl font-extrabold text-forest-700 sm:text-[1.625rem]"
          >
            {copy.title}
          </h2>
          <p className="mt-1.5 text-md text-body">{copy.text}</p>
        </div>
        <div className="md:col-span-2 lg:col-span-1">
          <NewsletterForm tone="light" source="footer-light" />
        </div>
      </div>
    </section>
  );
}
