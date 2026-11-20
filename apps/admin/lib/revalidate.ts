import "server-only";

/**
 * Asks the website to refresh its catalogue pages now (instead of within the hour). Failures are
 * logged, never thrown: the save already succeeded and the site refreshes on its own anyway.
 */
export async function revalidateStorefront(): Promise<boolean> {
  const base = process.env.NEXT_PUBLIC_STOREFRONT_URL;
  const secret = process.env.REVALIDATE_SECRET;
  if (!base || !secret) return false;
  try {
    const res = await fetch(`${base.replace(/\/$/, "")}/api/revalidate`, {
      method: "POST",
      headers: { "x-revalidate-secret": secret },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    return res.ok;
  } catch (error) {
    console.warn("[admin] website refresh failed:", error instanceof Error ? error.message : error);
    return false;
  }
}
