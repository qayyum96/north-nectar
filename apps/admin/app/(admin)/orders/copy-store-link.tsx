"use client";

import { Icon } from "@/components/icon";
import { useToast } from "@/components/toast";
import { buttonStyles } from "@/components/ui";

export function CopyStoreLink({ url }: { url: string }) {
  const toast = useToast();
  return (
    <button
      type="button"
      className={buttonStyles.secondary}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          toast.show("Store link copied");
        } catch {
          toast.error("Couldn't copy. The link is " + url);
        }
      }}
    >
      <Icon name="file" size={16} />
      Copy store link
    </button>
  );
}
