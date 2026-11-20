import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { ExportButton } from "@/components/export-dialog";
import { Icon } from "@/components/icon";
import { ListToolbar, Pagination } from "@/components/list-toolbar";
import { ButtonLink, Card, EmptyState, KpiStrip, PageBody, PageHeader } from "@/components/ui";
import { initials, requireStaff } from "@/lib/auth";
import { ORDER_COLUMNS, type OrderColumn } from "@/lib/order-columns";
import { dateLabel, firstName, formatPhone, formatPkr, plural } from "@/lib/format";
import {
  FULFILMENT,
  ORDER_EXPORT_COLUMNS,
  ORDER_SORTS,
  ORDERS_PER_PAGE,
  PAYMENT_METHODS,
  label,
  loadOrderKpis,
  loadOrderList,
  parseOrderFilters,
  paymentShort,
} from "@/lib/orders";
import { CopyStoreLink } from "./copy-store-link";
import { OrdersTable } from "./orders-table";

export const metadata: Metadata = { title: "Orders" };

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireStaff();
  const sp = await searchParams;
  const filters = parseOrderFilters(sp);
  const [list, kpis, jar] = await Promise.all([loadOrderList(filters), loadOrderKpis(), cookies()]);

  const hidden = (jar.get("nn-orders-cols")?.value ?? "")
    .split(",")
    .filter((k): k is OrderColumn => ORDER_COLUMNS.some((c) => c.key === k));
  const compact = jar.get("nn-density")?.value === "compact";
  const pages = Math.max(1, Math.ceil(list.count / ORDERS_PER_PAGE));

  const filterQuery = new URLSearchParams(
    Object.entries({
      q: filters.q,
      status: filters.status,
      pay: filters.pay,
      city: filters.city,
      sort: filters.sort === "new" ? "" : filters.sort,
    }).filter(([, v]) => v) as [string, string][],
  ).toString();
  const filtered = !!(filters.q || filters.status || filters.pay || filters.city);

  const storefront = process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "https://northnectar.com";
  const actions = (
    <>
      <ExportButton
        what="orders"
        singular="order"
        endpoint="/export/orders"
        columns={ORDER_EXPORT_COLUMNS}
        filterQuery={filterQuery}
      />
      <ButtonLink href="/orders/new" variant="primary" icon="plus">
        Create order
      </ButtonLink>
    </>
  );

  const subtitle = `${plural(kpis.total, "order")} · ${kpis.toConfirm.toLocaleString("en-US")} to confirm · ${kpis.onTheWay.toLocaleString("en-US")} on the way to customers`;

  if (!list.storeHasOrders) {
    return (
      <>
        <PageHeader
          crumbs={[{ label: "Sales" }, { label: "Orders" }]}
          title="Orders"
          subtitle={subtitle}
          actions={actions}
        />
        <PageBody>
          <Card className="p-0">
            <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
              <span className="grid size-[72px] place-items-center rounded-full bg-[#eef3ec] text-forest-600">
                <Icon name="orders" size={32} />
              </span>
              <h2 className="m-0 text-[17px] leading-[1.5] font-bold">No orders yet</h2>
              <p className="text-admin-muted m-0 max-w-[420px] leading-[1.6]">
                When customers place orders on {new URL(storefront).host}, they will show up here.
                Share your store to get the first one.
              </p>
              <div className="flex flex-wrap justify-center gap-2 pt-[6px]">
                <CopyStoreLink url={storefront} />
                <ButtonLink href="/orders/new" variant="primary" icon="plus">
                  Create order
                </ButtonLink>
              </div>
            </div>
          </Card>
        </PageBody>
      </>
    );
  }

  const rows = list.rows.map((o) => {
    const name = o.shipping_address?.fullName?.trim() || "Customer";
    return {
      id: o.id,
      number: o.number,
      date: dateLabel(o.created_at),
      name,
      initials: initials(name),
      firstName: firstName(name),
      phone: formatPhone(o.phone),
      city: o.shipping_address?.city ?? "",
      payment: paymentShort(o),
      paymentStatus: o.payment_status,
      fulfilment: o.fulfilment_status,
      total: formatPkr(o.total),
      units:
        (o as unknown as { lines?: { quantity: number }[] }).lines?.reduce(
          (s, l) => s + l.quantity,
          0,
        ) ?? 0,
    };
  });

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Sales" }, { label: "Orders" }]}
        title="Orders"
        subtitle={subtitle}
        actions={actions}
      />
      <PageBody>
        <KpiStrip
          items={[
            {
              label: "To confirm",
              value: kpis.toConfirm.toLocaleString("en-US"),
              alert: kpis.toConfirm > 0,
              note:
                kpis.toConfirm > 0 ? (
                  <Link href="/orders?status=pending" className="hover:underline">
                    Review pending orders
                  </Link>
                ) : (
                  "All caught up"
                ),
            },
            {
              label: "Cash to collect",
              value: formatPkr(kpis.cashToCollect),
              note: `${plural(kpis.unpaidCod, "unpaid COD order")}`,
            },
            {
              label: "On the way",
              value: kpis.onTheWay.toLocaleString("en-US"),
              note:
                kpis.avgTransitDays !== null
                  ? kpis.avgTransitDays < 1
                    ? "Under a day average in transit"
                    : `${kpis.avgTransitDays} days average in transit`
                  : "No deliveries in the last 30 days",
            },
            {
              label: "Returned",
              value: kpis.returned30.toLocaleString("en-US"),
              note: "last 30 days",
            },
          ]}
        />
        <Card className="overflow-hidden p-0">
          <ListToolbar
            searchLabel="Search by order, customer or phone"
            filters={[
              {
                name: "status",
                label: "All statuses",
                options: FULFILMENT.map((s) => ({ value: s, label: label(s) })),
              },
              {
                name: "pay",
                label: "All payments",
                width: 145,
                options: [
                  {
                    group: "Payment status",
                    options: [
                      { value: "unpaid", label: "Unpaid" },
                      { value: "paid", label: "Paid" },
                      { value: "refunded", label: "Refunded" },
                    ],
                  },
                  {
                    group: "Payment method",
                    options: PAYMENT_METHODS.map((m) => ({ value: `m:${m.id}`, label: m.label })),
                  },
                ],
              },
              {
                name: "city",
                label: "All cities",
                options: list.cities.map((c) => ({ value: c, label: c })),
              },
            ]}
            sorts={ORDER_SORTS}
            columns={ORDER_COLUMNS.map((c) => ({
              key: c.key,
              label: c.label,
              on: !hidden.includes(c.key),
            }))}
            columnsCookie="nn-orders-cols"
            density={compact ? "compact" : "comfortable"}
            right={
              <ExportButton
                size="tool"
                what="orders"
                singular="order"
                endpoint="/export/orders"
                columns={ORDER_EXPORT_COLUMNS}
                filterQuery={filterQuery}
              />
            }
          />
          {rows.length > 0 ? (
            <>
              <OrdersTable
                rows={rows}
                hidden={hidden}
                compact={compact}
                exportColumns={ORDER_EXPORT_COLUMNS}
                filterQuery={filterQuery}
              />
              <Pagination
                shown={rows.length}
                total={list.count}
                noun={list.count === 1 ? "order" : "orders"}
                page={filters.page}
                pages={pages}
              />
            </>
          ) : (
            <div className="border-admin-line border-t py-10">
              <EmptyState
                icon="search"
                title={filtered ? "No orders match these filters" : "No orders on this page"}
              >
                <Link href="/orders" className="font-semibold text-forest-600 hover:underline">
                  Clear filters
                </Link>
              </EmptyState>
            </div>
          )}
        </Card>
      </PageBody>
    </>
  );
}
