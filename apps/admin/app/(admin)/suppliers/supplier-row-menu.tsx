"use client";

import { RowMenu } from "@/components/menus";

export function SupplierRowMenu({
  id,
  name,
  whatsapp,
}: {
  id: string;
  name: string;
  whatsapp: string | null;
}) {
  return (
    <RowMenu
      label={`More actions for ${name}`}
      actions={[
        { label: "View", href: `/suppliers/${id}` },
        { label: "Record purchase", href: `/purchases/new?supplier=${id}` },
        ...(whatsapp
          ? [{ label: "WhatsApp", onSelect: () => window.open(whatsapp, "_blank", "noopener") }]
          : []),
      ]}
    />
  );
}
