import "server-only";

/**
 * Supabase returns at most 1,000 rows per request (and `.limit()` can't raise that), so totals,
 * reports and exports read every page. `page(from, to)` must return a query with a stable order
 * (for example `.order("created_at").order("id")`) and `.range(from, to)` applied.
 */
export async function fetchAll<T>(
  page: (from: number, to: number) => PromiseLike<{ data: unknown; error: unknown }>,
  { size = 1000, max = 200_000 }: { size?: number; max?: number } = {},
): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; from < max; from += size) {
    const { data, error } = await page(from, from + size - 1);
    if (error) throw error instanceof Error ? error : new Error(JSON.stringify(error));
    const rows = (data ?? []) as T[];
    out.push(...rows);
    if (rows.length < size) break;
  }
  return out;
}
