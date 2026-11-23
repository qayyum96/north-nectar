import "server-only";

/**
 * Asks the website to refresh its catalogue pages now (instead of within the hour). Failures are
 * logged, never thrown: the save already succeeded and the site refreshes on its own anyway.
 *
 * REVALIDATE_EXTRA_URLS (optional, comma-separated) lists more shops to refresh, e.g. the live
 * https://northnectar.com when products are edited from the admin running on this computer
 * (both edit the same database, but each admin otherwise refreshes only its own shop).
 * Returns whether the main shop (NEXT_PUBLIC_STOREFRONT_URL) was refreshed.
 */
export async function revalidateStorefront(): Promise<boolean> {
  const base = process.env.NEXT_PUBLIC_STOREFRONT_URL;
  const secret = process.env.REVALIDATE_SECRET;
  if (!base || !secret) return false;
  const extra = (process.env.REVALIDATE_EXTRA_URLS ?? "")
    .split(",")
    .map((u) => u.trim())
    .filter(Boolean);
  const urls = [...new Set([base, ...extra].map((u) => u.replace(/\/+$/, "")))];

  const results = await Promise.all(
    urls.map(async (url) => {
      try {
        const res = await fetch(`${url}/api/revalidate`, {
          method: "POST",
          headers: { "x-revalidate-secret": secret },
          cache: "no-store",
          // Generous: on the free plan the shop's server may need several seconds to wake up.
          signal: AbortSignal.timeout(20_000),
        });
        if (!res.ok) console.warn(`[admin] website refresh failed for ${url}: ${res.status}`);
        return res.ok;
      } catch (error) {
        console.warn(
          `[admin] website refresh failed for ${url}:`,
          error instanceof Error ? error.message : error,
        );
        return false;
      }
    }),
  );
  return results[0] ?? false;
}
