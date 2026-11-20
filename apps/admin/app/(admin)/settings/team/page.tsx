import type { Metadata } from "next";
import { initials, requireStaff } from "@/lib/auth";
import { loadTeam } from "@/lib/settings";
import { noSept } from "@/lib/time";
import { TeamForm } from "./team-form";

export const metadata: Metadata = { title: "Team and roles" };

function lastActive(iso: string | null, invitedAt: string | null, invited: boolean): string {
  if (invited) {
    const d = invitedAt ? new Date(invitedAt) : null;
    return d
      ? `Invite sent ${noSept(new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "Asia/Karachi" }).format(d))}`
      : "Invited";
  }
  if (!iso) return "Not yet";
  const minutes = (Date.parse(new Date().toISOString()) - Date.parse(iso)) / 60_000;
  if (minutes < 10) return "Online now";
  if (minutes < 60) return `${Math.round(minutes)} minutes ago`;
  if (minutes < 24 * 60) return `${Math.round(minutes / 60)} hours ago`;
  if (minutes < 48 * 60) return "Yesterday";
  return noSept(
    new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      timeZone: "Asia/Karachi",
    }).format(new Date(iso)),
  );
}

export default async function TeamSettingsPage() {
  const me = await requireStaff(["owner"]);
  const team = await loadTeam();
  const order = { owner: 0, manager: 1, staff: 2 } as const;
  const members = [...team]
    .sort(
      (a, b) =>
        Number(b.user_id === me.userId) - Number(a.user_id === me.userId) ||
        order[a.role] - order[b.role],
    )
    .map((m) => ({
      userId: m.user_id,
      name: m.name || m.email.split("@")[0]!,
      email: m.email,
      initials: initials(m.name || m.email),
      role: m.role,
      invited: m.status === "invited",
      lastActive:
        m.user_id === me.userId
          ? "Online now"
          : lastActive(m.last_active_at, m.invited_at, m.status === "invited"),
      isMe: m.user_id === me.userId,
    }));
  return <TeamForm members={members} />;
}
