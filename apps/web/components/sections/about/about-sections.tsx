import { MapPinIcon } from "@northnectar/ui";
import Image from "next/image";
import Link from "next/link";
import { FloatingLeaf } from "@/components/decor/floating-leaf";
import { Eyebrow, PageHeading } from "@/components/sections/page-heading";
import { aboutContent } from "@/content/about";
import { images } from "@/lib/images";

/* Values match the mockup: mobile base, `md:` desktop (1440 reference). */

const cardTitle = "m-0 font-display text-[22px] leading-[33px] font-semibold uppercase";
const cardText = "m-0 text-[15px] leading-[1.6]";

/** "Who we are": emblem column plus the founding quote and two paragraphs. */
export function AboutIntro() {
  const { intro } = aboutContent;
  return (
    <section aria-labelledby="who-we-are" className="px-4 py-14 md:px-8 md:py-24">
      <div className="mx-auto flex max-w-[1180px] flex-wrap gap-x-[72px] gap-y-7">
        <div className="flex flex-[0_1_260px] flex-col gap-[14px]">
          <Eyebrow as="h2" id="who-we-are">
            {intro.eyebrow}
          </Eyebrow>
          <Image
            src={images.brand.emblemGreen.src}
            width={images.brand.emblemGreen.width}
            height={images.brand.emblemGreen.height}
            alt=""
            unoptimized
            className="h-auto w-[120px]"
          />
        </div>
        <div className="flex flex-[1_1_560px] flex-col gap-[22px]">
          <p
            data-rv="fade"
            className="m-0 font-display text-[26px] leading-[1.15] font-semibold text-[#0f2a1a] uppercase md:text-[40px]"
          >
            {intro.quote}
          </p>
          <div className="grid gap-x-9 gap-y-5 text-[17px] leading-[1.75] text-[#3f4a40] md:grid-cols-2">
            {intro.paragraphs.map((text) => (
              <p key={text} className="m-0">
                {text}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/** "How we source": four numbered steps. Anchor target of the footer's "How we source" link. */
export function SourcingSteps() {
  const { sourcing } = aboutContent;
  return (
    <section
      id={sourcing.id}
      aria-labelledby="how-we-source-title"
      className="bg-[#f1e9da] px-4 py-14 md:px-8 md:py-24"
    >
      <div className="mx-auto flex max-w-[1320px] flex-col gap-10">
        <PageHeading
          id="how-we-source-title"
          eyebrow={sourcing.eyebrow}
          title={sourcing.title}
          align="center"
        />
        <ol data-rv="rise" className="m-0 grid list-none gap-5 p-0 sm:grid-cols-2 lg:grid-cols-4">
          {sourcing.steps.map((step, index) => (
            <li
              key={step.title}
              className="flex flex-col overflow-hidden rounded-[22px] border border-[#e3d8bf] bg-white"
            >
              <div className="relative aspect-[4/3] w-full" style={{ background: step.background }}>
                <Image
                  src={step.image.src}
                  alt={step.image.alt}
                  fill
                  sizes="(min-width: 1024px) 315px, (min-width: 640px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col gap-2 px-[22px] pt-5 pb-6">
                <span
                  aria-hidden="true"
                  className="font-display text-[40px] leading-none font-bold text-[#d1ae6c]"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className={`${cardTitle} text-[#0f2a1a]`}>{step.title}</h3>
                <p className={`${cardText} text-[#4d4a40]`}>{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/** "Where it comes from": three regions on the dark mountain band. */
export function OriginRegions() {
  const { regions } = aboutContent;
  return (
    <section
      aria-labelledby="regions-title"
      className="on-dark relative overflow-hidden bg-[#0f2a1a] px-4 py-14 text-white md:px-8 md:py-24"
    >
      <Image
        src={images.decor.mountainsCream.src}
        width={images.decor.mountainsCream.width}
        height={images.decor.mountainsCream.height}
        alt=""
        aria-hidden="true"
        unoptimized
        className="pointer-events-none absolute -bottom-[30px] left-1/2 h-auto w-[900px] max-w-none -translate-x-1/2 opacity-[0.14] md:w-[1600px]"
      />
      <div className="relative mx-auto flex max-w-[1320px] flex-col gap-9">
        <PageHeading
          id="regions-title"
          eyebrow={regions.eyebrow}
          title={regions.title}
          tone="dark"
          className="max-w-[720px]"
        />
        <ul data-rv="rise" className="m-0 grid list-none gap-[18px] p-0 md:grid-cols-3">
          {regions.items.map((region) => (
            <li
              key={region.name}
              className="flex flex-col gap-3 rounded-[22px] border border-[#2b5a3c] bg-white/6 p-[26px]"
            >
              <h3 className="m-0 inline-flex items-center gap-[10px] text-[#d1ae6c]">
                <MapPinIcon size={20} strokeWidth={2} className="shrink-0" />
                <span className="font-display text-[26px] leading-[39px] font-semibold text-white uppercase">
                  {region.name}
                </span>
              </h3>
              <p className={`${cardText} text-[#c9d3c4]`}>{region.text}</p>
              <ul
                aria-label={`From ${region.name}`}
                className="m-0 flex list-none flex-wrap gap-2 p-0 pt-1"
              >
                {region.tags.map((tag) => (
                  <li
                    key={tag}
                    className="rounded-full bg-[#173a25] px-3 py-[5px] text-[14px] leading-[21px] font-semibold text-[#e9efe4]"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** "What we stand for": four value cards. */
export function OurValues() {
  const { values } = aboutContent;
  return (
    <section aria-labelledby="values-title" className="px-4 py-14 md:px-8 md:py-24">
      <div className="mx-auto flex max-w-[1320px] flex-col gap-9">
        <PageHeading
          id="values-title"
          eyebrow={values.eyebrow}
          title={values.title}
          align="center"
        />
        <ul
          data-rv="rise"
          className="m-0 grid list-none gap-[18px] p-0 sm:grid-cols-2 lg:grid-cols-4"
        >
          {values.items.map((value) => (
            <li
              key={value.title}
              className="flex flex-col gap-3 rounded-[22px] border border-[#e8dfcc] bg-white p-[26px]"
            >
              <Image
                src={value.icon.src}
                width={value.icon.width}
                height={value.icon.height}
                alt=""
                unoptimized
                className="h-[52px] w-auto self-start"
              />
              <h3 className={`${cardTitle} text-[#0f2a1a]`}>{value.title}</h3>
              <p className={`${cardText} text-[#4d4a40]`}>{value.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** Orange call to action at the foot of the page. */
export function AboutCta() {
  const { cta } = aboutContent;
  return (
    <section aria-labelledby="about-cta-title" className="px-4 pb-14 md:px-8 md:pb-24">
      {/* Mockup: max-width 1320px content-box plus 60px side padding. */}
      <div
        data-rv="fade"
        className="relative mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-6 overflow-hidden rounded-[30px] bg-[#f4a12e] px-6 py-9 md:px-[60px] md:py-[52px]"
      >
        <FloatingLeaf
          image={images.decor.leaf3}
          rotate={-20}
          duration={4.8}
          delay={-1}
          width={160}
          className="-top-5 right-[30%] w-40 opacity-95"
          imageClassName="drop-shadow-none"
        />
        <div className="relative flex max-w-[640px] flex-col gap-2">
          <h2
            id="about-cta-title"
            data-rv="mask"
            className="m-0 font-display text-[36px] leading-[1.02] font-bold text-[#1b1a12] uppercase md:text-[56px]"
          >
            {cta.title}
          </h2>
          <p className="m-0 text-[17px] leading-[1.5] text-[#3b2a10]">{cta.text}</p>
        </div>
        <Link
          href={cta.action.href}
          className="relative inline-flex h-[60px] items-center rounded-full bg-[#0f2a1a] px-[34px] font-display text-[19px] font-semibold tracking-[0.04em] text-white uppercase hover:bg-forest-700"
        >
          {cta.action.label}
        </Link>
      </div>
    </section>
  );
}
