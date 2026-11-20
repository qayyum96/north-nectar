import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { ExportButton } from "@/components/export-dialog";
import { ListToolbar, Pagination } from "@/components/list-toolbar";
import { Card, EmptyState, KpiStrip, PageBody, PageHeader } from "@/components/ui";
import { initials, requireStaff } from "@/lib/auth";
import {
  CUSTOMER_EXPORT_COLUMNS,
  CUSTOMER_SORTS,
  CUSTOMERS_PER_PAGE,
  ORDER_COUNT_FILTERS,
  loadCustomers,
  parseCustomerFilters,
} from "@/lib/customers";
import { CUSTOMER_COLUMNS, type CustomerColumn } from "@/lib/customer-columns";
import { dateLabel, formatPhone, formatPkr, plural, whatsappLink } from "@/lib/format";
import { AddCustomerButton } from "./customer-dialog";
import { CustomersTable } from "./customers-table";

export const metadata: Metadata = { title: "Customers" };

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireStaff();
  const filters = parseCustomerFilters(await searchParams);
  const [data, jar] = await Promise.all([loadCustomers(filters), cookies()]);
  const compact = jar.get("nn-density")?.value === "compact";
  const hidden = (jar.get("nn-customers-cols")?.value ?? "")
    .split(",")
    .filter((k): k is CustomerColumn => CUSTOMER_COLUMNS.some((c) => c.key === k));
  const { kpis } = data;
  const pages = Math.max(1, Math.ceil(data.count / CUSTOMERS_PER_PAGE));
  const filterQuery = new URLSearchParams(
    Object.entries({
      q: filters.q,
      city: filters.city,
      orders: filters.orders,
      sort: filters.sort === "recent" ? "" : filters.sort,
    }).filter(([, v]) => v) as [string, string][],
  ).toString();

  const rows = data.rows.map((c) => ({
    id: c.id,
    name: c.name,
    initials: initials(c.name),
    email: c.email ?? "",
    phone: formatPhone(c.phone),
    city: c.city ?? "",
    orders: c.orders_count,
    spent: formatPkr(c.total_spent),
    last: c.last_order_at ? dateLabel(c.last_order_at) : "No orders",
    whatsapp: c.whatsapp_opt_in,
    whatsappHref: whatsappLink(c.phone),
  }));

  const diff = kpis.newThisMonth - kpis.newPrevMonth;
  const exportProps = {
    what: "customers",
    singular: "customer",
    endpoint: "/export/customers",
    columns: CUSTOMER_EXPORT_COLUMNS,
    filterQuery,
    dateRange: false,
  };

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Sales" }, { label: "Customers" }]}
        title="Customers"
        subtitle={`${plural(kpis.total, "customer")} · ${kpis.returning.toLocaleString("en-US")} returning · ${kpis.whatsapp.toLocaleString("en-US")} get WhatsApp updates`}
        actions={
          <>
            <ExportButton {...exportProps} />
            <AddCustomerButton />
          </>
        }
      />
      <PageBody>
        <KpiStrip
          items={[
            {
              label: "Customers",
              value: kpis.total.toLocaleString("en-US"),
              note: "across Pakistan",
            },
            {
              label: "Returning",
              value: kpis.returning.toLocaleString("en-US"),
              note: kpis.buyers
                ? `${Math.round((kpis.returning / kpis.buyers) * 100)}% ordered more than once`
                : "No orders yet",
            },
            {
              label: "New this month",
              value: kpis.newThisMonth.toLocaleString("en-US"),
              note: (
                <>
                  {diff !== 0 ? (
                    <span className={diff > 0 ? "font-semibold text-[#1d6b3a]" : "font-semibold"}>
                      {diff > 0 ? "▲" : "▼"} {Math.abs(diff)}{" "}
                    </span>
                  ) : null}
                  {diff === 0 ? `same as ${kpis.prevMonthLabel}` : `vs ${kpis.prevMonthLabel}`}
                </>
              ),
            },
            {
              label: "Average spend",
              value: formatPkr(kpis.averageSpend),
              note: "per customer, all time",
            },
          ]}
        />
        <Card className="overflow-hidden p-0">
          <ListToolbar
            searchLabel="Search by name, email or phone"
            filters={[
              {
                name: "city",
                label: "All cities",
                options: data.cities.map((c) => ({ value: c, label: c })),
              },
              {
                name: "orders",
                label: "Any order count",
                width: 166,
                options: ORDER_COUNT_FILTERS,
              },
            ]}
            sorts={CUSTOMER_SORTS}
            columns={CUSTOMER_COLUMNS.map((c) => ({
              key: c.key,
              label: c.label,
              on: !hidden.includes(c.key),
            }))}
            columnsCookie="nn-customers-cols"
            density={compact ? "compact" : "comfortable"}
            right={<ExportButton size="tool" {...exportProps} />}
          />
          {rows.length > 0 ? (
            <>
              <CustomersTable rows={rows} compact={compact} hidden={hidden} />
              <Pagination
                shown={rows.length}
                total={data.count}
                noun={data.count === 1 ? "customer" : "customers"}
                page={filters.page}
                pages={pages}
              />
            </>
          ) : (
            <div className="border-admin-line border-t py-10">
              <EmptyState
                icon="customers"
                title={filterQuery ? "No customers match these filters" : "No customers yet"}
              >
                {filterQuery ? (
                  <Link href="/customers" className="font-semibold text-forest-600 hover:underline">
                    Clear filters
                  </Link>
                ) : (
                  "Customers are added automatically when they order on the website."
                )}
              </EmptyState>
            </div>
          )}
        </Card>
      </PageBody>
    </>
  );
}
