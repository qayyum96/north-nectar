const TIME_ZONE = "Asia/Karachi";

/** Calendar date in Pakistan time (orders placed late at night count for that day). */
function pakistanDate(at: Date): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(at);
  return new Date(`${parts}T12:00:00Z`);
}

/** Adds working days (Monday to Saturday; couriers don't deliver on Sunday). */
function addWorkingDays(start: Date, days: number): Date {
  const date = new Date(start);
  let added = 0;
  while (added < days) {
    date.setUTCDate(date.getUTCDate() + 1);
    if (date.getUTCDay() !== 0) added += 1;
  }
  return date;
}

const fmt = (date: Date, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", ...options })
    .format(date)
    // Newer browsers write September as "Sept" in en-GB.
    .replace(/Sept/, "Sep");

/**
 * Estimated delivery window, formatted like the mockup: "Tue 24 to Thu 26 Nov"
 * (or "Fri 28 Nov to Tue 2 Dec" across months).
 */
export function estimateDelivery(
  transitDays: readonly [number, number],
  placedAt: Date = new Date(),
): { from: string; to: string; label: string } {
  const start = pakistanDate(placedAt);
  const from = addWorkingDays(start, transitDays[0]);
  const to = addWorkingDays(start, transitDays[1]);
  const sameMonth = from.getUTCMonth() === to.getUTCMonth();
  const fromLabel = `${fmt(from, { weekday: "short" })} ${from.getUTCDate()}${sameMonth ? "" : ` ${fmt(from, { month: "short" })}`}`;
  const toLabel = `${fmt(to, { weekday: "short" })} ${to.getUTCDate()} ${fmt(to, { month: "short" })}`;
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
    label: `${fromLabel} to ${toLabel}`,
  };
}
