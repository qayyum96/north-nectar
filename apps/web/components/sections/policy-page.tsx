import { IntentLink as Link } from "@/components/ui/intent-link";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import type { PolicyDocument } from "@/content/policies";
import { policies } from "@/content/policies";
import { buildMetadata } from "@/lib/seo/metadata";

/** Metadata for a policy page: noindex while the text is still a draft. */
export function policyMetadata(policy: PolicyDocument) {
  return buildMetadata({
    title: policy.title,
    description: policy.metaDescription,
    path: policy.path,
    noIndex: policy.status === "draft",
  });
}

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(
    new Date(`${iso}T12:00:00Z`),
  );

/**
 * Shared layout for Privacy, Terms, Refund and Shipping. Follows the inner-page header from the
 * mockup (cart and contact) with a readable single column for the text.
 */
export function PolicyPage({ policy }: { policy: PolicyDocument }) {
  const others = policies.filter((p) => p.path !== policy.path);
  return (
    <>
      <section aria-labelledby="policy-title" className="border-b border-[#ece4d3] bg-[#faf7f0]">
        <div className="mx-auto flex max-w-[1384px] flex-col gap-3 px-4 pt-[22px] pb-[26px] md:px-8 md:py-9">
          <Breadcrumbs items={[{ name: policy.shortTitle, path: policy.path }]} />
          <h1
            id="policy-title"
            data-rv="mask"
            className="m-0 max-w-[16ch] font-display text-[44px] leading-[0.95] font-bold text-[#0f2a1a] uppercase md:text-[80px]"
          >
            {policy.title}
          </h1>
          <p className="m-0 text-[15px] leading-[1.5] text-[#6a665a]">
            Last updated {formatDate(policy.lastUpdated)}
          </p>
        </div>
      </section>

      <section aria-label={policy.title} className="px-4 pt-8 pb-14 md:px-8 md:pt-12 md:pb-24">
        <div className="mx-auto flex max-w-[1320px] flex-wrap items-start gap-x-16 gap-y-10">
          <article className="flex min-w-0 flex-[2_1_560px] flex-col gap-8">
            {policy.status === "draft" ? (
              <p
                role="note"
                className="m-0 rounded-[14px] border border-[#f2d7a8] bg-[#fff6e8] px-[18px] py-[14px] text-[15px] leading-[1.6] text-[#6b3f10]"
              >
                <strong>Draft.</strong> This policy is being finalised and may change before it
                takes effect. For any question, please contact us.
              </p>
            ) : null}
            <p className="m-0 text-[19px] leading-[1.65] text-[#1f2a21]">{policy.intro}</p>
            {policy.sections.map((section) => (
              <section key={section.heading} className="flex flex-col gap-3">
                <h2 className="m-0 font-display text-[24px] leading-[1.3] font-bold text-[#0f2a1a] uppercase md:text-[28px]">
                  {section.heading}
                </h2>
                {section.paragraphs?.map((p) => (
                  <p key={p} className="m-0 text-[17px] leading-[1.7] text-[#3f4a40]">
                    {p}
                  </p>
                ))}
                {section.list ? (
                  <ul className="m-0 flex list-disc flex-col gap-2 pl-6 text-[17px] leading-[1.7] text-[#3f4a40] marker:text-[#2f7d45]">
                    {section.list.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
          </article>

          <aside
            aria-label="Other policies"
            className="flex min-w-0 flex-[1_1_280px] flex-col gap-3 rounded-[22px] border border-[#e8dfcc] bg-white p-[26px] md:sticky md:top-[150px]"
          >
            <h2 className="m-0 font-display text-[22px] leading-[1.5] font-bold text-[#0f2a1a] uppercase">
              Store policies
            </h2>
            <ul className="m-0 flex list-none flex-col gap-1 p-0">
              {others.map((p) => (
                <li key={p.path}>
                  <Link
                    href={p.path}
                    className="flex min-h-11 items-center text-[16px] font-semibold text-[#1f6b3a] hover:underline"
                  >
                    {p.title}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/contact"
                  className="flex min-h-11 items-center text-[16px] font-semibold text-[#1f6b3a] hover:underline"
                >
                  Contact us
                </Link>
              </li>
            </ul>
          </aside>
        </div>
      </section>
    </>
  );
}
