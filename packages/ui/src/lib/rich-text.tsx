import type { ReactNode } from "react";

/**
 * Light formatting for product descriptions written in the admin:
 *   **bold**   *italic*   __underline__   [link text](https://example.com)
 * A paragraph whose lines all start with "- " becomes a bulleted list.
 * Everything is rendered as React elements (never raw HTML), so it is safe to show.
 */

const TOKEN = /(\*\*[^*\n]+\*\*|__[^_\n]+__|\*[^*\n]+\*|\[[^\]\n]+\]\([^)\s]+\))/g;

const safeHref = (url: string) => (/^(https?:\/\/|mailto:|\/(?!\/))/i.test(url) ? url : null);

export function renderInline(text: string): ReactNode[] {
  return text.split(TOKEN).map((part, i) => {
    if (!part) return null;
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4)
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("__") && part.endsWith("__") && part.length > 4)
      return <u key={i}>{part.slice(2, -2)}</u>;
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2)
      return <em key={i}>{part.slice(1, -1)}</em>;
    const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part);
    if (link) {
      const href = safeHref(link[2]!);
      if (!href) return link[1];
      const external = /^https?:\/\//i.test(href);
      return (
        <a
          key={i}
          href={href}
          className="underline underline-offset-2"
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {link[1]}
        </a>
      );
    }
    return part;
  });
}

const isList = (p: string) => {
  const lines = p.split("\n").filter((l) => l.trim());
  return lines.length > 0 && lines.every((l) => /^\s*[-•]\s+/.test(l));
};

/** One description paragraph: a <p> or, for "- " lines, a <ul>. */
export function RichParagraph({ text, className }: { text: string; className?: string }) {
  if (isList(text)) {
    return (
      <ul className={["m-0 list-disc pl-5", className].filter(Boolean).join(" ")}>
        {text
          .split("\n")
          .filter((l) => l.trim())
          .map((l, i) => (
            <li key={i}>{renderInline(l.replace(/^\s*[-•]\s+/, ""))}</li>
          ))}
      </ul>
    );
  }
  return (
    <p className={["m-0 whitespace-pre-line", className].filter(Boolean).join(" ")}>
      {renderInline(text)}
    </p>
  );
}

/** The same text without formatting marks (for meta descriptions and structured data). */
export function plainText(text: string): string {
  return text
    .replace(/\[([^\]\n]+)\]\([^)\s]+\)/g, "$1")
    .replace(/\*\*([^*\n]+)\*\*/g, "$1")
    .replace(/__([^_\n]+)__/g, "$1")
    .replace(/\*([^*\n]+)\*/g, "$1")
    .replace(/^\s*[-•]\s+/gm, "")
    .replace(/\s*\n\s*/g, " ")
    .trim();
}
