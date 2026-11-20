import { CONTACT_SUBJECTS } from "@northnectar/types";
import { cn, formatPkr } from "@northnectar/ui";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/icon";
import { SalesChart } from "@/components/sales-chart";
import {
  ButtonLink,
  Card,
  CardHeader,
  EmptyState,
  PageBody,
  PageHeader,
  Segmented,
  StatusBadge,
  TextLink,
  buttonStyles,
} from "@/components/ui";
import { initials, requireStaff } from "@/lib/auth";
import { loadDashboard, parseRange, type DashboardRange, type Kpi } from "@/lib/dashboard";
import { longToday, shortWhen } from "@/lib/time";

export const metadata: Metadata = { title: "Dashboard" };

type Search = { range?: string; from?: string; to?: string; metric?: string };

const qs = (params: Record<string, string | undefined>) => {
  const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]);
  const s = q.toString();
  return s ? `/?${s}` : "/";
};

function rangeParams(r: DashboardRange) {
  return r.key === "custom"
    ? { range: "custom", from: r.from, to: r.to }
    : { range: r.key === "30d" ? undefined : r.key };
}

function imageSrc(src: string | null) {
  if (!src) return null;
  if (/^https?:\/\//.test(src)) return src;
  return `${process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "https://northnectar.com"}${src}`;
}

function KpiCell({ kpi }: { kpi: Kpi }) {
  const up = (kpi.change ?? 0) >= 0;
  return (
    <div className="flex min-w-0 flex-col gap-1 px-4 py-[14px] shadow-[-1px_0_0_#e3e3e3,0_-1px_0_#e3e3e3] md:px-5 md:py-[18px]">
      <span className="text-admin-label text-[14px] leading-[1.35] font-semibold tracking-[0.05em] uppercase">
        {kpi.label}
      </span>
      <span className="text-admin-text text-[22px] leading-[1.25] font-bold tracking-[-0.02em] whitespace-nowrap md:text-[28px]">
        {kpi.value === null
          ? "—"
          : kpi.format === "pkr"
            ? formatPkr(kpi.value)
            : kpi.value.toLocaleString("en-US")}
      </span>
      <span className="text-admin-muted text-[14px]">
        {kpi.change !== null ? (
          <>
            <span className={cn("font-semibold", up ? "text-[#1d6b3a]" : "text-admin-muted")}>
              {up ? "▲" : "▼"} {Math.abs(kpi.change)}%
            </span>{" "}
            vs last period
          </>
        ) : (
          (kpi.note ?? "No orders last period")
        )}
      </span>
    </div>
  );
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<Search> }) {
  const staff = await requireStaff();
  const params = await searchParams;
  const range = parseRange(params);
  const metric = params.metric === "orders" ? "orders" : "revenue";
  const data = await loadDashboard(range);
  const base = rangeParams(range);
  const canEditCatalogue = staff.role !== "staff";

  const today = new Date();
  const defaultFrom = new Date(today.getTime() - 13 * 86_400_000).toISOString().slice(0, 10);
  const defaultTo = today.toISOString().slice(0, 10);

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Home" }, { label: "Dashboard" }]}
        title="Dashboard"
        subtitle={`${longToday()} · here is how North Nectar is doing`}
        actions={
          <>
            <Segmented
              label="Date range"
              items={[
                {
                  label: "Today",
                  href: qs({ range: "today", metric: params.metric }),
                  active: range.key === "today",
                },
                {
                  label: "7 days",
                  href: qs({ range: "7d", metric: params.metric }),
                  active: range.key === "7d",
                },
                {
                  label: "30 days",
                  href: qs({ metric: params.metric }),
                  active: range.key === "30d",
                },
                {
                  label: "Custom",
                  href: qs({
                    range: "custom",
                    from: range.from ?? defaultFrom,
                    to: range.to ?? defaultTo,
                    metric: params.metric,
                  }),
                  active: range.key === "custom",
                },
              ]}
            />
            <a
              href={`/export/dashboard${qs(base).slice(1)}`}
              className={buttonStyles.secondary}
              download
            >
              <Icon name="download" size={16} /> Export
            </a>
            {canEditCatalogue ? (
              <ButtonLink href="/products/new" variant="primary" icon="plus">
                Add product
              </ButtonLink>
            ) : null}
          </>
        }
      />
      <PageBody>
        {range.key === "custom" ? (
          <form
            action="/"
            className="border-admin-line flex flex-wrap items-end gap-3 rounded-[12px] border bg-white px-5 py-4"
          >
            <input type="hidden" name="range" value="custom" />
            <label className="flex flex-col gap-1">
              <span className="font-semibold">From</span>
              <input
                type="date"
                name="from"
                defaultValue={range.from}
                className="border-admin-field h-[38px] rounded-[8px] border px-3"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-semibold">To</span>
              <input
                type="date"
                name="to"
                defaultValue={range.to}
                className="border-admin-field h-[38px] rounded-[8px] border px-3"
              />
            </label>
            <button type="submit" className={buttonStyles.primary}>
              Apply
            </button>
          </form>
        ) : null}

        {data.errors.length ? (
          <p
            role="alert"
            className="m-0 rounded-[10px] border border-[#f5c2bc] bg-[#fdecea] px-4 py-3 text-[#8f1d14]"
          >
            Some numbers couldn&apos;t be loaded. Refresh the page to try again.
          </p>
        ) : null}

        <div className="border-admin-line grid grid-cols-2 overflow-hidden rounded-[12px] border bg-white md:grid-cols-[repeat(auto-fit,minmax(210px,1fr))]">
          {data.kpis.map((kpi) => (
            <KpiCell key={kpi.label} kpi={kpi} />
          ))}
        </div>

        <Card>
          <CardHeader
            title="Sales over time"
            action={
              <Segmented
                label="Chart metric"
                items={[
                  { label: "Revenue", href: qs({ ...base }), active: metric === "revenue" },
                  {
                    label: "Orders",
                    href: qs({ ...base, metric: "orders" }),
                    active: metric === "orders",
                  },
                ]}
              />
            }
          />
          <div className="flex items-baseline gap-[10px] pb-2">
            <span className="text-[22px] font-bold whitespace-nowrap">
              {metric === "revenue"
                ? formatPkr(data.revenueTotal)
                : data.ordersTotal.toLocaleString("en-US")}
            </span>
            <span className="text-admin-muted text-[14px]">
              {range.label} ·{" "}
              {metric === "revenue" ? "total sales after discounts" : "orders placed"}
            </span>
          </div>
          <SalesChart
            current={data.series.current[metric]}
            previous={data.series.previous[metric]}
            ticks={data.ticks}
            ariaLabel={`Line chart of ${metric} per day for ${range.label}, compared with the previous period`}
          />
          <div className="text-admin-muted flex gap-[18px] pt-[10px] text-[14px]">
            <span className="inline-flex items-center gap-[6px]">
              <span className="h-[3px] w-[14px] rounded-[2px] bg-forest-600" />
              This period
            </span>
            <span className="inline-flex items-center gap-[6px]">
              <span className="w-[14px] border-t-2 border-dashed border-[#b9c4b6]" />
              Previous period
            </span>
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader
              title="Top products"
              action={<TextLink href="/reports?tab=products">View report</TextLink>}
            />
            {data.top.length === 0 ? (
              <EmptyState icon="products" title="No sales in this period">
                Best sellers appear here once orders come in.
              </EmptyState>
            ) : (
              <ul className="m-0 flex list-none flex-col p-0">
                {data.top.map((t) => {
                  const src = imageSrc(t.image);
                  return (
                    <li
                      key={t.name}
                      className="border-admin-line-soft flex items-center gap-3 border-t py-[10px]"
                    >
                      <span className="border-admin-line relative size-[42px] shrink-0 overflow-hidden rounded-[8px] border bg-white">
                        {src ? (
                          <Image src={src} alt="" fill sizes="40px" className="object-cover" />
                        ) : null}
                      </span>
                      <div className="flex min-w-0 flex-1 flex-col gap-[6px]">
                        <div className="flex justify-between gap-[10px]">
                          <span className="truncate font-semibold">{t.name}</span>
                          <span className="font-semibold whitespace-nowrap">
                            {formatPkr(t.revenue)}
                          </span>
                        </div>
                        <div className="flex items-center gap-[10px]">
                          <span className="h-[6px] flex-1 overflow-hidden rounded-full bg-[#efefed]">
                            <span
                              className="block h-full rounded-full bg-forest-600"
                              style={{ width: `${t.share}%` }}
                            />
                          </span>
                          <span className="text-admin-muted text-[14px] whitespace-nowrap">
                            {t.sold} sold
                          </span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader
              title="Low stock alerts"
              action={<TextLink href="/stock">Open stock</TextLink>}
            />
            {data.lowStock.length === 0 ? (
              <EmptyState icon="stock" title="Stock looks healthy">
                Sizes at or below their reorder level show up here.
              </EmptyState>
            ) : (
              <ul className="m-0 flex list-none flex-col p-0">
                {data.lowStock.map((v) => (
                  <li
                    key={v.id}
                    className="border-admin-line-soft flex items-center gap-3 border-t py-[10px]"
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "size-2 shrink-0 rounded-full",
                        v.available <= 0 ? "bg-[#d92d20]" : "bg-[#d97706]",
                      )}
                    />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="font-semibold">
                        {v.products.name} · {v.label}
                      </span>
                      <span className="text-admin-muted text-[14px]">
                        {v.sku} · reorder at {v.reorder_at}
                      </span>
                    </span>
                    <StatusBadge
                      status={v.available <= 0 ? "out of stock" : "low stock"}
                      label={v.available <= 0 ? "Out of stock" : `${v.available} left`}
                    />
                    <ButtonLink href={`/purchases/new?variant=${v.id}`}>Reorder</ButtonLink>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <Card>
            <CardHeader
              title="Recent orders"
              action={<TextLink href="/orders">View all orders</TextLink>}
            />
            {data.recent.length === 0 ? (
              <EmptyState icon="orders" title="No orders yet">
                When customers place orders on the website, they show up here.
              </EmptyState>
            ) : (
              <ul className="m-0 flex list-none flex-col p-0">
                {data.recent.map((o) => (
                  <li key={o.id}>
                    <Link
                      href={`/orders/${o.number}`}
                      className="border-admin-line-soft text-admin-text grid grid-cols-[64px_minmax(0,1fr)_100px_76px] items-center gap-[10px] border-t py-[11px] text-[14px] hover:bg-[#fafaf9] md:grid-cols-[72px_minmax(0,1.3fr)_minmax(0,1fr)_110px_90px]"
                    >
                      <span className="font-semibold">#{o.number}</span>
                      <span className="truncate">{o.shipping_address?.fullName ?? "Customer"}</span>
                      <span className="text-admin-muted hidden md:block">
                        {o.shipping_address?.city ?? ""}
                      </span>
                      <StatusBadge status={o.fulfilment_status} />
                      <span className="text-right font-semibold">{formatPkr(o.total)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader
              title="Unread messages"
              action={<TextLink href="/messages">Open inbox</TextLink>}
            />
            {data.messages.length === 0 ? (
              <EmptyState icon="messages" title="Inbox zero">
                Messages from the website&apos;s contact form land here.
              </EmptyState>
            ) : (
              <ul className="m-0 flex list-none flex-col p-0">
                {data.messages.map((m) => (
                  <li key={m.id}>
                    <Link
                      href={`/messages?id=${m.id}`}
                      className="border-admin-line-soft text-admin-text flex items-start gap-3 border-t py-[11px] hover:bg-[#fafaf9]"
                    >
                      <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-[#eef3ec] text-[14px] font-bold text-forest-600">
                        {initials(m.name)}
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
                        <span className="flex justify-between gap-2">
                          <span className="font-bold">{m.name}</span>
                          <span className="text-admin-muted text-[14px] whitespace-nowrap">
                            {shortWhen(m.created_at)}
                          </span>
                        </span>
                        <span className="text-[14px] font-semibold">
                          {CONTACT_SUBJECTS.find((c) => c.value === m.subject)?.label ?? m.subject}
                        </span>
                        <span className="text-admin-muted truncate text-[14px]">{m.message}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </PageBody>
    </>
  );
}
