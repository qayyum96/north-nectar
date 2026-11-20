import { formatPkr } from "@northnectar/ui";
import { TIME_ZONE } from "./time";

export { formatPkr };

/** Intl puts a narrow no-break space before "am"/"pm"; the mockup uses a normal space. */
const NARROW_SPACE = new RegExp(String.fromCharCode(0x202f), "g");

/** "20 Nov 2026" */
export function dateLabel(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

/** "2:15 pm" */
export function timeLabel(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
    .format(new Date(iso))
    .replace(NARROW_SPACE, " ")
    .toLowerCase();
}

/** "20 Nov 2026, 2:15 pm" */
export function dateTimeLabel(iso: string): string {
  return `${dateLabel(iso)}, ${timeLabel(iso)}`;
}

/** "Aug 2026" */
export function monthLabel(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

/** Timeline time: "2:40 pm" today, otherwise "18 Nov, 2:40 pm". */
export function eventTime(iso: string, now = new Date()): string {
  const key = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(d);
  const d = new Date(iso);
  if (key(d) === key(now)) return timeLabel(iso);
  const day = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    day: "numeric",
    month: "short",
  }).format(d);
  return `${day}, ${timeLabel(iso)}`;
}

/** "03211234890" or "+92 321 1234890" -> "0321 1234890". Unknown formats are returned as typed. */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  const local = digits.startsWith("92") && digits.length === 12 ? `0${digits.slice(2)}` : digits;
  if (/^03\d{9}$/.test(local)) return `${local.slice(0, 4)} ${local.slice(4)}`;
  return phone.trim();
}

/** International digits for wa.me ("923211234890"), or null when it isn't a Pakistani mobile. */
export function whatsappNumber(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (/^03\d{9}$/.test(digits)) return `92${digits.slice(1)}`;
  if (/^923\d{9}$/.test(digits)) return digits;
  if (/^3\d{9}$/.test(digits)) return `92${digits}`;
  return null;
}

/** One-tap WhatsApp chat with an optional prefilled message (free, no WhatsApp API needed). */
export function whatsappLink(phone: string | null | undefined, text?: string): string | null {
  const number = whatsappNumber(phone);
  if (!number) return null;
  return `https://wa.me/${number}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export function firstName(name: string | null | undefined): string {
  return (name ?? "").trim().split(/\s+/)[0] || "there";
}

/** Product images may be stored as site paths ("/images/...") or full URLs. */
export function imageSrc(src: string | null | undefined): string | null {
  if (!src) return null;
  if (/^https?:\/\//.test(src)) return src;
  return `${process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "https://northnectar.com"}${src}`;
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n.toLocaleString("en-US")} ${n === 1 ? one : many}`;
}
