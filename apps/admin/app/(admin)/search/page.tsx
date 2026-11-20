import { formatPkr } from "@northnectar/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icon";
import {
  Card,
  CardHeader,
  EmptyState,
  PageBody,
  PageHeader,
  StatusBadge,
  buttonStyles,
} from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { shortWhen } from "@/lib/time";

export const metadata: Metadata = { title: "Search" };

/** Characters with meaning in PostgREST filters are dropped from the search text. */
const clean = (q: string) =>
  q
    .replace(/[,()*%\\]/g, " ")
    .trim()
    .slice(0, 80);

/** Global search (top bar, Ctrl K): orders, customers and products. */
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireStaff();
  const { q = "" } = await searchParams;
  const term = clean(q);
  const supabase = await createClient();

  const [orders, customers, products] = term
    ? await Promise.all([
        supabase
          .from("orders")
          .select("id, number, total, fulfilment_status, created_at, phone, shipping_address")
          .or(
            `number.ilike.%${term.replace(/^#/, "")}%,phone.ilike.%${term}%,email.ilike.%${term}%`,
          )
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("customers")
          .select("id, name, phone, email, city")
          .or(`name.ilike.%${term}%,phone.ilike.%${term}%,email.ilike.%${term}%`)
          .limit(10),
        supabase
          .from("products")
          .select("id, name, slug, status")
          .ilike("name", `%${term}%`)
          .limit(10),
      ])
    : [null, null, null];

  const total =
    (orders?.data?.length ?? 0) + (customers?.data?.length ?? 0) + (products?.data?.length ?? 0);

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Home", href: "/" }, { label: "Search" }]}
        title="Search"
        subtitle={
          term
            ? `${total} ${total === 1 ? "result" : "results"} for “${term}”`
            : "Orders, customers and products"
        }
      />
      <PageBody>
        <form action="/search" role="search" className="flex gap-2">
          <label className="border-admin-field flex h-[38px] flex-1 items-center gap-[10px] rounded-[8px] border bg-white px-3">
            <Icon name="search" size={16} className="text-admin-muted" />
            <input
              name="q"
              type="search"
              defaultValue={q}
              aria-label="Search orders, products, customers"
              placeholder="Order number, phone, email, name or product"
              className="min-w-0 flex-1 border-0 bg-transparent outline-none"
            />
          </label>
          <button type="submit" className={buttonStyles.primary}>
            Search
          </button>
        </form>

        {term && total === 0 ? (
          <Card>
            <EmptyState icon="search" title="Nothing found">
              Try an order number like NN1001, a phone number or part of a name.
            </EmptyState>
          </Card>
        ) : null}

        {orders?.data?.length ? (
          <Card>
            <CardHeader title="Orders" />
            <ul className="m-0 list-none p-0">
              {orders.data.map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/orders/${o.number}`}
                    className="border-admin-line-soft flex flex-wrap items-center gap-3 border-t py-[11px] hover:bg-[#fafaf9]"
                  >
                    <span className="w-[80px] font-semibold">#{o.number}</span>
                    <span className="flex-1 truncate">
                      {(o.shipping_address as { fullName?: string })?.fullName} · {o.phone}
                    </span>
                    <StatusBadge status={o.fulfilment_status} />
                    <span className="w-[90px] text-right font-semibold">{formatPkr(o.total)}</span>
                    <span className="text-admin-muted w-[80px] text-right">
                      {shortWhen(o.created_at)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}

        {customers?.data?.length ? (
          <Card>
            <CardHeader title="Customers" />
            <ul className="m-0 list-none p-0">
              {customers.data.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/customers/${c.id}`}
                    className="border-admin-line-soft flex flex-wrap items-center gap-3 border-t py-[11px] hover:bg-[#fafaf9]"
                  >
                    <span className="flex-1 font-semibold">{c.name}</span>
                    <span className="text-admin-muted">{c.phone}</span>
                    <span className="text-admin-muted">{c.email}</span>
                    <span className="text-admin-muted">{c.city}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}

        {products?.data?.length ? (
          <Card>
            <CardHeader title="Products" />
            <ul className="m-0 list-none p-0">
              {products.data.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/products/${p.id}`}
                    className="border-admin-line-soft flex items-center gap-3 border-t py-[11px] hover:bg-[#fafaf9]"
                  >
                    <span className="flex-1 font-semibold">{p.name}</span>
                    <StatusBadge status={p.status} />
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}
      </PageBody>
    </>
  );
}
