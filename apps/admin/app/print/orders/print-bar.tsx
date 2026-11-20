"use client";

import { useEffect } from "react";

/** Print button above the invoices; opens the print dialog once the page has loaded. */
export function PrintBar({ count }: { count: number }) {
  useEffect(() => {
    const t = setTimeout(() => window.print(), 500);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="mx-auto mb-4 flex w-[210mm] max-w-full items-center justify-between px-1 text-[14px] print:hidden">
      <span className="text-[#616161]">
        {count} {count === 1 ? "invoice" : "invoices"}
      </span>
      <button
        type="button"
        onClick={() => window.print()}
        className="h-[38px] cursor-pointer rounded-[8px] border-0 bg-forest-600 px-[18px] font-semibold text-white"
      >
        Print
      </button>
    </div>
  );
}
