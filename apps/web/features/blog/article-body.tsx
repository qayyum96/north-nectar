import { RichParagraph } from "@northnectar/ui";

/** URL-safe id for a heading, so "In this article" links can jump to it. */
export function headingId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** "## Heading" and "### Heading" blocks of a post body. */
export function headingsOf(body: string[]): { level: 2 | 3; text: string; id: string }[] {
  return body.flatMap((block) => {
    const m = /^(#{2,3})\s+(.+)$/.exec(block.trim());
    if (!m) return [];
    const text = m[2]!.trim();
    return [{ level: m[1]!.length as 2 | 3, text, id: headingId(text) }];
  });
}

/**
 * Article text: "## " and "### " blocks become headings, everything else a rich paragraph or list
 * (bold, italic, links, "- " lines), the same marks as product descriptions.
 */
export function ArticleBody({ body }: { body: string[] }) {
  return (
    <div className="flex flex-col gap-5 text-[18px] leading-[1.75] text-[#3f4a40] [&_a]:font-semibold [&_a]:text-forest-600 [&_a]:underline [&_strong]:text-[#0f2a1a]">
      {body.map((block, i) => {
        const m = /^(#{2,3})\s+(.+)$/.exec(block.trim());
        if (m) {
          const text = m[2]!.trim();
          return m[1] === "##" ? (
            <h2
              key={i}
              id={headingId(text)}
              className="m-0 mt-4 scroll-mt-[150px] font-display text-[28px] leading-[1.15] font-bold text-[#0f2a1a] uppercase md:text-[34px]"
            >
              {text}
            </h2>
          ) : (
            <h3
              key={i}
              id={headingId(text)}
              className="m-0 mt-2 scroll-mt-[150px] text-[20px] leading-[1.4] font-bold text-[#0f2a1a]"
            >
              {text}
            </h3>
          );
        }
        return <RichParagraph key={i} text={block} className="marker:text-[#2f7d45]" />;
      })}
    </div>
  );
}
