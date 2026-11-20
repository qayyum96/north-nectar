"use client";

import { cn } from "@northnectar/ui";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Icon } from "@/components/icon";
import { useToast } from "@/components/toast";
import { buttonStyles, fieldStyles } from "@/components/ui";
import { markUnread, reopenMessage, resolveMessage } from "./actions";

export function ResolveButton({ id, resolved }: { id: string; resolved: boolean }) {
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const run = (
    fn: () => ReturnType<typeof resolveMessage>,
    undo?: () => ReturnType<typeof resolveMessage>,
  ) =>
    start(async () => {
      const result = await fn();
      if (!result.ok) return toast.error(result.error);
      router.refresh();
      toast.show(
        result.message,
        undo
          ? {
              label: "Undo",
              onClick: () =>
                start(async () => {
                  await undo();
                  router.refresh();
                }),
            }
          : undefined,
      );
    });
  return resolved ? (
    <button
      type="button"
      disabled={pending}
      className={buttonStyles.secondary}
      onClick={() => run(() => reopenMessage(id))}
    >
      Reopen
    </button>
  ) : (
    <button
      type="button"
      disabled={pending}
      className={buttonStyles.secondary}
      onClick={() =>
        run(
          () => resolveMessage(id),
          () => reopenMessage(id),
        )
      }
    >
      <Icon name="check" size={16} />
      Mark as resolved
    </button>
  );
}

export function MarkUnreadButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await markUnread(id);
          router.push("/messages");
        })
      }
      className="text-admin-muted hover:text-admin-text cursor-pointer border-0 bg-transparent p-0 text-[14px] hover:underline"
    >
      Mark as unread
    </button>
  );
}

/**
 * Reply box. Replies go out from your own WhatsApp or email app (prefilled), so nothing paid is
 * needed. Email can move to sending from the admin once a domain and Resend are set up.
 */
export function ReplyBox({
  greeting,
  whatsappNumber,
  email,
  subject,
}: {
  greeting: string;
  whatsappNumber: string | null;
  email: string;
  subject: string;
}) {
  const [text, setText] = useState(greeting);
  const body = text.trim();
  const mailto = `mailto:${email}?subject=${encodeURIComponent(`Re: ${subject}`)}&body=${encodeURIComponent(`${body}\n\nNorth Nectar\nnorthnectar.com`)}`;
  const wa = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(body)}`
    : null;
  return (
    <div className="border-admin-line mt-auto flex flex-col gap-[10px] border-t px-5 py-4">
      <textarea
        aria-label="Reply"
        placeholder="Write a reply..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        className={cn(fieldStyles.textarea, "min-h-24")}
      />
      <div className="flex flex-wrap justify-end gap-2">
        {wa ? (
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonStyles.secondary, !body && "pointer-events-none opacity-50")}
          >
            <Icon name="whatsapp" size={16} />
            Reply on WhatsApp
          </a>
        ) : null}
        <a
          href={mailto}
          className={cn(buttonStyles.primary, !body && "pointer-events-none opacity-50")}
        >
          <Icon name="mail" size={16} />
          Reply by email
        </a>
      </div>
    </div>
  );
}
