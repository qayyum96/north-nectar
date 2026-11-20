import "server-only";
import { cookies } from "next/headers";
import { placedOrderSchema, type PlacedOrder } from "./order-summary";

const COOKIE = "nn-last-order";
/** Browsers cap cookies at about 4 KB; leave room for the name and attributes. */
const MAX_BYTES = 3800;

/** Remembers the order just placed so /order-confirmation can show it (one day, this browser only). */
export async function rememberOrder(order: PlacedOrder): Promise<void> {
  let value = JSON.stringify(order);
  if (Buffer.byteLength(encodeURIComponent(value)) > MAX_BYTES) {
    // Very large orders: drop thumbnails first, then trim the visible lines.
    const slim = { ...order, lines: order.lines.map((l) => ({ ...l, image: "" })) };
    value = JSON.stringify(slim);
    while (Buffer.byteLength(encodeURIComponent(value)) > MAX_BYTES && slim.lines.length > 1) {
      slim.lines = slim.lines.slice(0, -1);
      value = JSON.stringify(slim);
    }
  }
  const jar = await cookies();
  jar.set(COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
}

/** The last order placed in this browser, or null if there is none (or it can't be read). */
export async function readLastOrder(): Promise<PlacedOrder | null> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  try {
    const parsed = placedOrderSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
