import { cn, formatPkr } from "@northnectar/ui";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { FloatingLeaf } from "@/components/decor/floating-leaf";
import { confirmationContent } from "@/content/checkout";
import { readLastOrder } from "@/features/checkout/order-cookie";
import type { PlacedOrder } from "@/features/checkout/order-summary";
import { maskMobile } from "@/lib/commerce/phone";
import { images } from "@/lib/images";
import { siteConfig } from "@/lib/seo/config";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata = buildMetadata({
  title: confirmationContent.meta.title,
  description: confirmationContent.meta.description,
  path: "/order-confirmation",
  noIndex: true,
});

const copy = confirmationContent;

/** "today", or "on 20 Nov" when the confirmation is opened on a later day (Pakistan time). */
function placedWhen(createdAt: string): string {
  const day = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" }).format(d);
  const placed = new Date(createdAt);
  if (day(placed) === day(new Date())) return "today";
  return `on ${new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Karachi", day: "numeric", month: "short" }).format(placed)}`;
}

/** Order confirmation, read from the cookie set when the order was placed (mockup values). */
export default async function OrderConfirmationPage() {
  const order = await readLastOrder();
  return (
    <>
      <Hero order={order} />
      {order ? <OrderDetails order={order} /> : <Missing />}
    </>
  );
}

function Hero({ order }: { order: PlacedOrder | null }) {
  const firstName = order?.fullName.split(/\s+/)[0] ?? "";
  const when = order ? placedWhen(order.createdAt) : "";
  return (
    <section
      aria-labelledby="confirmation-title"
      className="on-dark relative overflow-hidden bg-[radial-gradient(at_50%_0%,#22573a_0%,#12321f_50%,#0b2114_100%)] text-white"
    >
      <Image
        src={images.decor.mountainsCream.src}
        width={images.decor.mountainsCream.width}
        height={images.decor.mountainsCream.height}
        alt=""
        aria-hidden="true"
        unoptimized
        className="pointer-events-none absolute -bottom-6 left-1/2 h-auto w-[800px] max-w-none -translate-x-1/2 opacity-[0.12] md:w-[1500px]"
      />
      <FloatingLeaf
        image={images.decor.leaf2}
        rotate={-26}
        duration={3.4}
        width={100}
        className="top-10 -left-5 w-[60px] md:left-[8%] md:w-[100px]"
        imageClassName="drop-shadow-[0_14px_16px_rgba(0,0,0,0.4)]"
      />
      <FloatingLeaf
        image={images.decor.leaf3}
        rotate={20}
        duration={4.1}
        delay={-0.5}
        width={150}
        className="top-[90px] -right-5 w-[90px] md:right-[8%] md:w-[150px]"
        imageClassName="drop-shadow-[0_14px_16px_rgba(0,0,0,0.4)]"
      />
      <div className="relative mx-auto flex max-w-[924px] flex-col items-center gap-[18px] px-5 pt-12 pb-14 text-center md:px-8 md:pt-[72px] md:pb-[88px]">
        <svg aria-hidden="true" viewBox="0 0 96 96" className="size-[76px] md:size-24">
          <circle
            cx="48"
            cy="48"
            r="44"
            fill="none"
            stroke="#9ed7a6"
            strokeWidth="4"
            pathLength={1}
            strokeDasharray="1"
            className="animate-draw [animation-delay:200ms]"
          />
          <path
            d="M28 49l13 13 27-29"
            fill="none"
            stroke="#ffffff"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            strokeDasharray="1"
            className="animate-draw [animation-delay:700ms]"
          />
        </svg>
        {order ? (
          <>
            <p className="m-0 text-[14px] leading-[1.5] font-bold tracking-[0.14em] text-[#9ed7a6] uppercase">
              {copy.eyebrow(order.number, when)}
            </p>
            <h1
              id="confirmation-title"
              data-rv="mask"
              className="m-0 font-display text-[48px] leading-[0.96] font-bold uppercase md:text-[88px]"
            >
              {copy.title(firstName)}
            </h1>
            <p className="m-0 max-w-[600px] text-[17px] leading-[1.6] text-[#c9d3c4] md:text-[19px]">
              {copy.lead.receipt}
              <strong className="text-white">{order.email}</strong>
              {order.whatsappUpdates ? (
                <>
                  {copy.lead.updates}
                  <strong className="text-white">{maskMobile(order.phone)}</strong>
                  {copy.lead.end}
                </>
              ) : (
                <>
                  {copy.lead.updatesNo}
                  <strong className="text-white">{maskMobile(order.phone)}</strong>
                  {copy.lead.updatesNoAfter}
                </>
              )}
            </p>
          </>
        ) : (
          <>
            <h1
              id="confirmation-title"
              className="m-0 font-display text-[40px] leading-[0.96] font-bold uppercase md:text-[64px]"
            >
              {copy.missing.title}
            </h1>
            <p className="m-0 max-w-[600px] text-[17px] leading-[1.6] text-[#c9d3c4]">
              {copy.missing.text}
            </p>
          </>
        )}
      </div>
    </section>
  );
}

const eyebrow = "m-0 text-[14px] leading-[1.5] font-bold tracking-[0.1em] uppercase";

function InfoCard({
  title,
  tone = "light",
  children,
}: {
  title: string;
  tone?: "light" | "warm";
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-[20px] border p-[22px]",
        tone === "warm" ? "border-[#f2d7a8] bg-[#fff6e8]" : "border-[#e8dfcc] bg-white",
      )}
    >
      <h3 className={cn(eyebrow, tone === "warm" ? "text-[#8a4513]" : "text-[#1f7a3f]")}>
        {title}
      </h3>
      <p className="m-0 text-[16px] leading-[1.6]">{children}</p>
    </div>
  );
}

function Rich({ text }: { text: { before: string; strong: string; after: string } }) {
  return (
    <>
      {text.before}
      <strong>{text.strong}</strong>
      {text.after}
    </>
  );
}

function OrderDetails({ order }: { order: PlacedOrder }) {
  const total = formatPkr(order.totals.total);
  const steps = copy.track.steps(order.eta);
  const paymentText =
    order.paymentMethodId === "bank_transfer"
      ? copy.cards.bankText(total)
      : order.paymentMethodId === "mobile_wallet"
        ? copy.cards.walletText(total, order.walletLabel ?? "wallet")
        : copy.cards.codText(total);

  return (
    <section aria-label="Order details" className="px-4 pt-8 pb-14 md:px-8 md:pt-12 md:pb-24">
      <div className="mx-auto flex max-w-[1120px] flex-col gap-[22px]">
        <div
          data-rv="fade"
          className="flex flex-col gap-[22px] rounded-[24px] border border-[#e8dfcc] bg-white px-[18px] py-[22px] md:p-[30px]"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="m-0 font-display text-[26px] leading-[1.5] font-bold text-[#0f2a1a] uppercase">
              {copy.track.title}
            </h2>
            <p className="m-0 text-[15px] leading-[1.5] text-[#4d4a40]">
              {copy.track.estimate}
              <strong className="text-[#0f2a1a]">{order.eta}</strong>
            </p>
          </div>
          <ol className="m-0 grid list-none grid-cols-2 gap-4 p-0 md:grid-cols-4">
            {steps.map((step, index) => {
              const done = index === 0;
              return (
                <li key={step.title} className="flex flex-col gap-[10px]">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "block h-[6px] rounded-full",
                      done ? "bg-[#2f7d45]" : "bg-[#e3d8bf]",
                    )}
                  />
                  <span
                    className={cn(
                      "inline-flex items-center gap-2 text-[16px] leading-[1.5] font-bold",
                      done ? "text-[#0f2a1a]" : "text-[#4d4a40]",
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "inline-flex size-6 shrink-0 items-center justify-center rounded-full text-[14px] text-white",
                        done ? "bg-[#2f7d45]" : "bg-[#cdbf9f]",
                      )}
                    >
                      {done ? "✓" : index + 1}
                    </span>
                    {step.title}
                    {done ? <span className="sr-only"> (done)</span> : null}
                  </span>
                  <span className="text-[14px] leading-[1.5] text-[#6a665a]">
                    {index === 0 && placedWhen(order.createdAt) !== "today"
                      ? placedWhen(order.createdAt).replace(/^on /, "")
                      : step.text}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>

        <div data-rv="rise" className="grid gap-4 md:grid-cols-3">
          <InfoCard title={copy.cards.address}>
            {order.fullName}
            {order.addressLines.map((line) => (
              <span key={line}>
                <br />
                {line}
              </span>
            ))}
          </InfoCard>
          <InfoCard title={copy.cards.payment} tone="warm">
            <strong>{order.paymentLabel}</strong>
            <br />
            <Rich text={paymentText} />
          </InfoCard>
          <InfoCard title={copy.cards.delivery}>
            <strong>{order.deliveryLabel}</strong>
            <br />
            {copy.cards.deliveryText(order.deliveryMethodId)}
          </InfoCard>
        </div>

        <div className="flex flex-col gap-4 rounded-[24px] border border-[#e8dfcc] bg-white px-[18px] py-[22px] md:p-[30px]">
          <h2 className="m-0 font-display text-[26px] leading-[1.5] font-bold text-[#0f2a1a] uppercase">
            {copy.order.title}
          </h2>
          <ul className="m-0 flex list-none flex-col gap-4 p-0">
            {order.lines.map((line) => (
              <li
                key={`${line.name}-${line.label}`}
                className="flex items-center gap-[14px] border-b border-[#f0e9da] pb-[14px]"
              >
                <span className="relative size-[66px] shrink-0 overflow-hidden rounded-[12px] border border-[#ece4d3] bg-white">
                  {line.image ? (
                    <Image src={line.image} alt="" fill sizes="64px" className="object-contain" />
                  ) : null}
                </span>
                <span className="flex flex-1 flex-col leading-[1.3]">
                  <span className="text-[16px] font-bold">{line.name}</span>
                  <span className="text-[14px] text-[#6a665a]">
                    {copy.order.qty(line.label, line.quantity)}
                  </span>
                </span>
                <span className="text-[16px] leading-[1.5] font-bold">
                  {formatPkr(line.lineTotal)}
                </span>
              </li>
            ))}
          </ul>
          <dl className="m-0 flex w-full max-w-[360px] flex-col gap-2 self-end text-[16px] leading-[1.5]">
            <TotalRow label={copy.order.subtotal} value={formatPkr(order.totals.subtotal)} />
            {order.totals.discount > 0 ? (
              <TotalRow
                label={copy.order.discount}
                value={`−${formatPkr(order.totals.discount)}`}
              />
            ) : null}
            <TotalRow
              label={copy.order.delivery}
              value={
                order.totals.delivery === 0 ? copy.order.free : formatPkr(order.totals.delivery)
              }
            />
            {order.totals.paymentFee > 0 ? (
              <TotalRow label={copy.order.paymentFee} value={formatPkr(order.totals.paymentFee)} />
            ) : null}
            <div className="flex items-baseline justify-between border-t border-[#ece4d3] pt-[10px]">
              <dt className="font-bold">{copy.order.total}</dt>
              <dd className="m-0 font-display text-[28px] leading-[1.5] font-bold uppercase">
                {total}
              </dd>
            </div>
          </dl>
        </div>

        <Actions />
      </div>
    </section>
  );
}

function TotalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt>{label}</dt>
      <dd className="m-0 font-bold">{value}</dd>
    </div>
  );
}

function Actions() {
  return (
    <div className="flex flex-wrap justify-center gap-3 pt-[6px]">
      <Link
        href="/shop"
        className="inline-flex h-[58px] items-center rounded-full bg-forest-600 px-8 font-display text-[18px] font-semibold tracking-[0.04em] text-white uppercase hover:bg-forest-700"
      >
        {copy.actions.shop}
      </Link>
      <a
        href={siteConfig.contact.whatsappUrl}
        className="inline-flex h-[58px] items-center rounded-full bg-[#f4a12e] px-7 font-display text-[18px] font-semibold tracking-[0.04em] text-[#1b1a12] uppercase hover:bg-orange-600"
      >
        {copy.actions.whatsapp}
      </a>
    </div>
  );
}

function Missing() {
  return (
    <section aria-label="Next steps" className="px-4 pt-8 pb-14 md:px-8 md:pt-12 md:pb-24">
      <Actions />
    </section>
  );
}
