import { CONTACT_SUBJECTS } from "@northnectar/types";
import { getCurrentStaff } from "@/lib/auth";
import { exportColumns } from "@/lib/export-range";
import { dateTimeLabel, formatPhone } from "@/lib/format";
import { label } from "@/lib/orders";
import { fetchAll } from "@/lib/fetch-all";
import { createClient } from "@/lib/supabase/server";
import { type Cell, exportResponse, parseFormat } from "@/lib/table-export";

const COLUMNS = ["date", "name", "email", "phone", "subject", "message", "status"] as const;
type Col = (typeof COLUMNS)[number];
const HEADERS: Record<Col, string> = {
  date: "Date",
  name: "Name",
  email: "Email",
  phone: "Phone",
  subject: "Subject",
  message: "Message",
  status: "Status",
};

export async function GET(request: Request) {
  if (!(await getCurrentStaff())) return new Response("Not signed in", { status: 401 });
  const params = new URL(request.url).searchParams;
  const cols = exportColumns(params, COLUMNS);
  const supabase = await createClient();
  const build = () => {
    let query = supabase
      .from("contact_messages")
      .select("name, email, phone, subject, message, status, read_at, created_at")
      .order("created_at", { ascending: false })
      .order("id");
    if (params.get("tab") === "unread") query = query.is("read_at", null);
    if (params.get("tab") === "resolved") query = query.eq("status", "resolved");
    return query;
  };
  let data: unknown[];
  try {
    data = await fetchAll((a, b) => build().range(a, b));
  } catch {
    return new Response("Export failed", { status: 500 });
  }

  type Row = {
    name: string;
    email: string;
    phone: string | null;
    subject: string;
    message: string;
    status: string;
    created_at: string;
  };
  const rows = (data as Row[]).map((m) =>
    cols.map((c): Cell => {
      switch (c) {
        case "date":
          return dateTimeLabel(m.created_at);
        case "name":
          return m.name;
        case "email":
          return m.email;
        case "phone":
          return formatPhone(m.phone);
        case "subject":
          return CONTACT_SUBJECTS.find((s) => s.value === m.subject)?.label ?? m.subject;
        case "message":
          return m.message;
        case "status":
          return label(m.status);
      }
    }),
  );
  return exportResponse(
    { title: "Messages", slug: "messages", header: cols.map((c) => HEADERS[c]), rows },
    parseFormat(params.get("format")),
  );
}
