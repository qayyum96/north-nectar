import { addDays, isDay, startOfDayPk } from "./time";

/**
 * Date range from an export dialog: today | 7d | 30d | custom (from/to as YYYY-MM-DD) | all.
 * Returns ISO bounds for created_at, or nulls for "all time".
 */
export function exportRange(params: URLSearchParams): {
  from: string | null;
  to: string | null;
  label: string;
} {
  const range = params.get("range") ?? "all";
  const today = startOfDayPk(new Date());
  if (range === "today") return { from: today.toISOString(), to: null, label: "today" };
  if (range === "7d")
    return { from: addDays(today, -6).toISOString(), to: null, label: "last 7 days" };
  if (range === "30d")
    return { from: addDays(today, -29).toISOString(), to: null, label: "last 30 days" };
  if (range === "custom") {
    const f = params.get("from");
    const t = params.get("to");
    return {
      from: f && isDay(f) ? new Date(`${f}T00:00:00+05:00`).toISOString() : null,
      to: t && isDay(t) ? addDays(new Date(`${t}T00:00:00+05:00`), 1).toISOString() : null,
      label: [f, t].filter(Boolean).join(" to ") || "all time",
    };
  }
  return { from: null, to: null, label: "all time" };
}

/** Requested columns ("cols=a,b,c"), kept in the order the table defines them. */
export function exportColumns<T extends string>(params: URLSearchParams, all: readonly T[]): T[] {
  const wanted = new Set((params.get("cols") ?? "").split(","));
  const picked = all.filter((c) => wanted.has(c));
  return picked.length > 0 ? picked : [...all];
}

/** "ids=a,b" (uuids only). */
export function exportIds(params: URLSearchParams): string[] {
  return (params.get("ids") ?? "")
    .split(",")
    .filter((id) => /^[0-9a-f-]{36}$/i.test(id))
    .slice(0, 1000);
}
