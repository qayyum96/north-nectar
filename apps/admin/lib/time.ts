/** Dates in Pakistan time, formatted like the admin mockup. */
export const TIME_ZONE = "Asia/Karachi";

/** Intl puts a narrow no-break space before "am"/"pm"; the mockup uses a normal space. */
const NARROW_SPACE = new RegExp(String.fromCharCode(0x202f), "g");

const dayKey = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(d);

/** "3:02 pm" today, "Yesterday", otherwise "18 Nov" (or "18 Nov 2025" in another year). */
export function shortWhen(iso: string, now = new Date()): string {
  const d = new Date(iso);
  if (dayKey(d) === dayKey(now)) {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: TIME_ZONE,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
      .format(d)
      .replace(NARROW_SPACE, " ")
      .toLowerCase();
  }
  const yesterday = new Date(now.getTime() - 86_400_000);
  if (dayKey(d) === dayKey(yesterday)) return "Yesterday";
  const sameYear = d.getUTCFullYear() === now.getUTCFullYear();
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
  }).format(d);
}

/** "Friday, 20 Nov 2026" */
export function longToday(now = new Date()): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  })
    .format(now)
    .replace(/^(\w+) /, "$1, ");
}

/** Midnight (start of day) in Pakistan time for the given date, as a UTC Date. */
export function startOfDayPk(d: Date): Date {
  const key = dayKey(d); // YYYY-MM-DD in Pakistan
  // Pakistan is UTC+5 all year (no daylight saving).
  return new Date(`${key}T00:00:00+05:00`);
}

export function addDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * 86_400_000);
}

/** "21 Oct" */
export function dayLabel(d: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    day: "numeric",
    month: "short",
  }).format(d);
}
