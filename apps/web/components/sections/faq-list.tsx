import { RichParagraph } from "@northnectar/ui";

export interface FaqItem {
  question: string;
  answer: string;
}

/**
 * Question-and-answer accordion. Native <details name> gives one-open-at-a-time behaviour,
 * keyboard support and crawlable answers with no JavaScript; the first question starts open.
 * Answers accept the same marks as product descriptions (bold, links, "- " lists).
 */
export function FaqList({ items, name = "faq" }: { items: FaqItem[]; name?: string }) {
  return (
    <div className="flex flex-col gap-[10px]">
      {items.map((item, index) => (
        <details
          key={item.question}
          name={name}
          open={index === 0}
          className="group overflow-hidden rounded-[16px] border border-[#e3d8bf] bg-white"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-[18px] text-[17px] leading-[1.5] font-bold text-[#0f2a1a] [&::-webkit-details-marker]:hidden">
            <h3 className="m-0 text-[17px] font-bold">{item.question}</h3>
            <span
              aria-hidden="true"
              className="inline-flex size-8 flex-none items-center justify-center rounded-full bg-[#efe7d6] text-[20px] leading-none text-ink group-open:bg-forest-600 group-open:text-white"
            >
              <span className="group-open:hidden">+</span>
              <span className="hidden group-open:inline">−</span>
            </span>
          </summary>
          <RichParagraph
            text={item.answer}
            className="px-5 pb-5 text-[16px] leading-[1.65] text-[#3f4a40]"
          />
        </details>
      ))}
    </div>
  );
}
