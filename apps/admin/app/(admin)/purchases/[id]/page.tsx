import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/icon";
import { Card, CardHeader, PageBody, PageHeader, StatusBadge, buttonStyles } from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { dateLabel, formatPkr, plural } from "@/lib/format";
import { loadPurchase, paymentState } from "@/lib/inventory";
import { RecordPaymentButton } from "./record-payment-button";

export const metadata: Metadata = { title: "Purchase" };

/** One purchase (the mockup's row menu "View"; designed in the same style). */
export default async function PurchasePage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff(["owner", "manager"]);
  const { id } = await params;
  const p = await loadPurchase(id);
  if (!p) notFound();
  const state = paymentState(p);
  const due = p.total - p.amount_paid;
  const units = p.lines.filter((l) => l.variant_id).reduce((s, l) => s + l.quantity, 0);

  return (
    <>
      <PageHeader
        crumbs={[
          { label: "Inventory" },
          { label: "Purchases", href: "/purchases" },
          { label: p.number },
        ]}
        title={p.number}
        badge={
          <StatusBadge
            status={state === "partly paid" ? "confirmed" : state}
            label={state === "partly paid" ? "Partly paid" : state === "paid" ? "Paid" : "Unpaid"}
          />
        }
        subtitle={`${dateLabel(p.purchase_date)}${p.supplier ? ` · ${p.supplier.name}` : ""}${p.reference ? ` · bill ${p.reference}` : ""}`}
        actions={
          <>
            {p.bill_path ? (
              <a
                href={`/purchases/${p.id}/bill`}
                target="_blank"
                rel="noopener"
                className={buttonStyles.secondary}
              >
                <Icon name="image" size={16} />
                Bill photo
              </a>
            ) : null}
            {due > 0 ? (
              <RecordPaymentButton purchase={{ id: p.id, number: p.number, due }} />
            ) : null}
          </>
        }
      />
      <PageBody>
        <div className="flex flex-wrap items-start gap-4">
          <Card className="min-w-0 flex-[2_1_560px]">
            <CardHeader
              title="Items"
              action={
                <span className="text-admin-muted text-[14px]">
                  {units ? `${plural(units, "unit")} added to stock` : "Not stocked items"}
                </span>
              }
            />
            {p.lines.map((l) => (
              <div
                key={l.id}
                className="border-admin-line-soft flex items-center gap-3 border-t py-3"
              >
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="font-semibold">{l.description}</span>
                  <span className="text-admin-muted text-[14px]">
                    {l.variant_id ? "Added to stock" : (l.detail ?? "Not stocked")}
                  </span>
                </span>
                <span className="text-admin-muted whitespace-nowrap">
                  {formatPkr(l.unit_cost)} × {l.quantity.toLocaleString("en-US")}
                </span>
                <span className="w-[100px] text-right font-semibold whitespace-nowrap">
                  {formatPkr(l.line_total)}
                </span>
              </div>
            ))}
            <div className="border-admin-line flex flex-col gap-2 border-t pt-[14px]">
              <div className="flex justify-between">
                <span className="text-admin-muted">Items total</span>
                <span>{formatPkr(p.items_total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-admin-muted">Delivery to warehouse</span>
                <span>{formatPkr(p.delivery_cost)}</span>
              </div>
              <div className="border-admin-line-soft flex justify-between border-t pt-2 text-[15px] font-bold">
                <span>Total</span>
                <span>{formatPkr(p.total)}</span>
              </div>
            </div>
          </Card>
          <div className="flex min-w-0 flex-[1_1_280px] flex-col gap-4">
            <Card>
              <CardHeader title="Payment" />
              <div className="flex flex-col gap-2">
                <div className="flex justify-between">
                  <span className="text-admin-muted">Paid</span>
                  <span className="font-semibold">{formatPkr(p.amount_paid)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-admin-muted">Balance due</span>
                  <span className={due > 0 ? "font-semibold text-[#b42318]" : "font-semibold"}>
                    {formatPkr(due)}
                  </span>
                </div>
                {p.paid_by ? (
                  <div className="flex justify-between">
                    <span className="text-admin-muted">Paid by</span>
                    <span>{p.paid_by}</span>
                  </div>
                ) : null}
              </div>
            </Card>
            {p.supplier ? (
              <Card>
                <CardHeader title="Supplier" />
                <Link
                  href={`/suppliers/${p.supplier.id}`}
                  className="font-bold text-forest-600 hover:underline"
                >
                  {p.supplier.name}
                </Link>
              </Card>
            ) : null}
            {p.notes ? (
              <Card>
                <CardHeader title="Notes" />
                <p className="text-admin-muted m-0 whitespace-pre-line">{p.notes}</p>
              </Card>
            ) : null}
          </div>
        </div>
      </PageBody>
    </>
  );
}
