"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Icon } from "@/components/icon";
import { Popover, PopoverItem } from "@/components/menus";
import { buttonStyles, fieldStyles } from "@/components/ui";
import { noSept } from "@/lib/time";

const fmt = (iso: string, withYear: boolean) =>
  noSept(
    new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      ...(withYear ? { year: "numeric" } : {}),
      timeZone: "UTC",
    }).format(new Date(`${iso}T00:00:00Z`)),
  );

/** Date range ("21 Oct to 20 Nov 2026") and product filter for the movements ledger. */
export function MovementFilters({
  from,
  to,
  product,
  products,
  today,
}: {
  from: string;
  to: string;
  product: string;
  products: { id: string; name: string }[];
  today: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, start] = useTransition();
  const [customFrom, setCustomFrom] = useState(from);
  const [customTo, setCustomTo] = useState(to);

  const push = (changes: Record<string, string>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(changes)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    next.delete("page");
    start(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }));
  };
  const daysAgo = (n: number) => {
    const d = new Date(`${today}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - n);
    return d.toISOString().slice(0, 10);
  };
  const presets = [
    { label: "Last 7 days", from: daysAgo(6) },
    { label: "Last 30 days", from: daysAgo(30) },
    { label: "Last 90 days", from: daysAgo(90) },
    { label: "This year", from: `${today.slice(0, 4)}-01-01` },
    { label: "All time", from: "2020-01-01" },
  ];
  const label =
    from === "2020-01-01"
      ? "All time"
      : `${fmt(from, from.slice(0, 4) !== to.slice(0, 4))} to ${fmt(to, true)}`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="[&>div>button]:h-10">
        <Popover label={label} icon="calendar">
          {(close) => (
            <div className="flex w-[260px] flex-col gap-1">
              {presets.map((p) => (
                <PopoverItem
                  key={p.label}
                  active={from === p.from && to === today}
                  onSelect={() => {
                    close();
                    push({ from: p.from, to: today });
                  }}
                >
                  {p.label}
                </PopoverItem>
              ))}
              <div className="border-admin-line mt-1 flex flex-col gap-2 border-t p-[6px] pt-2">
                <span className="text-admin-muted text-[13px]">Custom dates</span>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    aria-label="From"
                    value={customFrom}
                    max={customTo}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className={fieldStyles.input}
                  />
                  <input
                    type="date"
                    aria-label="To"
                    value={customTo}
                    min={customFrom}
                    max={today}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className={fieldStyles.input}
                  />
                </div>
                <button
                  type="button"
                  className={buttonStyles.secondary}
                  onClick={() => {
                    close();
                    push({ from: customFrom, to: customTo });
                  }}
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </Popover>
      </div>
      <span className="relative inline-block">
        <select
          aria-label="Product"
          value={product}
          onChange={(e) => push({ product: e.target.value })}
          style={{ width: 140 }}
          className="border-admin-field text-admin-text h-10 cursor-pointer appearance-none truncate rounded-[8px] border bg-white pr-[46px] pl-3 text-[14px]"
        >
          <option value="">All products</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <span className="text-admin-muted pointer-events-none absolute top-3 right-3">
          <Icon name="down" size={16} />
        </span>
      </span>
    </div>
  );
}
