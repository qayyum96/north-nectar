"use client";

import { cn } from "@northnectar/ui";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { DangerButton, Dialog } from "@/components/dialog";
import { Icon } from "@/components/icon";
import { RowMenu } from "@/components/menus";
import { useToast } from "@/components/toast";
import {
  Avatar,
  Card,
  CardHeader,
  Field,
  PageBody,
  PageHeader,
  SelectBox,
  StatusBadge,
  buttonStyles,
  fieldStyles,
  tableStyles,
} from "@/components/ui";
import { inviteMember, newInviteLink, removeMember, saveRoles } from "../actions";
import { SettingsFrame } from "../settings-frame";

export interface MemberView {
  userId: string;
  name: string;
  email: string;
  initials: string;
  role: "owner" | "manager" | "staff";
  invited: boolean;
  lastActive: string;
  isMe: boolean;
}

const ACCESS = {
  owner: "Everything",
  manager: "Orders, products, inventory, reports",
  staff: "Orders, packing, messages",
} as const;
const ROLE_TEXT = {
  owner: "Everything, including payments, team and deleting data.",
  manager: "Orders, products, inventory, reports and messages.",
  staff: "Orders, packing and messages. No reports or settings.",
} as const;
const GRID = { gridTemplateColumns: "1.8fr 150px 2fr 1fr 40px" };

function LinkBox({ link, name }: { link: string; name: string }) {
  const toast = useToast();
  const message = `Assalam o Alaikum ${name.split(" ")[0]}, you're invited to the North Nectar admin. Open this link to set your password (it works once, for a limited time): ${link}`;
  return (
    <div className="flex flex-col gap-3">
      <p className="text-admin-muted m-0 leading-[1.6]">
        Send this link to {name.split(" ")[0]}. It works once and expires after a while; you can
        make a new one from the member&apos;s menu.
      </p>
      <input
        readOnly
        aria-label="Invite link"
        value={link}
        onFocus={(e) => e.target.select()}
        className={cn(fieldStyles.input, "text-[13px]")}
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={buttonStyles.secondary}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(link);
              toast.show("Link copied");
            } catch {
              toast.error("Couldn't copy. Select the link and copy it.");
            }
          }}
        >
          <Icon name="file" size={16} />
          Copy link
        </button>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(message)}`}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonStyles.secondary}
        >
          <Icon name="whatsapp" size={16} />
          Send on WhatsApp
        </a>
        <a
          href={`mailto:?subject=${encodeURIComponent("Your North Nectar admin invite")}&body=${encodeURIComponent(message)}`}
          className={buttonStyles.secondary}
        >
          <Icon name="mail" size={16} />
          Email it
        </a>
      </div>
    </div>
  );
}

function InviteDialog({ onClose }: { onClose: () => void }) {
  const [v, setV] = useState({ name: "", email: "", role: "staff" });
  const [link, setLink] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  return (
    <Dialog
      open
      onClose={onClose}
      title={link ? `Invite ready for ${v.name.split(" ")[0]}` : "Invite member"}
      width={560}
      footer={
        link ? (
          <button type="button" onClick={onClose} className={buttonStyles.primary}>
            Done
          </button>
        ) : (
          <>
            <button type="button" onClick={onClose} className={buttonStyles.secondary}>
              Cancel
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const r = await inviteMember(v);
                  if (!r.ok) return toast.error(r.error);
                  setLink(r.link);
                  router.refresh();
                })
              }
              className={cn(buttonStyles.primary, "disabled:opacity-60")}
            >
              <Icon name="plus" size={16} />
              {pending ? "Creating…" : "Create invite"}
            </button>
          </>
        )
      }
    >
      {link ? (
        <LinkBox link={link} name={v.name} />
      ) : (
        <div className="flex flex-col gap-[14px]">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Field label="Name" htmlFor="inv-name">
              <input
                id="inv-name"
                value={v.name}
                onChange={(e) => setV({ ...v, name: e.target.value })}
                className={fieldStyles.input}
              />
            </Field>
            <Field label="Email" htmlFor="inv-email">
              <input
                id="inv-email"
                type="email"
                value={v.email}
                onChange={(e) => setV({ ...v, email: e.target.value })}
                className={fieldStyles.input}
              />
            </Field>
          </div>
          <Field label="Role" htmlFor="inv-role" hint={ROLE_TEXT[v.role as keyof typeof ROLE_TEXT]}>
            <SelectBox
              id="inv-role"
              value={v.role}
              onChange={(e) => setV({ ...v, role: e.target.value })}
            >
              <option value="staff">Staff</option>
              <option value="manager">Manager</option>
              <option value="owner">Owner</option>
            </SelectBox>
          </Field>
        </div>
      )}
    </Dialog>
  );
}

export function TeamForm({ members }: { members: MemberView[] }) {
  const initial = Object.fromEntries(members.map((m) => [m.userId, m.role]));
  const [roles, setRoles] = useState<Record<string, MemberView["role"]>>(initial);
  const [saved, setSaved] = useState(initial);
  const [inviting, setInviting] = useState(false);
  const [removing, setRemoving] = useState<MemberView | null>(null);
  const [linkFor, setLinkFor] = useState<{ name: string; link: string } | null>(null);
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const changes = members
    .filter((m) => roles[m.userId] !== saved[m.userId])
    .map((m) => ({ userId: m.userId, role: roles[m.userId]! }));

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Settings" }, { label: "Team and roles" }]}
        title="Team and roles"
        subtitle="Who can use this admin and what they can do"
        actions={
          <>
            <button
              type="button"
              disabled={!changes.length || pending}
              onClick={() => setRoles(saved)}
              className={cn(buttonStyles.secondary, "disabled:opacity-50")}
            >
              Discard
            </button>
            <button
              type="button"
              disabled={!changes.length || pending}
              onClick={() =>
                start(async () => {
                  const r = await saveRoles(changes);
                  if (!r.ok) return toast.error(r.error);
                  setSaved(roles);
                  toast.show(r.message);
                  router.refresh();
                })
              }
              className={cn(buttonStyles.primary, "disabled:opacity-60")}
            >
              <Icon name="check" size={16} />
              {pending ? "Saving…" : "Save changes"}
            </button>
          </>
        }
      />
      <PageBody>
        <SettingsFrame active="team">
          <section className="border-admin-line overflow-hidden rounded-[12px] border bg-white shadow-[0_1px_0_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between gap-3 px-5 py-4">
              <h2 className="m-0 text-[16px] font-bold">Team members</h2>
              <button
                type="button"
                onClick={() => setInviting(true)}
                className="border-admin-field inline-flex h-9 cursor-pointer items-center gap-[6px] rounded-[8px] border bg-white px-3 text-[14px] font-semibold hover:bg-[#fafaf9]"
              >
                <Icon name="plus" size={16} />
                Invite member
              </button>
            </div>
            <div className="border-admin-line overflow-x-auto border-t">
              <div className="min-w-[760px]" role="table" aria-label="Team members">
                <div
                  role="row"
                  className={cn(tableStyles.head, tableStyles.headShade)}
                  style={GRID}
                >
                  <span role="columnheader">Member</span>
                  <span role="columnheader">Role</span>
                  <span role="columnheader">Access</span>
                  <span role="columnheader">Last active</span>
                  <span role="columnheader" aria-label="Actions" />
                </div>
                {members.map((m) => {
                  const role = roles[m.userId] ?? m.role;
                  return (
                    <div
                      key={m.userId}
                      role="row"
                      className={cn(tableStyles.row, tableStyles.rowShade, "min-h-[62px]")}
                      style={GRID}
                    >
                      <span role="cell" className="flex min-w-0 items-center gap-3">
                        <Avatar initials={m.initials} />
                        <span className="flex min-w-0 flex-col">
                          <span className="truncate font-semibold text-forest-600">
                            {m.name}
                            {m.isMe ? (
                              <span className="text-admin-muted font-normal"> (you)</span>
                            ) : null}
                          </span>
                          <span className="text-admin-muted truncate">{m.email}</span>
                        </span>
                      </span>
                      <span role="cell">
                        {m.isMe ? (
                          <StatusBadge status="active" label="Owner" />
                        ) : (
                          <span className="relative inline-block">
                            <select
                              aria-label={`Role for ${m.name}`}
                              value={role}
                              onChange={(e) =>
                                setRoles({
                                  ...roles,
                                  [m.userId]: e.target.value as MemberView["role"],
                                })
                              }
                              className={cn(
                                "h-7 cursor-pointer appearance-none rounded-full border-0 pr-7 pl-[10px] text-[14px] font-semibold",
                                role === "owner"
                                  ? "bg-[#e3f4e8] text-[#1d6b3a]"
                                  : role === "manager"
                                    ? "bg-[#e3eefc] text-[#1f5fae]"
                                    : m.invited
                                      ? "bg-[#fff1d6] text-[#8a5a00]"
                                      : "bg-[#ececea] text-[#555555]",
                              )}
                            >
                              <option value="owner">Owner</option>
                              <option value="manager">Manager</option>
                              <option value="staff">
                                {m.invited ? "Staff · invited" : "Staff"}
                              </option>
                            </select>
                            <span className="pointer-events-none absolute top-[6px] right-2 opacity-70">
                              <Icon name="down" size={14} />
                            </span>
                          </span>
                        )}
                      </span>
                      <span role="cell" className="text-admin-muted">
                        {ACCESS[role]}
                      </span>
                      <span role="cell" className="text-admin-muted whitespace-nowrap">
                        {m.lastActive}
                      </span>
                      <span role="cell">
                        {m.isMe ? null : (
                          <RowMenu
                            label={`More actions for ${m.name}`}
                            actions={[
                              // Links only for people who haven't joined yet; members who have
                              // use "Forgot password" themselves.
                              ...(m.invited
                                ? [
                                    {
                                      label: "New invite link",
                                      onSelect: () =>
                                        start(async () => {
                                          const r = await newInviteLink(m.userId);
                                          if (!r.ok) return toast.error(r.error);
                                          setLinkFor({ name: m.name, link: r.link });
                                        }),
                                    },
                                  ]
                                : []),
                              { label: "Remove", danger: true, onSelect: () => setRemoving(m) },
                            ]}
                          />
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
          <Card>
            <CardHeader title="Roles" />
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {(["owner", "manager", "staff"] as const).map((r) => (
                <div key={r} className="border-admin-line rounded-[12px] border p-[14px]">
                  <div className="font-bold">{r.charAt(0).toUpperCase() + r.slice(1)}</div>
                  <p className="text-admin-muted m-0 mt-2 leading-[1.6]">{ROLE_TEXT[r]}</p>
                </div>
              ))}
            </div>
          </Card>
        </SettingsFrame>
      </PageBody>
      {inviting ? <InviteDialog onClose={() => setInviting(false)} /> : null}
      {linkFor ? (
        <Dialog
          open
          onClose={() => setLinkFor(null)}
          title={`Link for ${linkFor.name.split(" ")[0]}`}
          width={560}
          footer={
            <button type="button" onClick={() => setLinkFor(null)} className={buttonStyles.primary}>
              Done
            </button>
          }
        >
          <LinkBox link={linkFor.link} name={linkFor.name} />
        </Dialog>
      ) : null}
      <Dialog
        open={!!removing}
        onClose={() => setRemoving(null)}
        title={removing ? `Remove ${removing.name}?` : "Remove member?"}
        footer={
          <>
            <button
              type="button"
              onClick={() => setRemoving(null)}
              className={buttonStyles.secondary}
            >
              Keep
            </button>
            <DangerButton
              disabled={pending}
              onClick={() =>
                removing &&
                start(async () => {
                  const r = await removeMember(removing.userId);
                  setRemoving(null);
                  if (!r.ok) return toast.error(r.error);
                  toast.show(r.message);
                  router.refresh();
                })
              }
            >
              Remove member
            </DangerButton>
          </>
        }
      >
        <p className="text-admin-muted m-0 leading-[1.6]">
          They lose access to the admin straight away. Their past work (orders, notes, stock
          changes) stays.
        </p>
      </Dialog>
    </>
  );
}
