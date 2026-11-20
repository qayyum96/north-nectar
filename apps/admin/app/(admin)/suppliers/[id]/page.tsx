import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/icon";
import {
  ButtonLink,
  Card,
  CardHeader,
  EmptyState,
  KpiStrip,
  PageBody,
  PageHeader,
  extraButtonStyles,
} from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { dateLabel, formatPhone, formatPkr, monthLabel, plural, whatsappLink } from "@/lib/format";
import { type SupplierSummary, loadPurchases, purchaseItems } from "@/lib/inventory";
import { createClient } from "@/lib/supabase/server";
import { EditSupplierButton } from "../supplier-dialog";

export const metadata: Metadata = { title: "Supplier" };

const GRID = { gridTemplateColumns: "90px 110px minmax(0,1.6fr) 110px 110px" };

export default async function SupplierPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff(["owner", "manager"]);
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();
  const [{ data }, purchases] = await Promise.all([
    supabase.from("supplier_summaries").select("*").eq("id", id).maybeSingle(),
    loadPurchases(),
  ]);
  if (!data) notFound();
  const s = data as SupplierSummary;
  const mine = purchases.filter((p) => p.supplier_id === id);
  const wa = whatsappLink(s.phone);

  const months =
    s.first_purchase_date && s.purchases_count > 1
      ? Math.max(
          1,
          (Date.parse(s.last_purchase_date!) - Date.parse(s.first_purchase_date)) /
            (30 * 86_400_000),
        )
      : null;
  const rhythm = months ? s.purchases_count / months : null;
  const rhythmText =
    rhythm === null
      ? s.purchases_count === 1
        ? "first purchase"
        : "no purchases yet"
      : rhythm >= 3
        ? "every week or two"
        : rhythm >= 0.75
          ? "about once a month"
          : `about every ${Math.round(1 / rhythm)} months`;

  return (
    <>
      <PageHeader
        crumbs={[
          { label: "Inventory" },
          { label: "Suppliers", href: "/suppliers" },
          { label: s.name },
        ]}
        title={s.name}
        subtitle={[s.supplies, s.city].filter(Boolean).join(" · ") || "Supplier"}
        actions={
          <>
            <EditSupplierButton
              id={s.id}
              initial={{
                name: s.name,
                supplies: s.supplies,
                contactName: s.contact_name ?? "",
                phone: s.phone ?? "",
                email: s.email ?? "",
                city: s.city ?? "",
                address: s.address ?? "",
                paymentTerms: s.payment_terms,
                notes: s.notes,
              }}
            />
            <ButtonLink href={`/purchases/new?supplier=${s.id}`} variant="primary" icon="plus">
              Record purchase
            </ButtonLink>
          </>
        }
      />
      <PageBody>
        <KpiStrip
          items={[
            {
              label: "Total bought",
              value: formatPkr(s.total_bought),
              note: s.first_purchase_date
                ? `since ${monthLabel(s.first_purchase_date)}`
                : "nothing yet",
            },
            { label: "Purchases", value: String(s.purchases_count), note: rhythmText },
            {
              label: "Balance due",
              value: formatPkr(s.balance_due),
              alert: s.balance_due > 0,
              note:
                s.balance_due > 0 ? (
                  `on ${plural(mine.filter((p) => p.amount_paid < p.total).length, "bill")}`
                ) : (
                  <span className="text-[#1d6b3a]">all bills paid</span>
                ),
            },
            {
              label: "Last purchase",
              value: s.last_purchase_date
                ? new Intl.DateTimeFormat("en-GB", {
                    day: "numeric",
                    month: "short",
                    timeZone: "Asia/Karachi",
                  }).format(new Date(s.last_purchase_date))
                : "None",
              note: s.last_purchase_number ?? "record the first one",
            },
          ]}
        />
        <div className="flex flex-wrap items-start gap-4">
          <section className="border-admin-line min-w-0 flex-[2_1_560px] overflow-hidden rounded-[12px] border bg-white shadow-[0_1px_0_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between gap-3 px-5 py-4">
              <h2 className="m-0 text-[16px] font-bold">Purchase history</h2>
              <Link href={`/purchases/new?supplier=${s.id}`} className={extraButtonStyles.tool}>
                <Icon name="plus" size={16} />
                Record purchase
              </Link>
            </div>
            {mine.length === 0 ? (
              <div className="border-admin-line border-t py-8">
                <EmptyState icon="purchases" title="No purchases yet" />
              </div>
            ) : (
              <div className="border-admin-line overflow-x-auto border-t">
                <div className="min-w-[560px]" role="table" aria-label="Purchase history">
                  <div
                    role="row"
                    className="text-admin-label border-admin-line grid min-h-[46px] items-center gap-4 border-b bg-[#f4f2ee] px-4 text-[14px] font-semibold tracking-[0.05em] uppercase"
                    style={GRID}
                  >
                    <span role="columnheader">Purchase</span>
                    <span role="columnheader">Date</span>
                    <span role="columnheader">Items</span>
                    <span role="columnheader" className="text-right">
                      Total
                    </span>
                    <span role="columnheader" className="text-right">
                      Due
                    </span>
                  </div>
                  {mine.map((p) => {
                    const items = purchaseItems(p);
                    const due = p.total - p.amount_paid;
                    return (
                      <div
                        key={p.id}
                        role="row"
                        className="text-admin-text grid min-h-[62px] items-center gap-4 border-b border-[#ecebe7] px-4 py-[10px] text-[14px] last:border-b-0"
                        style={GRID}
                      >
                        <span role="cell">
                          <Link
                            href={`/purchases/${p.id}`}
                            className="font-bold text-forest-600 hover:underline"
                          >
                            {p.number}
                          </Link>
                        </span>
                        <span role="cell" className="text-admin-muted">
                          {dateLabel(p.purchase_date)}
                        </span>
                        <span role="cell" className="truncate">
                          {items.sub || items.title}
                        </span>
                        <span role="cell" className="text-right font-bold">
                          {formatPkr(p.total)}
                        </span>
                        <span
                          role="cell"
                          className={
                            due > 0
                              ? "text-right font-bold text-[#b42318]"
                              : "text-admin-muted text-right"
                          }
                        >
                          {formatPkr(due)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
          <div className="flex min-w-0 flex-[1_1_280px] flex-col gap-4">
            <Card>
              <CardHeader title="Contact" />
              <div className="flex flex-col gap-[6px]">
                {s.contact_name ? <span className="font-semibold">{s.contact_name}</span> : null}
                {s.phone ? <span>{formatPhone(s.phone)}</span> : null}
                {s.email ? <span className="break-all">{s.email}</span> : null}
                {s.address ? (
                  <span className="text-admin-muted whitespace-pre-line">{s.address}</span>
                ) : null}
                {!s.contact_name && !s.phone && !s.email && !s.address ? (
                  <span className="text-admin-muted">No contact details yet</span>
                ) : null}
                {wa ? (
                  <a
                    href={wa}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-[6px] self-start font-semibold text-forest-600 hover:underline"
                  >
                    <Icon name="whatsapp" size={16} />
                    WhatsApp supplier
                  </a>
                ) : null}
              </div>
            </Card>
            <Card>
              <CardHeader title="Payment terms" />
              <p className="text-admin-muted m-0 leading-[1.6] whitespace-pre-line">
                {s.payment_terms || "No payment terms saved. Use Edit to add them."}
              </p>
            </Card>
          </div>
        </div>
      </PageBody>
    </>
  );
}
