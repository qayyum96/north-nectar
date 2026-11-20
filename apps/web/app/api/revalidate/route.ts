import { timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { catalog } from "@/lib/catalog";

/**
 * Called by the admin after a product or category is saved, so the website shows the change
 * straight away instead of waiting for the hourly refresh. Protected by REVALIDATE_SECRET.
 */
export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  const given = Buffer.from(request.headers.get("x-revalidate-secret") ?? "");
  const expected = Buffer.from(secret ?? "");
  // Compare byte lengths (timingSafeEqual throws on a mismatch, e.g. a non-ASCII header).
  const ok =
    expected.length > 0 && given.length === expected.length && timingSafeEqual(given, expected);
  if (!ok) return Response.json({ ok: false }, { status: 401 });

  catalog.clearCache?.();
  revalidatePath("/", "layout");
  return Response.json({ ok: true });
}
