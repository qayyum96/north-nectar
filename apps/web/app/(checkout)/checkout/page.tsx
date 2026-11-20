import Link from "next/link";
import { checkoutContent } from "@/content/checkout";
import { CheckoutForm } from "@/features/checkout/checkout-form";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata = buildMetadata({
  title: checkoutContent.meta.title,
  description: checkoutContent.meta.description,
  path: "/checkout",
  noIndex: true,
});

/** Guest checkout. Static shell; the form works from the cart saved in the browser. */
export default function CheckoutPage() {
  const copy = checkoutContent;
  return (
    <div className="px-4 pt-[22px] pb-12 md:px-8 md:pt-9 md:pb-20">
      <div className="mx-auto flex max-w-[1240px] flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-[14px]">
          <div className="flex flex-col gap-[6px]">
            <Link
              href="/cart"
              className="text-[15px] leading-[1.5] font-bold text-[#1f6b3a] hover:underline"
            >
              {copy.backToCart}
            </Link>
            <h1
              data-rv="mask"
              className="m-0 font-display text-[48px] leading-[0.98] font-bold text-[#0f2a1a] uppercase md:text-[72px]"
            >
              {copy.title}
            </h1>
          </div>
          <ol
            aria-label="Progress"
            className="m-0 flex list-none items-center gap-[10px] p-0 text-[14px] leading-[1.5] font-bold"
          >
            <li className="inline-flex items-center gap-[6px] text-[#1f6b3a]">
              <span className="inline-flex size-6 items-center justify-center rounded-full bg-[#1f6b3a] text-white">
                <svg
                  aria-hidden="true"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12l4 4 10-10" />
                </svg>
              </span>
              {copy.steps[0]}
              <span className="sr-only"> (done)</span>
            </li>
            <li aria-hidden="true" className="h-[2px] w-6 bg-[#cdbf9f]" />
            <li aria-current="step" className="inline-flex items-center gap-[6px] text-[#0f2a1a]">
              <span className="inline-flex size-6 items-center justify-center rounded-full bg-[#0f2a1a] text-white">
                2
              </span>
              {copy.steps[1]}
            </li>
            <li aria-hidden="true" className="h-[2px] w-6 bg-[#cdbf9f]" />
            <li className="inline-flex items-center gap-[6px] text-[#736c5a]">
              <span className="inline-flex size-6 items-center justify-center rounded-full border-2 border-[#cdbf9f]">
                3
              </span>
              {copy.steps[2]}
            </li>
          </ol>
        </div>
        <CheckoutForm />
      </div>
    </div>
  );
}
