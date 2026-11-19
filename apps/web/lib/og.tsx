import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { ReactNode } from "react";

/**
 * Shared helpers for next/og images (site default now, products in Phase 3).
 * Fonts come from @fontsource packages as WOFF (Satori does not read WOFF2), read from disk at
 * build time, so no network access is needed.
 */

export const OG_SIZE = { width: 1200, height: 630 };

const fontFile = (pkg: string, file: string) =>
  join(process.cwd(), "node_modules", "@fontsource", pkg, "files", file);

export async function loadOgFonts() {
  const [oswald, figtree] = await Promise.all([
    readFile(fontFile("oswald", "oswald-latin-700-normal.woff")),
    readFile(fontFile("figtree", "figtree-latin-600-normal.woff")),
  ]);
  return [
    { name: "Oswald", data: oswald, weight: 700 as const, style: "normal" as const },
    { name: "Figtree", data: figtree, weight: 600 as const, style: "normal" as const },
  ];
}

/** Reads a file from /public and returns a data URI usable in <img src>. */
export async function publicAsDataUri(path: string, mime: string) {
  const buf = await readFile(join(process.cwd(), "public", path.replace(/^\//, "")));
  return `data:${mime};base64,${buf.toString("base64")}`;
}

/** Branded frame: forest gradient, cream emblem, footer strip. */
export function OgFrame({ emblem, children }: { emblem: string; children: ReactNode }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "56px 64px",
        background: "radial-gradient(ellipse at 78% 18%, #22573a 0%, #12321f 45%, #0b2114 100%)",
        color: "#ffffff",
        fontFamily: "Figtree",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- Satori renders plain <img> */}
      <img src={emblem} width={180} height={80} style={{ objectFit: "contain" }} />
      {children}
      <div
        style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 26, color: "#efe2c4" }}
      >
        <span>northnectar.com</span>
        <span style={{ width: 8, height: 8, background: "#d1ae6c", transform: "rotate(45deg)" }} />
        <span>Cash on delivery across Pakistan</span>
      </div>
    </div>
  );
}
