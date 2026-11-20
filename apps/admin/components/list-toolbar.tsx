"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { Icon } from "./icon";
import { Popover, PopoverItem } from "./menus";

export interface FilterSelect {
  name: string;
  label: string;
  /** Fixed width in px (the mockup's dropdowns are 140-166px). */
  width?: number;
  /** Options or option groups. */
  options: (
    | { value: string; label: string }
    | { group: string; options: { value: string; label: string }[] }
  )[];
}

/** Writes a list preference (hidden columns, density) to a cookie the server reads. */
export function setListPref(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000; samesite=lax`;
}

/**
 * Card toolbar above a list (mockup): search, filter dropdowns, then Sort, Columns, row density
 * and Export on the right. Filters live in the URL so a filtered list can be bookmarked.
 */
export function ListToolbar({
  searchLabel,
  filters,
  sorts,
  columns,
  columnsCookie,
  density,
  right,
}: {
  searchLabel: string;
  filters: FilterSelect[];
  sorts?: { value: string; label: string }[];
  columns?: { key: string; label: string; on: boolean }[];
  columnsCookie?: string;
  density?: "comfortable" | "compact";
  right?: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [, start] = useTransition();

  const push = (changes: Record<string, string>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(changes)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    next.delete("page");
    const s = next.toString();
    start(() => router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false }));
  };

  const sort = params.get("sort") ?? sorts?.[0]?.value ?? "";
  const selectClass =
    "border-admin-field text-admin-text h-10 cursor-pointer appearance-none truncate rounded-[8px] border bg-white pr-[46px] pl-3 text-[14px]";

  return (
    <div className="flex flex-wrap items-center justify-between gap-[10px] px-4 py-[14px]">
      <div className="flex min-w-0 flex-[1_1_520px] flex-wrap items-center gap-2">
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            push({ q: q.trim() });
          }}
          className="border-admin-field text-admin-muted flex h-10 max-w-[360px] flex-[1_1_260px] items-center gap-2 rounded-[8px] border bg-white px-3"
        >
          <Icon name="search" size={16} />
          <input
            type="search"
            aria-label={searchLabel}
            placeholder={searchLabel}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              if (e.target.value === "" && params.get("q")) push({ q: "" });
            }}
            className="text-admin-text min-w-0 flex-1 border-0 bg-transparent text-[14px] outline-none"
          />
        </form>
        {filters.map((f) => (
          <span key={f.name} className="relative inline-block">
            <select
              aria-label={f.label}
              value={params.get(f.name) ?? ""}
              onChange={(e) => push({ [f.name]: e.target.value })}
              style={{ width: f.width ?? 140 }}
              className={selectClass}
            >
              <option value="">{f.label}</option>
              {f.options.map((o) =>
                "group" in o ? (
                  <optgroup key={o.group} label={o.group}>
                    {o.options.map((g) => (
                      <option key={g.value} value={g.value}>
                        {g.label}
                      </option>
                    ))}
                  </optgroup>
                ) : (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ),
              )}
            </select>
            <span className="text-admin-muted pointer-events-none absolute top-3 right-3">
              <Icon name="down" size={16} />
            </span>
          </span>
        ))}
      </div>
      <div className="hidden flex-wrap items-center gap-2 md:flex">
        {sorts ? (
          <Popover label="Sort" icon="sort">
            {(close) =>
              sorts.map((s) => (
                <PopoverItem
                  key={s.value}
                  active={s.value === sort}
                  onSelect={() => {
                    close();
                    push({ sort: s.value === sorts[0]!.value ? "" : s.value });
                  }}
                >
                  {s.label}
                </PopoverItem>
              ))
            }
          </Popover>
        ) : null}
        {columns && columnsCookie ? (
          <Popover label="Columns" icon="columns">
            {() => (
              <div className="flex flex-col gap-[2px] p-1">
                <span className="text-admin-muted px-[6px] pb-1 text-[13px]">Show columns</span>
                {columns.map((c) => (
                  <label
                    key={c.key}
                    className="hover:bg-admin-bg flex h-9 cursor-pointer items-center gap-2 rounded-[8px] px-[6px]"
                  >
                    <input
                      type="checkbox"
                      defaultChecked={c.on}
                      onChange={(e) => {
                        const hidden = new Set(columns.filter((x) => !x.on).map((x) => x.key));
                        if (e.target.checked) hidden.delete(c.key);
                        else hidden.add(c.key);
                        setListPref(columnsCookie, [...hidden].join(","));
                        start(() => router.refresh());
                      }}
                      className="size-4 accent-forest-600"
                    />
                    {c.label}
                  </label>
                ))}
              </div>
            )}
          </Popover>
        ) : null}
        {density ? (
          <Popover label="Row density" icon="rows" iconOnly>
            {(close) =>
              (["comfortable", "compact"] as const).map((d) => (
                <PopoverItem
                  key={d}
                  active={density === d}
                  onSelect={() => {
                    close();
                    setListPref("nn-density", d);
                    start(() => router.refresh());
                  }}
                >
                  {d === "comfortable" ? "Comfortable rows" : "Compact rows"}
                </PopoverItem>
              ))
            }
          </Popover>
        ) : null}
        {right}
      </div>
    </div>
  );
}

/** "Showing 20 of 54 orders" with Previous / Next. */
export function Pagination({
  shown,
  total,
  noun,
  page,
  pages,
}: {
  shown: number;
  total: number;
  noun: string;
  page: number;
  pages: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const go = (p: number) => {
    const next = new URLSearchParams(params.toString());
    if (p <= 1) next.delete("page");
    else next.set("page", String(p));
    const s = next.toString();
    router.push(s ? `${pathname}?${s}` : pathname);
  };
  const btn =
    "border-admin-field text-admin-text inline-flex h-9 cursor-pointer items-center rounded-[8px] border bg-white px-3 text-[14px] font-semibold hover:bg-[#fafaf9] disabled:cursor-default disabled:opacity-50";
  return (
    <div className="text-admin-muted flex items-center justify-between gap-3 px-4 py-3 text-[14px]">
      <span>
        Showing {shown.toLocaleString("en-US")} of {total.toLocaleString("en-US")} {noun}
      </span>
      <span className="flex gap-[6px]">
        <button type="button" className={btn} disabled={page <= 1} onClick={() => go(page - 1)}>
          Previous
        </button>
        <button type="button" className={btn} disabled={page >= pages} onClick={() => go(page + 1)}>
          Next
        </button>
      </span>
    </div>
  );
}
