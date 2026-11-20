import "server-only";

/**
 * Turns a table (header + rows) into a download: CSV, Excel (.xlsx) or a print-ready page for
 * "Save as PDF". No extra libraries: an .xlsx file is a zip of a few XML files, written here with
 * the "stored" (uncompressed) zip method.
 */

export type Cell = string | number | null | undefined;
export type ExportFormat = "csv" | "xlsx" | "pdf";

export interface ExportTable {
  title: string;
  /** Used in the file name, e.g. "orders". */
  slug: string;
  header: string[];
  rows: Cell[][];
  /** Right-align these column indexes in the PDF (amounts, counts). */
  numeric?: number[];
}

export function parseFormat(v: string | null | undefined): ExportFormat {
  return v === "xlsx" || v === "pdf" ? v : "csv";
}

/**
 * Spreadsheet apps run cells that start with = + - @ as formulas. Names and messages come from the
 * public website, so text cells are prefixed with an apostrophe when they start that way.
 */
const safeText = (s: string) => (/^[=+\-@\t\r]/.test(s) ? `'${s}` : s);

export function exportResponse(table: ExportTable, format: ExportFormat): Response {
  const stamp = new Date().toISOString().slice(0, 10);
  const base = `north-nectar-${table.slug}-${stamp}`;
  if (format === "xlsx") {
    return new Response(new Blob([toXlsx(table) as BlobPart]), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${base}.xlsx"`,
        "Cache-Control": "no-store",
      },
    });
  }
  if (format === "pdf") {
    return new Response(toPrintHtml(table), {
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
    });
  }
  return new Response(String.fromCharCode(0xfeff) + toCsv(table), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${base}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

/* ----------------------------------------------------------------------------------------------
 * CSV
 * -------------------------------------------------------------------------------------------- */

export function toCsv({ header, rows }: Pick<ExportTable, "header" | "rows">): string {
  const cell = (v: Cell) => {
    if (v === null || v === undefined) return "";
    if (typeof v === "number") return String(v);
    const s = safeText(v);
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [header, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");
}

/* ----------------------------------------------------------------------------------------------
 * Print page ("Save as PDF" from the browser's print dialog)
 * -------------------------------------------------------------------------------------------- */

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function toPrintHtml({ title, header, rows, numeric = [] }: ExportTable): string {
  const fmt = (v: Cell, i: number) =>
    v === null || v === undefined
      ? ""
      : typeof v === "number" && numeric.includes(i)
        ? v.toLocaleString("en-US")
        : esc(String(v));
  const th = header
    .map((h, i) => `<th${numeric.includes(i) ? ' class="n"' : ""}>${esc(h)}</th>`)
    .join("");
  const body = rows
    .map(
      (r) =>
        `<tr>${r.map((v, i) => `<td${numeric.includes(i) ? ' class="n"' : ""}>${fmt(v, i)}</td>`).join("")}</tr>`,
    )
    .join("");
  const when = new Date().toLocaleString("en-GB", { timeZone: "Asia/Karachi" });
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(title)}</title>
<meta name="robots" content="noindex">
<style>
  @page { size: A4 landscape; margin: 12mm; }
  body { font: 11px/1.45 Inter, system-ui, sans-serif; color: #1f1f1f; margin: 24px; }
  h1 { font-size: 18px; margin: 0 0 4px; } p { color: #616161; margin: 0 0 16px; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-weight: 600; text-transform: uppercase; letter-spacing: .04em;
       color: #6b6b68; background: #f4f2ee; }
  th, td { padding: 6px 8px; border-bottom: 1px solid #e3e3e3; vertical-align: top; }
  .n { text-align: right; white-space: nowrap; }
  .bar { margin-bottom: 16px; } .bar button { font: inherit; padding: 6px 14px; cursor: pointer; }
  @media print { .bar { display: none; } body { margin: 0; } }
</style></head><body>
<div class="bar"><button onclick="window.print()">Print or save as PDF</button></div>
<h1>${esc(title)}</h1><p>North Nectar · ${rows.length} rows · exported ${esc(when)}</p>
<table><thead><tr>${th}</tr></thead><tbody>${body}</tbody></table>
<script>window.addEventListener("load", () => setTimeout(() => window.print(), 300));</script>
</body></html>`;
}

/* ----------------------------------------------------------------------------------------------
 * Excel (.xlsx)
 * -------------------------------------------------------------------------------------------- */

const xml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // Control characters are not allowed in XML.
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "");

const colName = (i: number): string => {
  let n = i + 1;
  let s = "";
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
};

function sheetXml({ header, rows }: ExportTable): string {
  const cell = (v: Cell, r: number, c: number, bold = false) => {
    const ref = `${colName(c)}${r}`;
    const s = bold ? ' s="1"' : "";
    if (v === null || v === undefined || v === "") return "";
    if (typeof v === "number" && Number.isFinite(v)) return `<c r="${ref}"${s}><v>${v}</v></c>`;
    return `<c r="${ref}" t="inlineStr"${s}><is><t xml:space="preserve">${xml(String(v))}</t></is></c>`;
  };
  const widths = header.map((h, c) =>
    Math.min(
      60,
      Math.max(h.length, ...rows.slice(0, 200).map((r) => String(r[c] ?? "").length)) + 2,
    ),
  );
  const cols = widths
    .map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`)
    .join("");
  const data = [header, ...rows]
    .map(
      (r, ri) =>
        `<row r="${ri + 1}">${r.map((v, ci) => cell(v, ri + 1, ci, ri === 0)).join("")}</row>`,
    )
    .join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${cols}</cols><sheetData>${data}</sheetData></worksheet>`;
}

export function toXlsx(table: ExportTable): Uint8Array {
  const sheetName = xml(table.title.slice(0, 31).replace(/[\\/?*[\]:]/g, " "));
  const files: [string, string][] = [
    [
      "[Content_Types].xml",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`,
    ],
    [
      "_rels/.rels",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    ],
    [
      "xl/workbook.xml",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${sheetName}" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    ],
    [
      "xl/_rels/workbook.xml.rels",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
    ],
    [
      "xl/styles.xml",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="2"><xf fontId="0"/><xf fontId="1" applyFont="1"/></cellXfs></styleSheet>`,
    ],
    ["xl/worksheets/sheet1.xml", sheetXml(table)],
  ];
  return zipStore(files.map(([name, text]) => [name, new TextEncoder().encode(text)]));
}

/* Minimal zip writer (method 0, "stored"). */

/** 1 Jan 1980, the earliest date a zip entry can carry (a zero date is invalid). */
const DOS_DATE = (1 << 5) | 1;

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(data: Uint8Array): number {
  let c = 0xffffffff;
  for (const byte of data) c = CRC_TABLE[(c ^ byte) & 0xff]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function zipStore(entries: [string, Uint8Array][]): Uint8Array {
  const enc = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  for (const [name, data] of entries) {
    const nameBytes = enc.encode(name);
    const crc = crc32(data);
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true); // version needed
    local.setUint16(6, 0x0800, true); // UTF-8 names
    local.setUint16(8, 0, true); // stored
    local.setUint16(12, DOS_DATE, true);
    local.setUint32(14, crc, true);
    local.setUint32(18, data.length, true);
    local.setUint32(22, data.length, true);
    local.setUint16(26, nameBytes.length, true);
    chunks.push(new Uint8Array(local.buffer), nameBytes, data);

    const cd = new DataView(new ArrayBuffer(46));
    cd.setUint32(0, 0x02014b50, true);
    cd.setUint16(4, 20, true);
    cd.setUint16(6, 20, true);
    cd.setUint16(8, 0x0800, true);
    cd.setUint16(10, 0, true);
    cd.setUint16(14, DOS_DATE, true);
    cd.setUint32(16, crc, true);
    cd.setUint32(20, data.length, true);
    cd.setUint32(24, data.length, true);
    cd.setUint16(28, nameBytes.length, true);
    cd.setUint32(42, offset, true);
    central.push(new Uint8Array(cd.buffer), nameBytes);
    offset += 30 + nameBytes.length + data.length;
  }
  const cdSize = central.reduce((n, c) => n + c.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, entries.length, true);
  end.setUint16(10, entries.length, true);
  end.setUint32(12, cdSize, true);
  end.setUint32(16, offset, true);
  const all = [...chunks, ...central, new Uint8Array(end.buffer)];
  const out = new Uint8Array(all.reduce((n, c) => n + c.length, 0));
  let p = 0;
  for (const c of all) {
    out.set(c, p);
    p += c.length;
  }
  return out;
}
