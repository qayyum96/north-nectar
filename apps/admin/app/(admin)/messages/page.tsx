import { CONTACT_SUBJECTS } from "@northnectar/types";
import { cn } from "@northnectar/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { ExportButton } from "@/components/export-dialog";
import { Icon } from "@/components/icon";
import { EmptyState, PageBody, PageHeader, Segmented, StatusBadge } from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { dateTimeLabel, firstName, formatPhone, formatPkr, whatsappNumber } from "@/lib/format";
import { label } from "@/lib/orders";
import { createClient } from "@/lib/supabase/server";
import { shortWhen } from "@/lib/time";
import { MarkUnreadButton, ReplyBox, ResolveButton } from "./message-client";

export const metadata: Metadata = { title: "Messages" };

interface MessageRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: "open" | "resolved";
  source: string | null;
  related_order_id: string | null;
  read_at: string | null;
  created_at: string;
}

const topic = (s: string) => CONTACT_SUBJECTS.find((c) => c.value === s)?.label ?? label(s);

const TABS = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "resolved", label: "Resolved" },
] as const;

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; id?: string }>;
}) {
  await requireStaff();
  const sp = await searchParams;
  const tab = TABS.some((t) => t.key === sp.tab) ? (sp.tab as (typeof TABS)[number]["key"]) : "all";
  const supabase = await createClient();

  let query = supabase
    .from("contact_messages")
    .select(
      "id, name, email, phone, subject, message, status, source, related_order_id, read_at, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(100);
  if (tab === "unread") query = query.is("read_at", null);
  if (tab === "resolved") query = query.eq("status", "resolved");
  const { data } = await query;
  const list = (data ?? []) as MessageRow[];

  // An explicitly opened message (?id=) is marked as read; it may sit outside the current tab.
  let current: MessageRow | undefined =
    list.find((m) => m.id === sp.id) ?? (sp.id ? undefined : list[0]);
  if (sp.id && !current && /^[0-9a-f-]{36}$/i.test(sp.id)) {
    const { data: one } = await supabase
      .from("contact_messages")
      .select(
        "id, name, email, phone, subject, message, status, source, related_order_id, read_at, created_at",
      )
      .eq("id", sp.id)
      .maybeSingle();
    current = (one as MessageRow | null) ?? undefined;
  }
  if (current && sp.id === current.id && !current.read_at) {
    await supabase
      .from("contact_messages")
      .update({ read_at: new Date().toISOString() })
      .eq("id", current.id);
    const readAt = new Date().toISOString();
    current = { ...current, read_at: readAt };
    for (const m of list) if (m.id === current.id) m.read_at = readAt;
  }

  // Related order: the one linked by the website, or an order number mentioned in the message.
  let related: { number: string; status: string; total: number } | null = null;
  if (current) {
    const mentioned = /#?\b(NN\d{3,9})\b/i.exec(current.message)?.[1]?.toUpperCase();
    const q = supabase.from("orders").select("number, fulfilment_status, total");
    const { data: o } = current.related_order_id
      ? await q.eq("id", current.related_order_id).maybeSingle()
      : mentioned
        ? await q.eq("number", mentioned).maybeSingle()
        : { data: null };
    if (o) {
      const row = o as { number: string; fulfilment_status: string; total: number };
      related = { number: row.number, status: row.fulfilment_status, total: row.total };
    }
  }

  const href = (params: { tab?: string; id?: string }) => {
    const q = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v) as [string, string][],
    );
    const s = q.toString();
    return s ? `/messages?${s}` : "/messages";
  };
  const tabParam = tab === "all" ? undefined : tab;
  const showDetailOnPhone = !!sp.id;

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Website" }, { label: "Messages" }]}
        title="Messages"
        subtitle="From the contact form on northnectar.com"
        actions={
          <ExportButton
            what="messages"
            singular="message"
            endpoint="/export/messages"
            dateRange={false}
            filterQuery={tabParam ? `tab=${tabParam}` : ""}
            columns={[
              { key: "date", label: "Date", on: true },
              { key: "name", label: "Name", on: true },
              { key: "email", label: "Email", on: true },
              { key: "phone", label: "Phone", on: true },
              { key: "subject", label: "Subject", on: true },
              { key: "message", label: "Message", on: true },
              { key: "status", label: "Status", on: true },
            ]}
          />
        }
      />
      <PageBody>
        <div className="flex flex-wrap items-stretch gap-4">
          <div className={cn("min-w-0 flex-[1_1_340px]", showDetailOnPhone && "hidden md:block")}>
            <section className="border-admin-line overflow-hidden rounded-[12px] border bg-white shadow-[0_1px_0_rgba(0,0,0,0.03)]">
              <div className="border-admin-line border-b px-4 py-3">
                <Segmented
                  label="Show messages"
                  items={TABS.map((t) => ({
                    label: t.label,
                    href: href({ tab: t.key === "all" ? undefined : t.key }),
                    active: t.key === tab,
                  }))}
                />
              </div>
              {list.length === 0 ? (
                <div className="py-10">
                  <EmptyState
                    icon="messages"
                    title={
                      tab === "unread"
                        ? "No unread messages"
                        : tab === "resolved"
                          ? "Nothing resolved yet"
                          : "No messages yet"
                    }
                  >
                    {tab === "all" ? "Messages from the website's contact form appear here." : null}
                  </EmptyState>
                </div>
              ) : (
                <ul className="m-0 flex list-none flex-col p-0">
                  {list.map((m) => {
                    const unread = !m.read_at;
                    const on = current?.id === m.id;
                    return (
                      <li key={m.id}>
                        <Link
                          href={href({ tab: tabParam, id: m.id })}
                          scroll={false}
                          aria-current={on ? "true" : undefined}
                          className={cn(
                            "text-admin-text flex items-start gap-3 border-b border-[#efefed] px-4 py-[14px]",
                            on
                              ? "bg-[#f3f7f1] shadow-[inset_3px_0_0_#234c2e]"
                              : "bg-white hover:bg-[#fafaf9]",
                          )}
                        >
                          <span
                            aria-hidden="true"
                            className={cn(
                              "mt-[7px] size-2 shrink-0 rounded-full",
                              unread ? "bg-[#2f7d45]" : "bg-transparent",
                            )}
                          />
                          <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
                            <span className="flex justify-between gap-2">
                              <span className={unread ? "font-bold" : "font-medium"}>
                                {m.name}
                                {unread ? <span className="sr-only"> (unread)</span> : null}
                              </span>
                              <span className="text-admin-muted text-[14px] whitespace-nowrap">
                                {shortWhen(m.created_at)}
                              </span>
                            </span>
                            <span className={unread ? "font-bold" : "font-medium"}>
                              {topic(m.subject)}
                            </span>
                            <span className="text-admin-muted truncate">
                              {m.message.replace(/\s+/g, " ")}
                            </span>
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>

          <div
            className={cn("min-w-0 flex-[1.8_1_480px]", !showDetailOnPhone && "hidden md:block")}
          >
            {current ? (
              <section className="border-admin-line flex h-full flex-col overflow-hidden rounded-[12px] border bg-white shadow-[0_1px_0_rgba(0,0,0,0.03)]">
                <div className="border-admin-line flex flex-wrap justify-between gap-3 border-b px-5 py-[18px]">
                  <span className="flex min-w-0 flex-[1_1_240px] flex-col gap-1">
                    <Link
                      href={href({ tab: tabParam })}
                      className="text-admin-muted mb-1 inline-flex items-center gap-1 text-[14px] md:hidden"
                    >
                      ← All messages
                    </Link>
                    <h2 className="m-0 text-[17px] leading-[1.5] font-bold">
                      {topic(current.subject)}
                    </h2>
                    <span className="text-admin-muted break-words">
                      {[current.name, current.email, formatPhone(current.phone)]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                  <span className="flex shrink-0 flex-wrap items-center gap-2">
                    <StatusBadge status={current.status} />
                    <ResolveButton id={current.id} resolved={current.status === "resolved"} />
                  </span>
                </div>
                <div className="flex flex-col gap-[14px] p-5">
                  <span className="text-admin-muted flex flex-wrap justify-between gap-2">
                    <span>
                      {dateTimeLabel(current.created_at)} · Subject: {topic(current.subject)} · via
                      Contact form
                    </span>
                    {current.read_at ? <MarkUnreadButton id={current.id} /> : null}
                  </span>
                  <p className="m-0 text-[15px] leading-[1.7] break-words whitespace-pre-line">
                    {current.message}
                  </p>
                  {related ? (
                    <Link
                      href={`/orders/${related.number}`}
                      className="border-admin-line inline-flex items-center gap-2 self-start rounded-[12px] border bg-[#fafaf8] px-3 py-[10px] text-[14px] hover:bg-[#f3f3f0]"
                    >
                      <Icon name="orders" size={16} />
                      Related order <strong>#{related.number}</strong> · {label(related.status)} ·{" "}
                      {formatPkr(related.total)}
                    </Link>
                  ) : null}
                </div>
                <ReplyBox
                  key={current.id}
                  greeting={`Hi ${firstName(current.name)}, thanks for getting in touch.`}
                  whatsappNumber={whatsappNumber(current.phone)}
                  email={current.email}
                  subject={topic(current.subject)}
                />
              </section>
            ) : (
              <section className="border-admin-line grid h-full min-h-[300px] place-items-center rounded-[12px] border bg-white">
                <EmptyState icon="messages" title="Pick a message to read it" />
              </section>
            )}
          </div>
        </div>
      </PageBody>
    </>
  );
}
