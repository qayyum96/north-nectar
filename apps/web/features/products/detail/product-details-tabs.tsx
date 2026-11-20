import type { Product } from "@northnectar/types";
import { Tabs, type TabItem, RichParagraph } from "@northnectar/ui";
import Image from "next/image";

/**
 * Product detail tabs (mockup: Oswald 20px underline tabs, 40px apart). Each panel's markup and
 * spacing follow the mockup; tabs without content for a product are left out.
 */
export function ProductDetailsTabs({
  product,
  shippingReturns,
}: {
  product: Product;
  shippingReturns: { title: string; text: string }[];
}) {
  const items: TabItem[] = [];

  items.push({
    id: "description",
    label: "Description",
    content: (
      <div className="mt-7 flex flex-wrap items-center gap-x-16 gap-y-8">
        <h2 className="sr-only">Description</h2>
        <div className="flex flex-[1_1_460px] flex-col gap-4 text-[17px] leading-[1.75] text-[#3f4a40]">
          {product.description.slice(1).length > 0
            ? product.description.slice(1).map((p) => <RichParagraph key={p} text={p} />)
            : product.description.map((p) => <RichParagraph key={p} text={p} />)}
        </div>
        {product.illustration ? (
          <div className="flex flex-[1_1_360px] justify-center">
            <Image
              src={product.illustration.src}
              width={product.illustration.width}
              height={product.illustration.height}
              alt={product.illustration.alt}
              unoptimized
              data-rv="fade"
              className="h-auto w-full max-w-[360px]"
            />
          </div>
        ) : null}
      </div>
    ),
  });

  if (product.waysToEnjoy.length > 0) {
    items.push({
      id: "ways",
      label: "Ways to enjoy",
      content: (
        <div className="mt-7">
          <h2 className="sr-only">Ways to enjoy</h2>
          <ol className="m-0 grid list-none grid-cols-2 gap-4 p-0 md:grid-cols-4">
            {product.waysToEnjoy.map((way, i) => (
              <li
                key={way}
                className="flex flex-col gap-[10px] rounded-[18px] border border-[#e8dfcc] bg-white p-[22px]"
              >
                <span className="font-display text-[32px] leading-none font-bold text-[#d1ae6c] uppercase">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-[16px] leading-6 font-bold">{way}</span>
              </li>
            ))}
          </ol>
        </div>
      ),
    });
  }

  if (product.howToUse.length > 0) {
    items.push({
      id: "use",
      label: "How to use",
      content: (
        <div className="mt-7">
          <h2 className="sr-only">How to use</h2>
          <ol className="m-0 grid list-none grid-cols-2 gap-4 p-0 md:grid-cols-4">
            {product.howToUse.map((step, i) => (
              <li
                key={step.title}
                className="on-dark flex flex-col gap-[10px] rounded-[18px] bg-[#0f2a1a] p-6 text-white"
              >
                <span className="font-display text-[15px] leading-[23px] font-semibold tracking-[0.1em] text-[#9ed7a6] uppercase">
                  Step {i + 1}
                </span>
                <span className="font-display text-[24px] leading-[1.1] font-semibold uppercase">
                  {step.title}
                </span>
                <span className="text-[15px] leading-[23px] text-[#c9d3c4]">
                  {step.description}
                </span>
              </li>
            ))}
          </ol>
        </div>
      ),
    });
  }

  if (product.attributes.length > 0) {
    items.push({
      id: "info",
      label: "Product info",
      content: (
        <div className="mt-7">
          <h2 className="sr-only">Product info</h2>
          <dl className="m-0 max-w-[760px] overflow-hidden rounded-[18px] border border-[#e8dfcc] bg-white">
            {product.attributes.map((attr) => (
              <div
                key={attr.label}
                className="grid grid-cols-[130px_1fr] border-b border-[#f0e9da] last:border-b-0 md:grid-cols-[220px_1fr]"
              >
                <dt className="bg-[#faf6ec] px-[18px] py-[14px] text-[15px] leading-[23px] font-bold text-[#1f4a2f]">
                  {attr.label}
                </dt>
                <dd className="m-0 px-[18px] py-[14px] text-[15px] leading-[23px] text-[#3f4a40]">
                  {attr.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ),
    });
  }

  items.push({
    id: "shipping",
    label: "Shipping & returns",
    content: (
      <div className="mt-7">
        <h2 className="sr-only">Shipping and returns</h2>
        <ul className="m-0 grid list-none gap-4 p-0 md:grid-cols-3">
          {shippingReturns.map((item) => (
            <li
              key={item.title}
              className="flex flex-col gap-2 rounded-[18px] border border-[#e8dfcc] bg-white p-[22px]"
            >
              <span className="font-display text-[20px] leading-[30px] font-semibold text-[#0f2a1a] uppercase">
                {item.title}
              </span>
              <span className="text-[15px] leading-[1.6] text-[#4d4a40]">{item.text}</span>
            </li>
          ))}
        </ul>
      </div>
    ),
  });

  return <Tabs variant="underline" label="Product details" items={items} />;
}
