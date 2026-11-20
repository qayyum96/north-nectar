import { getCurrentStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { exportResponse } from "@/lib/table-export";

/** The rows of an import that were not imported, with the reason, as CSV. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getCurrentStaff();
  if (!staff || staff.role === "staff") return new Response("Not allowed", { status: 403 });
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("imports")
    .select("file_name, errors")
    .eq("id", id)
    .maybeSingle<{ file_name: string; errors: { row: number; message: string }[] }>();
  if (!data) return new Response("Not found", { status: 404 });
  return exportResponse(
    {
      title: `Errors in ${data.file_name}`,
      slug: "import-errors",
      header: ["Row in file", "Problem"],
      rows: data.errors.map((e) => [e.row, e.message]),
    },
    "csv",
  );
}
