import { CONTACT_SUBJECTS } from "@northnectar/types";
import type { ReactNode } from "react";
import { AdminShell, type ShellNotification } from "@/components/shell/admin-shell";
import { initials, requireStaff } from "@/lib/auth";
import { navFor } from "@/lib/nav";
import { createClient } from "@/lib/supabase/server";
import { shortWhen } from "@/lib/time";

// Admin pages always show live data.
export const dynamic = "force-dynamic";

/** Every admin page: staff only, with the sidebar, counts and notifications. */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const staff = await requireStaff();
  const supabase = await createClient();

  const [pendingCount, unreadCount, pendingOrders, unreadMessages] = await Promise.all([
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("fulfilment_status", "pending"),
    supabase
      .from("contact_messages")
      .select("id", { count: "exact", head: true })
      .is("read_at", null),
    supabase
      .from("orders")
      .select("id, number, total, created_at, shipping_address")
      .eq("fulfilment_status", "pending")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("contact_messages")
      .select("id, name, subject, created_at")
      .is("read_at", null)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const notifications: (ShellNotification & { at: string })[] = [
    ...(pendingOrders.data ?? []).map((o) => ({
      id: `order-${o.id}`,
      kind: "order" as const,
      title: `New order #${o.number}`,
      detail: `${(o.shipping_address as { fullName?: string })?.fullName ?? "Customer"} · Rs ${Number(o.total).toLocaleString("en-US")}`,
      href: `/orders/${o.number}`,
      time: shortWhen(o.created_at),
      at: o.created_at,
    })),
    ...(unreadMessages.data ?? []).map((m) => ({
      id: `message-${m.id}`,
      kind: "message" as const,
      title: `Message from ${m.name}`,
      detail: CONTACT_SUBJECTS.find((c) => c.value === m.subject)?.label ?? m.subject,
      href: `/messages?id=${m.id}`,
      time: shortWhen(m.created_at),
      at: m.created_at,
    })),
  ]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 8);

  return (
    <AdminShell
      nav={navFor(staff.role)}
      counts={{ orders: pendingCount.count ?? 0, messages: unreadCount.count ?? 0 }}
      notifications={notifications.map(({ at: _at, ...n }) => n)}
      staff={{
        name: staff.name,
        email: staff.email,
        role: staff.role,
        initials: initials(staff.name),
      }}
      storefrontUrl={process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "https://northnectar.com"}
    >
      {children}
    </AdminShell>
  );
}
