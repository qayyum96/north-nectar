import { cn } from "@northnectar/ui";
import Image from "next/image";
import type { ReactNode } from "react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { FloatingLeaf } from "@/components/decor/floating-leaf";
import { Eyebrow } from "@/components/sections/page-heading";
import { contactContent } from "@/content/contact";
import { images } from "@/lib/images";
import { siteConfig } from "@/lib/seo/config";

/* Values match the mockup: mobile base, `md:` desktop (1440 reference). */

const pill =
  "inline-flex items-center gap-2 rounded-full px-[18px] text-[15px] font-semibold transition-colors";

/** Light page header with quick contact actions. */
export function ContactHero() {
  const { hero } = contactContent;
  const { contact } = siteConfig;
  return (
    <section
      aria-labelledby="contact-title"
      className="relative overflow-hidden border-b border-[#ece4d3] bg-[#faf7f0]"
    >
      <FloatingLeaf
        image={images.decor.leaf3}
        rotate={-22}
        duration={3.4}
        width={240}
        className="top-[30px] -right-[30px] w-[120px] md:right-20 md:w-[240px]"
        imageClassName="drop-shadow-[0_12px_14px_rgba(30,60,20,0.2)]"
      />
      <div className="relative mx-auto flex max-w-[1384px] flex-col gap-4 px-4 pt-[22px] pb-7 md:px-8 md:py-10">
        <Breadcrumbs items={[{ name: "Contact", path: "/contact" }]} />
        <h1
          id="contact-title"
          data-rv="mask"
          className="m-0 font-display text-[60px] leading-[0.95] font-bold text-[#0f2a1a] uppercase md:text-[112px]"
        >
          {hero.title}
        </h1>
        <p className="m-0 max-w-[560px] text-[17px] leading-[1.6] text-[#4d4a40]">{hero.intro}</p>
        <div className="flex flex-wrap gap-[10px] pt-[6px]">
          {/* Mockup: the outlined pills are 46px plus a 1px border, the filled one 46px. */}
          <a
            href={`tel:${contact.phoneE164}`}
            className={cn(
              pill,
              "h-12 border border-[#e3d8bf] bg-white text-ink hover:border-forest-600",
            )}
          >
            {hero.actions.call}
          </a>
          <a
            href={contact.whatsappUrl}
            className={cn(pill, "h-[46px] bg-forest-600 text-white hover:bg-forest-700")}
          >
            {hero.actions.whatsapp}
          </a>
          <a
            href={`mailto:${contact.email}`}
            className={cn(
              pill,
              "h-12 border border-[#e3d8bf] bg-white text-ink hover:border-forest-600",
            )}
          >
            {hero.actions.email}
          </a>
        </div>
      </div>
    </section>
  );
}

/** Form card plus the dark contact details card, side by side on desktop. */
export function ContactMain({ form }: { form: ReactNode }) {
  const { details } = contactContent;
  return (
    <section aria-label="Send a message" className="px-4 pt-8 pb-14 md:px-8 md:pt-14 md:pb-24">
      <div className="mx-auto flex max-w-[1320px] flex-wrap items-start gap-7">
        <div className="min-w-0 flex-[1.5_1_560px] rounded-[26px] border border-[#e8dfcc] bg-white px-5 py-6 md:p-10">
          {form}
        </div>
        <aside
          aria-labelledby="contact-details-title"
          className="on-dark relative flex min-w-0 flex-[1_1_360px] flex-col gap-[22px] overflow-hidden rounded-[26px] bg-[radial-gradient(ellipse_at_80%_10%,#22573a_0%,#12321f_50%,#0b2114_100%)] px-5 py-6 text-white md:p-10"
        >
          <Image
            src={images.decor.mountainsCream.src}
            width={images.decor.mountainsCream.width}
            height={images.decor.mountainsCream.height}
            alt=""
            aria-hidden="true"
            unoptimized
            className="pointer-events-none absolute -bottom-[14px] -left-[30px] h-auto w-[520px] max-w-none opacity-10"
          />
          <h2
            id="contact-details-title"
            className="relative m-0 font-display text-[28px] leading-[42px] font-semibold uppercase"
          >
            {details.title}
          </h2>
          <dl className="relative m-0 flex flex-col gap-[22px]">
            {details.rows.map((row) => (
              <div key={row.label} className="flex flex-col gap-1 border-b border-[#2b5a3c] pb-4">
                <dt className="text-[14px] leading-[21px] font-bold tracking-[0.1em] text-[#9ed7a6] uppercase">
                  {row.label}
                </dt>
                <dd className="m-0 text-[17px] leading-[1.5] text-white">
                  {row.href ? (
                    <a href={row.href} className="hover:underline">
                      {row.value}
                    </a>
                  ) : (
                    row.value
                  )}
                </dd>
              </div>
            ))}
          </dl>
          <a
            href={siteConfig.contact.whatsappUrl}
            className="relative inline-flex h-[54px] items-center justify-center rounded-full bg-[#f4a12e] font-display text-[18px] font-semibold tracking-[0.04em] text-[#1b1a12] uppercase hover:bg-orange-600"
          >
            {details.cta}
          </a>
        </aside>
      </div>
    </section>
  );
}

/**
 * FAQ accordion. Native <details name> gives one-open-at-a-time behaviour, keyboard support and
 * crawlable answers with no JavaScript; the first question starts open as in the mockup.
 */
export function ContactFaq() {
  const { faq } = contactContent;
  return (
    <section
      id={faq.id}
      aria-labelledby="faq-title"
      className="bg-[#f1e9da] px-4 pt-8 pb-14 md:px-8 md:pt-14 md:pb-24"
    >
      <div className="mx-auto flex max-w-[1320px] flex-wrap gap-x-16 gap-y-7">
        <div className="flex flex-[1_1_340px] flex-col gap-3">
          <Eyebrow>{faq.eyebrow}</Eyebrow>
          <h2
            id="faq-title"
            data-rv="mask"
            className="m-0 font-display text-[36px] leading-[1.02] font-bold text-[#0f2a1a] uppercase md:text-[56px]"
          >
            {faq.title}
          </h2>
          <p className="m-0 text-[16px] leading-[1.6] text-[#4d4a40]">{faq.text}</p>
        </div>
        <div className="flex flex-[2_1_560px] flex-col gap-[10px]">
          {faq.items.map((item, index) => (
            <details
              key={item.question}
              name="faq"
              open={index === 0}
              className="group overflow-hidden rounded-[16px] border border-[#e3d8bf] bg-white"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-[18px] text-[17px] leading-[1.5] font-bold text-[#0f2a1a] [&::-webkit-details-marker]:hidden">
                <h3 className="m-0 text-[17px] font-bold">{item.question}</h3>
                <span
                  aria-hidden="true"
                  className="inline-flex size-8 flex-none items-center justify-center rounded-full bg-[#efe7d6] text-[20px] leading-none text-ink group-open:bg-forest-600 group-open:text-white"
                >
                  <span className="group-open:hidden">+</span>
                  <span className="hidden group-open:inline">−</span>
                </span>
              </summary>
              <p className="m-0 px-5 pb-5 text-[16px] leading-[1.65] text-[#3f4a40]">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
