import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/icon";
import { Card, CardHeader, PageBody, PageHeader, StatusBadge } from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import {
  dateTimeLabel,
  eventTime,
  firstName,
  formatPhone,
  formatPkr,
  imageSrc,
  monthLabel,
  plural,
  whatsappLink,
} from "@/lib/format";
import {
  addressLines,
  type OrderDetail,
  type OrderEvent,
  loadOrder,
  whatsappText,
} from "@/lib/orders";
import {
  DeliveryCard,
  InternalNotes,
  OrderHeaderActions,
  PaymentCard,
  TagsCard,
  TimelineNoteForm,
  WhatsappLink,
} from "./order-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ number: string }>;
}): Promise<Metadata> {
  const { number } = await params;
  return { title: `Order #${number.toUpperCase()}` };
}

const G = "#234c2e";

/** Timeline dot colours follow the status badge colours. */
function dotColours(e: OrderEvent): [string, string] {
  const m = e.message.toLowerCase();
  if (e.type === "system") return [G, "#e3ece4"];
  if (e.type === "status") {
    if (m.includes("confirmed by")) return ["#1f5fae", "#e3eefc"];
    if (m.includes("shipped")) return ["#6a3fb5", "#efe7fb"];
    if (m.includes("delivered")) return ["#1d6b3a", "#e3f4e8"];
    if (m.includes("returned")) return ["#9b2c22", "#fde8e6"];
    if (m.includes("cancelled")) return ["#555555", "#ececea"];
  }
  if (e.type === "payment" && m.includes("paid") && !m.includes("unpaid"))
    return ["#1d6b3a", "#e3f4e8"];
  return ["#a3a3a3", "#efefed"];
}

function paymentNote(o: OrderDetail): string {
  const amount = formatPkr(o.total);
  if (o.payment_status === "paid") return `${amount} received`;
  if (o.payment_status === "refunded") return `${amount} refunded to the customer`;
  if (o.fulfilment_status === "cancelled") return "Order cancelled, nothing to collect";
  if (o.payment_method_id === "cod") return `${amount} to collect from the customer on delivery`;
  if (o.payment_method_id === "bank_transfer") return `Waiting for a bank transfer of ${amount}`;
  if (o.payment_method_id === "mobile_wallet") {
    const d = o.payment_details as { walletLabel?: string; walletNumber?: string } | null;
    return `Waiting for ${amount} by ${d?.walletLabel ?? "mobile wallet"}${d?.walletNumber ? ` from ${formatPhone(d.walletNumber)}` : ""}`;
  }
  return `${amount} not paid yet`;
}

export default async function OrderPage({ params }: { params: Promise<{ number: string }> }) {
  await requireStaff();
  const { number } = await params;
  const o = await loadOrder(number);
  if (!o) notFound();

  const name = o.shipping_address?.fullName?.trim() || "Customer";
  const units = o.lines.reduce((s, l) => s + l.quantity, 0);
  const wa = whatsappLink(o.phone, whatsappText("general", { ...o, name }));
  const method =
    o.payment_method_id === "mobile_wallet"
      ? ((o.payment_details as { walletLabel?: string } | null)?.walletLabel ?? o.payment_label)
      : o.payment_label;
  const delivery = [o.delivery_label.replace(/ delivery$/i, ""), o.shipping_address?.city]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Orders", href: "/orders" }, { label: `#${o.number}` }]}
        title={`#${o.number}`}
        badge={
          <>
            <StatusBadge status={o.payment_status} />
            <StatusBadge status={o.fulfilment_status} />
          </>
        }
        subtitle={`${dateTimeLabel(o.created_at)} · ${o.source === "admin" ? "created in the admin" : "from Online store"}`}
        actions={
          <OrderHeaderActions
            order={{ id: o.id, number: o.number, units, customerFirstName: firstName(name) }}
            status={o.fulfilment_status}
            paid={o.payment_status === "paid"}
          />
        }
      />
      <PageBody>
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex min-w-0 flex-[2_1_560px] flex-col gap-4">
            <Card>
              <CardHeader title="Items" action={<StatusBadge status={o.fulfilment_status} />} />
              {o.lines.map((l) => {
                const src = imageSrc(l.image);
                return (
                  <div
                    key={l.id}
                    className="border-admin-line-soft flex items-center gap-[14px] border-t py-3"
                  >
                    {src ? (
                      <Image
                        src={src}
                        alt=""
                        width={52}
                        height={52}
                        className="border-admin-line size-[54px] shrink-0 rounded-[10px] border object-cover"
                      />
                    ) : (
                      <span className="border-admin-line bg-admin-bg grid size-[54px] shrink-0 place-items-center rounded-[10px] border text-[#a3a3a3]">
                        <Icon name="image" size={20} />
                      </span>
                    )}
                    <span className="flex min-w-0 flex-1 flex-col">
                      {l.product_id ? (
                        <Link
                          href={`/products/${l.product_id}`}
                          className="font-semibold hover:underline"
                        >
                          {l.name}
                        </Link>
                      ) : (
                        <span className="font-semibold">{l.name}</span>
                      )}
                      <span className="text-admin-muted text-[14px]">
                        {l.variant_label} · SKU {l.sku}
                      </span>
                      <span className="text-admin-muted text-[14px] md:hidden">
                        {formatPkr(l.unit_price)} × {l.quantity}
                      </span>
                    </span>
                    <span className="text-admin-muted hidden whitespace-nowrap md:block">
                      {formatPkr(l.unit_price)} × {l.quantity}
                    </span>
                    <span className="shrink-0 text-right font-semibold whitespace-nowrap">
                      {formatPkr(l.line_total)}
                    </span>
                  </div>
                );
              })}
              <div className="border-admin-line flex flex-col gap-2 border-t pt-[14px]">
                <div className="flex justify-between gap-3">
                  <span className="text-admin-muted">Subtotal · {plural(units, "item")}</span>
                  <span>{formatPkr(o.subtotal)}</span>
                </div>
                {o.discount > 0 ? (
                  <div className="flex justify-between gap-3">
                    <span className="text-admin-muted">
                      Discount{o.discount_code ? ` · ${o.discount_code}` : ""}
                    </span>
                    <span>−{formatPkr(o.discount)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between gap-3">
                  <span className="text-admin-muted">Shipping · {delivery}</span>
                  <span>{o.delivery_fee === 0 ? "Free" : formatPkr(o.delivery_fee)}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-admin-muted">{o.payment_label} fee</span>
                  <span>{formatPkr(o.payment_fee)}</span>
                </div>
                <div className="border-admin-line-soft flex justify-between border-t pt-2 text-[15px] font-bold">
                  <span>Total</span>
                  <span>{formatPkr(o.total)}</span>
                </div>
              </div>
            </Card>

            <PaymentCard
              orderId={o.id}
              status={o.payment_status}
              method={method}
              note={paymentNote(o)}
              fulfilment={o.fulfilment_status}
            />

            {o.fulfilment_status === "cancelled" ? (
              <Card>
                <CardHeader title="Cancelled" />
                <p className="text-admin-muted m-0">
                  {o.cancel_reason ? `Reason: ${o.cancel_reason}. ` : ""}Reserved stock was
                  released.
                </p>
              </Card>
            ) : (
              <DeliveryCard
                orderId={o.id}
                courier={o.courier ?? ""}
                tracking={o.tracking_number ?? ""}
                shipped={["shipped", "delivered", "returned"].includes(o.fulfilment_status)}
              />
            )}

            <Card>
              <CardHeader title="Timeline" />
              <TimelineNoteForm orderId={o.id} />
              <ol className="m-0 flex list-none flex-col p-0">
                {o.events.map((e) => {
                  const [dot, ring] = dotColours(e);
                  return (
                    <li key={e.id} className="relative flex gap-3 pb-4">
                      <span
                        aria-hidden="true"
                        className="mt-1 size-3 shrink-0 rounded-full"
                        style={{ background: dot, boxShadow: `0 0 0 4px ${ring}` }}
                      />
                      <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
                        <span className="font-semibold">{e.message}</span>
                        {e.detail ? (
                          <span className="text-admin-muted text-[14px] break-words whitespace-pre-line">
                            {e.detail}
                          </span>
                        ) : null}
                      </span>
                      <span className="text-admin-muted text-[14px] whitespace-nowrap">
                        {eventTime(e.created_at)}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </Card>
          </div>

          <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-4">
            <Card>
              <CardHeader title="Customer" />
              <div className="border-admin-line-soft flex flex-col gap-1 border-b pb-[14px]">
                {o.customer ? (
                  <Link
                    href={`/customers/${o.customer.id}`}
                    className="self-start font-bold text-forest-600 hover:underline"
                  >
                    {o.customer.name}
                  </Link>
                ) : (
                  <span className="font-bold">{name}</span>
                )}
                {o.customer ? (
                  <span className="text-admin-muted text-[14px]">
                    {plural(o.customer.orders_count, "order")} · customer since{" "}
                    {monthLabel(o.customer.created_at)}
                  </span>
                ) : null}
              </div>
              <div className="border-admin-line-soft flex flex-col gap-1 border-b py-[14px]">
                <span className="text-[14px] font-semibold">Contact</span>
                {o.email ? <span className="break-all">{o.email}</span> : null}
                <span>{formatPhone(o.phone)}</span>
                {wa ? (
                  <WhatsappLink
                    orderId={o.id}
                    href={wa}
                    className="inline-flex items-center gap-[6px] self-start font-semibold text-forest-600 hover:underline"
                  >
                    <Icon name="whatsapp" size={16} />
                    Message on WhatsApp
                  </WhatsappLink>
                ) : null}
                {o.whatsapp_updates ? null : (
                  <span className="text-admin-muted text-[14px]">
                    Did not ask for WhatsApp updates
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-1 pt-[14px]">
                <span className="text-[14px] font-semibold">Shipping address</span>
                <span className="leading-[1.6]">
                  {[name, ...addressLines(o.shipping_address)].map((line, i) => (
                    <span key={`${line}-${i}`} className="block">
                      {line}
                    </span>
                  ))}
                </span>
              </div>
            </Card>
            <InternalNotes orderId={o.id} initial={o.internal_notes} />
            <TagsCard orderId={o.id} initial={o.tags} />
          </div>
        </div>
      </PageBody>
    </>
  );
}
