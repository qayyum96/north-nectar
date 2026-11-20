"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { DangerButton, Dialog } from "@/components/dialog";
import { useToast } from "@/components/toast";
import { buttonStyles } from "@/components/ui";
import { undoImport } from "./actions";

export function UndoImportButton({ id, name }: { id: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="border-admin-field h-8 cursor-pointer rounded-[8px] border bg-white px-[10px] text-[14px] font-semibold hover:bg-[#fafaf9]"
      >
        Undo
      </button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Undo this import?"
        footer={
          <>
            <button type="button" onClick={() => setOpen(false)} className={buttonStyles.secondary}>
              Keep it
            </button>
            <DangerButton
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const r = await undoImport(id);
                  setOpen(false);
                  if (!r.ok) return toast.error(r.error);
                  toast.show(r.message);
                  router.refresh();
                })
              }
            >
              Undo import
            </DangerButton>
          </>
        }
      >
        <p className="text-admin-muted m-0 leading-[1.6]">
          This removes everything <strong className="text-admin-text">{name}</strong> added: its
          purchases and the stock changes. It only works if those units haven&apos;t been sold or
          adjusted since.
        </p>
      </Dialog>
    </>
  );
}
