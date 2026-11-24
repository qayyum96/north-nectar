"use client";

import { cn } from "@northnectar/ui";
import { useRef } from "react";

/**
 * Plain textarea with the mockup's formatting toolbar (B, I, U, List, Link). It writes the marks the
 * storefront's <RichParagraph> understands: **bold**, *italic*, __underline__, "- " list lines and
 * [link text](https://… or /path). Paragraphs are separated by a blank line.
 */
export function RichTextEditor({
  id,
  label,
  value,
  onChange,
  minHeight = 120,
  invalid = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  minHeight?: number;
  invalid?: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const wrap = (before: string, after = before, placeholder = "text") => {
    const el = ref.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e } = el;
    const picked = value.slice(s, e) || placeholder;
    const next = value.slice(0, s) + before + picked + after + value.slice(e);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(s + before.length, s + before.length + picked.length);
    });
  };

  const list = () => {
    const el = ref.current;
    if (!el) return;
    const start = value.lastIndexOf("\n", el.selectionStart - 1) + 1;
    const endIdx = value.indexOf("\n", el.selectionEnd);
    const end = endIdx === -1 ? value.length : endIdx;
    const block = value
      .slice(start, end)
      .split("\n")
      .map((l) => (l.startsWith("- ") ? l : `- ${l}`))
      .join("\n");
    onChange(value.slice(0, start) + block + value.slice(end));
    requestAnimationFrame(() => el.focus());
  };

  const link = () => {
    const url = window.prompt("Link address (https://… or /products/…)", "https://");
    if (!url || !/^(https?:\/\/|mailto:|\/)/i.test(url)) return;
    wrap("[", `](${url})`, "link text");
  };

  const tool =
    "min-h-7 min-w-7 cursor-pointer rounded-[6px] border-0 bg-transparent px-2 py-1 text-[14px] hover:bg-[#ececea]";
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[10px] border focus-within:border-forest-600",
        invalid ? "border-[#d92d20]" : "border-[#d4d4d1]",
      )}
    >
      <div
        className="flex gap-[2px] border-b border-[#ececea] bg-[#fafaf8] px-2 py-[6px]"
        role="toolbar"
        aria-label="Formatting"
      >
        <button
          type="button"
          className={cn(tool, "font-bold")}
          onClick={() => wrap("**")}
          aria-label="Bold"
        >
          B
        </button>
        <button
          type="button"
          className={cn(tool, "italic")}
          onClick={() => wrap("*")}
          aria-label="Italic"
        >
          I
        </button>
        <button
          type="button"
          className={cn(tool, "underline")}
          onClick={() => wrap("__")}
          aria-label="Underline"
        >
          U
        </button>
        <button type="button" className={cn(tool, "text-admin-muted")} onClick={list}>
          • List
        </button>
        <button type="button" className={cn(tool, "text-admin-muted")} onClick={link}>
          Link
        </button>
      </div>
      <textarea
        ref={ref}
        id={id}
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ minHeight }}
        className="box-border block w-full resize-y border-0 p-3 text-[14px] leading-[1.6] outline-none"
      />
    </div>
  );
}
