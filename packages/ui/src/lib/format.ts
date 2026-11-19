const grouping = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const NBSP = String.fromCharCode(160);

/**
 * Formats whole rupees the way the mockup shows them: "Rs 1,350".
 * Uses a non-breaking space so the amount never wraps away from "Rs".
 * The format is fixed (not locale-dependent) so server and client output always match.
 */
export function formatPkr(amount: number): string {
  return `Rs${NBSP}${grouping.format(Math.round(amount))}`;
}

/** Price per 100g, e.g. 1350 for 250g -> "Rs 540 per 100g". */
export function formatPricePer100g(price: number, grams: number | null | undefined): string | null {
  if (!grams || grams <= 0) return null;
  return `${formatPkr((price / grams) * 100)} per 100g`;
}
