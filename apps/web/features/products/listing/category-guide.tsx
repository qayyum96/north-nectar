import type { Category } from "@northnectar/types";
import { RichParagraph } from "@northnectar/ui";
import { FaqList } from "@/components/sections/faq-list";
import { Eyebrow } from "@/components/sections/page-heading";
import { siteConfig } from "@/lib/seo/config";

const heading =
  "m-0 font-display text-[34px] leading-[1.02] font-bold text-[#0f2a1a] uppercase md:text-[52px]";

/**
 * Category page text below the products: an "About" article and common questions, both edited in
 * the admin (Categories). Renders nothing when the category has neither. The FAQPage structured
 * data for the same questions is added by the page (app/(store)/shop/[category]).
 */
export function CategoryGuide({ category }: { category: Category }) {
  const content = category.content ?? [];
  const faqs = category.faqs ?? [];
  if (content.length === 0 && faqs.length === 0) return null;

  return (
    <section
      aria-label={`About ${category.name}`}
      className="mb-12 bg-[#f1e9da] px-4 pt-10 pb-14 md:mb-[72px] md:px-8 md:pt-16 md:pb-24"
    >
      <div className="mx-auto flex max-w-[1320px] flex-col gap-14 md:gap-20">
        {content.length > 0 ? (
          <div className="flex flex-wrap gap-x-16 gap-y-6">
            <div className="flex flex-[1_1_340px] flex-col gap-3">
              <Eyebrow>{siteConfig.name} guide</Eyebrow>
              <h2 id="category-about-title" className={heading}>
                About {category.name}
              </h2>
            </div>
            <article
              aria-labelledby="category-about-title"
              className="flex flex-[2_1_560px] flex-col gap-5 text-[17px] leading-[1.7] text-[#3f4a40] [&_a]:font-semibold [&_a]:text-forest-600 [&_a]:underline [&_strong]:text-[#0f2a1a]"
            >
              {content.map((paragraph, i) => (
                <RichParagraph key={i} text={paragraph} />
              ))}
            </article>
          </div>
        ) : null}

        {faqs.length > 0 ? (
          <div className="flex flex-wrap gap-x-16 gap-y-7">
            <div className="flex flex-[1_1_340px] flex-col gap-3">
              <Eyebrow>FAQ</Eyebrow>
              <h2 className={heading}>{category.name}: common questions</h2>
            </div>
            <div className="flex-[2_1_560px]">
              <FaqList items={faqs} name="category-faq" />
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
