import { redirect } from "next/navigation";
import { getCurrentStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/** Opens a purchase's bill photo or PDF through a short-lived link (the bucket is private). */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getCurrentStaff();
  if (!staff || staff.role === "staff") return new Response("Not allowed", { status: 403 });
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("purchases")
    .select("bill_path")
    .eq("id", id)
    .maybeSingle<{ bill_path: string | null }>();
  if (!data?.bill_path) return new Response("No bill for this purchase", { status: 404 });
  const { data: signed, error } = await supabase.storage
    .from("bills")
    .createSignedUrl(data.bill_path, 120);
  if (error || !signed) return new Response("The bill couldn't be opened", { status: 500 });
  redirect(signed.signedUrl);
}
