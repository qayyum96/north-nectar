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
  StatusBadge,
  buttonStyles,
  extraButtonStyles,
} from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { loadCustomer } from "@/lib/customers";
import { dateLabel, formatPhone, formatPkr, plural, whatsappLink } from "@/lib/format";
import { addressLines, linesSummary } from "@/lib/orders";
import { noSept } from "@/lib/time";
import { EditCustomerButton } from "../customer-dialog";

export const metadata: Metadata = { title: "Customer" };

const GRID = { gridTemplateColumns: "90px 110px minmax(0,1.8fr) 110px 90px" };

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff();
  const { id } = await params;
  const data = await loadCustomer(id);
  if (!data) notFound();
  const { customer: c, orders, storeAverage } = data;

  const wa = whatsappLink(
    c.phone,
    `Assalam o Alaikum ${c.name.split(" ")[0]}, this is North Nectar.`,
  );
  const average = c.orders_count ? Math.round(c.total_spent / Math.max(1, c.orders_count)) : 0;
  const lastDay = c.last_order_at
    ? noSept(
        new Intl.DateTimeFormat("en-GB", {
          timeZone: "Asia/Karachi",
          day: "numeric",
          month: "short",
        }).format(new Date(c.last_order_at)),
      )
    : "None";
  const address = addressLines(c.default_address);

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Sales" }, { label: "Customers", href: "/customers" }, { label: c.name }]}
        title={c.name}
        subtitle={[c.city, `customer since ${dateLabel(c.created_at)}`].filter(Boolean).join(" · ")}
        actions={
          <>
            {wa ? (
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonStyles.secondary}
              >
                <Icon name="whatsapp" size={16} />
                Message on WhatsApp
              </a>
            ) : null}
            <ButtonLink href={`/orders/new?customer=${c.id}`} variant="primary" icon="plus">
              Create order
            </ButtonLink>
          </>
        }
      />
      <PageBody>
        <KpiStrip
          items={[
            {
              label: "Total spent",
              value: formatPkr(c.total_spent),
              note: `across ${plural(c.orders_count, "order")}`,
            },
            {
              label: "Orders",
              value: c.orders_count.toLocaleString("en-US"),
              note: c.pending_count ? `${c.pending_count} still pending` : "none pending",
            },
            {
              label: "Average order",
              value: formatPkr(average),
              note: `store average ${formatPkr(storeAverage)}`,
            },
            {
              label: "Last order",
              value: lastDay,
              note: c.last_order_number ? `#${c.last_order_number}` : "No orders yet",
            },
          ]}
        />
        <div className="flex flex-wrap items-start gap-4">
          <section className="border-admin-line min-w-0 flex-[2_1_560px] overflow-hidden rounded-[12px] border bg-white shadow-[0_1px_0_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between gap-3 px-5 py-4">
              <h2 className="m-0 text-[16px] leading-[1.5] font-bold">Order history</h2>
              {orders.length > 0 ? (
                <Link
                  href={`/orders?q=${encodeURIComponent(c.phone)}`}
                  className={extraButtonStyles.tool}
                >
                  View all
                </Link>
              ) : null}
            </div>
            {orders.length === 0 ? (
              <div className="border-admin-line border-t py-8">
                <EmptyState icon="orders" title="No orders yet">
                  <Link
                    href={`/orders/new?customer=${c.id}`}
                    className="font-semibold text-forest-600 hover:underline"
                  >
                    Create the first order
                  </Link>
                </EmptyState>
              </div>
            ) : (
              <div className="border-admin-line overflow-x-auto border-t">
                <div className="min-w-[560px]" role="table" aria-label="Order history">
                  <div
                    role="row"
                    className="text-admin-label border-admin-line grid min-h-[46px] items-center gap-4 border-b bg-[#f4f2ee] px-4 text-[14px] font-semibold tracking-[0.05em] uppercase"
                    style={GRID}
                  >
                    <span role="columnheader">Order</span>
                    <span role="columnheader">Date</span>
                    <span role="columnheader">Items</span>
                    <span role="columnheader">Status</span>
                    <span role="columnheader" className="text-right">
                      Total
                    </span>
                  </div>
                  {orders.map((o) => (
                    <div
                      key={o.id}
                      role="row"
                      className="text-admin-text box-border grid min-h-[62px] items-center gap-4 border-b border-[#ecebe7] px-4 py-[10px] text-[14px] last:border-b-0"
                      style={GRID}
                    >
                      <span role="cell">
                        <Link
                          href={`/orders/${o.number}`}
                          className="font-bold text-forest-600 hover:underline"
                        >
                          #{o.number}
                        </Link>
                      </span>
                      <span role="cell" className="text-admin-muted">
                        {dateLabel(o.created_at)}
                      </span>
                      <span role="cell" className="min-w-0 truncate">
                        {linesSummary(o.lines)}
                      </span>
                      <span role="cell">
                        <StatusBadge status={o.fulfilment_status} />
                      </span>
                      <span role="cell" className="text-right font-bold whitespace-nowrap">
                        {formatPkr(o.total)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          <div className="flex min-w-0 flex-[1_1_280px] flex-col gap-4">
            <Card>
              <CardHeader
                title="Contact"
                action={
                  <EditCustomerButton
                    id={c.id}
                    initial={{
                      name: c.name,
                      phone: c.phone,
                      email: c.email ?? "",
                      whatsapp: c.whatsapp_opt_in,
                      street: c.default_address?.street ?? "",
                      landmark: c.default_address?.landmark ?? "",
                      city: c.city ?? c.default_address?.city ?? "",
                      province: c.default_address?.province ?? "",
                      postalCode: c.default_address?.postalCode ?? "",
                      notes: c.notes,
                    }}
                  />
                }
              />
              <div className="flex flex-col gap-[6px]">
                {c.email ? <span className="break-all">{c.email}</span> : null}
                <span>{formatPhone(c.phone)}</span>
                <span className="text-admin-muted">
                  {c.whatsapp_opt_in
                    ? "Accepts WhatsApp updates"
                    : "Does not want WhatsApp updates"}
                </span>
              </div>
            </Card>
            <Card>
              <CardHeader title="Default address" />
              {address.length ? (
                <span className="leading-[1.6]">
                  {address.map((l) => (
                    <span key={l} className="block">
                      {l}
                    </span>
                  ))}
                </span>
              ) : (
                <span className="text-admin-muted">No address saved</span>
              )}
            </Card>
            <Card>
              <CardHeader title="Notes" />
              <p className="text-admin-muted m-0 leading-[1.5] whitespace-pre-line">
                {c.notes || "No notes yet. Use Edit to add some."}
              </p>
            </Card>
          </div>
        </div>
      </PageBody>
    </>
  );
}
