import { getCurrentStaff } from "@/lib/auth";
import { loadDashboard, parseRange } from "@/lib/dashboard";
import { addDays, dayLabel } from "@/lib/time";

const csvCell = (v: string | number) => {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Dashboard export: headline numbers and the daily series as CSV (opens in Excel). */
export async function GET(request: Request) {
  const staff = await getCurrentStaff();
  if (!staff) return new Response("Not signed in", { status: 401 });

  const params = Object.fromEntries(new URL(request.url).searchParams);
  const range = parseRange(params);
  const data = await loadDashboard(range);

  const rows: (string | number)[][] = [
    ["North Nectar dashboard", range.label],
    [],
    ["Metric", "Value", "Change vs previous period (%)"],
    ...data.kpis.map((k) => [k.label, k.value ?? "", k.change ?? ""]),
    [],
    ["Day", "Revenue (PKR)", "Orders", "Previous period revenue (PKR)", "Previous period orders"],
    ...data.series.current.revenue.map((rev, i) => [
      dayLabel(addDays(range.start, i)),
      rev,
      data.series.current.orders[i] ?? 0,
      data.series.previous.revenue[i] ?? 0,
      data.series.previous.orders[i] ?? 0,
    ]),
  ];
  const csv = rows.map((r) => r.map(csvCell).join(",")).join("\r\n");
  const stamp = new Date().toISOString().slice(0, 10);
  // Byte order mark so Excel opens the file as UTF-8.
  return new Response(String.fromCharCode(0xfeff) + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="north-nectar-dashboard-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
