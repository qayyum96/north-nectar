import type { Metadata } from "next";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { getCurrentStaff } from "@/lib/auth";
import { dateLabel, formatPhone, formatPkr } from "@/lib/format";
import { addressLines, label, loadOrder, paymentShort } from "@/lib/orders";
import { getStoreInfo } from "@/lib/store";
import { PrintBar } from "./print-bar";

export const metadata: Metadata = { title: "Invoices" };
export const dynamic = "force-dynamic";

/** Printable invoices: /print/orders?numbers=NN1001,NN1002 (one per page). */
export default async function PrintOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ numbers?: string }>;
}) {
  if (!(await getCurrentStaff())) redirect("/login");
  const { numbers = "" } = await searchParams;
  const list = [
    ...new Set(
      numbers
        .split(",")
        .map((n) => n.trim().toUpperCase())
        .filter((n) => /^NN\d{1,9}$/.test(n)),
    ),
  ].slice(0, 100);
  if (list.length === 0) notFound();
  const [loaded, STORE] = await Promise.all([
    Promise.all(list.map((n) => loadOrder(n))),
    getStoreInfo(),
  ]);
  const orders = loaded.filter((o) => o !== null);
  if (orders.length === 0) notFound();

  return (
    <div className="min-h-screen bg-[#f1f1ef] py-6 print:bg-white print:py-0">
      <PrintBar count={orders.length} />
      {orders.map((o) => {
        const name = o.shipping_address?.fullName ?? "Customer";
        return (
          <article
            key={o.id}
            className="mx-auto mb-6 box-border w-[210mm] max-w-full break-after-page bg-white p-[14mm] text-[13px] leading-[1.5] text-[#1f1f1f] shadow-[0_1px_3px_rgba(0,0,0,0.08)] print:mb-0 print:shadow-none"
          >
            <header className="flex items-start justify-between gap-6 border-b border-[#e3e3e3] pb-5">
              <div className="flex items-center gap-3">
                <Image
                  src="/images/emblem-green.svg"
                  alt=""
                  width={64}
                  height={28}
                  className="h-7 w-auto"
                />
                <div>
                  <div className="text-[17px] font-bold">{STORE.name}</div>
                  <div className="text-[#616161]">{STORE.website}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[20px] font-bold tracking-[-0.01em]">Invoice</div>
                <div className="font-semibold">#{o.number}</div>
                <div className="text-[#616161]">{dateLabel(o.created_at)}</div>
              </div>
            </header>

            <section className="grid grid-cols-2 gap-6 py-5">
              <div>
                <div className="mb-1 text-[11px] font-semibold tracking-[0.06em] text-[#6b6b68] uppercase">
                  Deliver to
                </div>
                <div className="font-semibold">{name}</div>
                {addressLines(o.shipping_address).map((l) => (
                  <div key={l}>{l}</div>
                ))}
                <div>{formatPhone(o.phone)}</div>
                {o.email ? <div>{o.email}</div> : null}
              </div>
              <div>
                <div className="mb-1 text-[11px] font-semibold tracking-[0.06em] text-[#6b6b68] uppercase">
                  From
                </div>
                <div className="font-semibold">{STORE.name}</div>
                <div>{STORE.address}</div>
                <div>{STORE.phone}</div>
                <div>{STORE.email}</div>
              </div>
            </section>

            <table className="w-full border-collapse">
              <thead>
                <tr className="text-left text-[11px] tracking-[0.06em] text-[#6b6b68] uppercase">
                  <th className="border-b border-[#e3e3e3] py-2 font-semibold">Item</th>
                  <th className="border-b border-[#e3e3e3] py-2 font-semibold">SKU</th>
                  <th className="border-b border-[#e3e3e3] py-2 text-right font-semibold">Price</th>
                  <th className="border-b border-[#e3e3e3] py-2 text-right font-semibold">Qty</th>
                  <th className="border-b border-[#e3e3e3] py-2 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {o.lines.map((l) => (
                  <tr key={l.id}>
                    <td className="border-b border-[#f0f0ee] py-2">
                      {l.name} · {l.variant_label}
                    </td>
                    <td className="border-b border-[#f0f0ee] py-2 text-[#616161]">{l.sku}</td>
                    <td className="border-b border-[#f0f0ee] py-2 text-right">
                      {formatPkr(l.unit_price)}
                    </td>
                    <td className="border-b border-[#f0f0ee] py-2 text-right">{l.quantity}</td>
                    <td className="border-b border-[#f0f0ee] py-2 text-right">
                      {formatPkr(l.line_total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="ml-auto flex w-[260px] flex-col gap-1 pt-4">
              <div className="flex justify-between">
                <span className="text-[#616161]">Subtotal</span>
                <span>{formatPkr(o.subtotal)}</span>
              </div>
              {o.discount > 0 ? (
                <div className="flex justify-between">
                  <span className="text-[#616161]">Discount</span>
                  <span>−{formatPkr(o.discount)}</span>
                </div>
              ) : null}
              <div className="flex justify-between">
                <span className="text-[#616161]">{o.delivery_label}</span>
                <span>{o.delivery_fee === 0 ? "Free" : formatPkr(o.delivery_fee)}</span>
              </div>
              {o.payment_fee > 0 ? (
                <div className="flex justify-between">
                  <span className="text-[#616161]">{o.payment_label} fee</span>
                  <span>{formatPkr(o.payment_fee)}</span>
                </div>
              ) : null}
              <div className="mt-1 flex justify-between border-t border-[#e3e3e3] pt-2 text-[15px] font-bold">
                <span>Total</span>
                <span>{formatPkr(o.total)}</span>
              </div>
            </div>

            <section className="mt-6 grid grid-cols-2 gap-6 border-t border-[#e3e3e3] pt-4">
              <div>
                <div className="mb-1 text-[11px] font-semibold tracking-[0.06em] text-[#6b6b68] uppercase">
                  Payment
                </div>
                <div>
                  {paymentShort(o) === "COD" ? "Cash on delivery" : paymentShort(o)} ·{" "}
                  {label(o.payment_status)}
                </div>
                {o.payment_method_id === "cod" && o.payment_status === "unpaid" ? (
                  <div className="font-semibold">Collect {formatPkr(o.total)} on delivery</div>
                ) : null}
              </div>
              {o.courier || o.tracking_number ? (
                <div>
                  <div className="mb-1 text-[11px] font-semibold tracking-[0.06em] text-[#6b6b68] uppercase">
                    Shipping
                  </div>
                  <div>{[o.courier, o.tracking_number].filter(Boolean).join(" · ")}</div>
                </div>
              ) : null}
            </section>

            <footer className="mt-8 text-center text-[#616161]">
              Thank you for shopping with {STORE.name}. Questions? WhatsApp {STORE.phone}.
            </footer>
          </article>
        );
      })}
    </div>
  );
}
