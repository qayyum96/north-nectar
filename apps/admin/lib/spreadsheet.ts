/**
 * Reads CSV and Excel (.xlsx) files in the browser without extra libraries. An .xlsx file is a zip
 * of XML files; the browser's DecompressionStream unpacks it. Returns the first sheet as text cells.
 */

export interface Sheet {
  headers: string[];
  rows: string[][];
}

export async function readSpreadsheet(file: File): Promise<Sheet> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".xlsx")) return toSheet(await readXlsx(await file.arrayBuffer()));
  if (name.endsWith(".csv") || name.endsWith(".txt")) return toSheet(parseCsv(await file.text()));
  throw new Error("Use a .csv or .xlsx file. (Older .xls files: open in Excel and save as .xlsx.)");
}

function toSheet(grid: string[][]): Sheet {
  const rows = grid.filter((r) => r.some((c) => c.trim() !== ""));
  if (rows.length < 2) throw new Error("The file needs a header row and at least one row of data.");
  const width = Math.max(...rows.map((r) => r.length));
  const headers = Array.from(
    { length: width },
    (_, i) => (rows[0]![i] ?? "").trim() || `Column ${i + 1}`,
  );
  return {
    headers,
    rows: rows.slice(1).map((r) => Array.from({ length: width }, (_, i) => (r[i] ?? "").trim())),
  };
}

/* CSV (comma or semicolon, quotes, line breaks inside quotes, byte order mark) */
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, "");
  const firstLine = src.slice(0, src.indexOf("\n") >= 0 ? src.indexOf("\n") : undefined);
  const delimiter =
    (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]!;
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === delimiter) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (cell !== "" || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

/* XLSX */
async function unzip(buffer: ArrayBuffer): Promise<Map<string, Uint8Array>> {
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  let eocd = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 66000); i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("This doesn't look like an Excel file.");
  const count = view.getUint16(eocd + 10, true);
  let p = view.getUint32(eocd + 16, true);
  const out = new Map<string, Uint8Array>();
  const dec = new TextDecoder();
  for (let n = 0; n < count; n++) {
    if (view.getUint32(p, true) !== 0x02014b50) break;
    const method = view.getUint16(p + 10, true);
    const compSize = view.getUint32(p + 20, true);
    const nameLen = view.getUint16(p + 28, true);
    const extraLen = view.getUint16(p + 30, true);
    const commentLen = view.getUint16(p + 32, true);
    const local = view.getUint32(p + 42, true);
    const name = dec.decode(bytes.subarray(p + 46, p + 46 + nameLen));
    p += 46 + nameLen + extraLen + commentLen;
    if (
      !/^(xl\/workbook\.xml|xl\/_rels\/workbook\.xml\.rels|xl\/sharedStrings\.xml|xl\/worksheets\/[^/]+\.xml)$/.test(
        name,
      )
    )
      continue;
    const lNameLen = view.getUint16(local + 26, true);
    const lExtraLen = view.getUint16(local + 28, true);
    const start = local + 30 + lNameLen + lExtraLen;
    const data = bytes.slice(start, start + compSize);
    if (method === 0) out.set(name, data);
    else if (method === 8) {
      const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
      out.set(name, new Uint8Array(await new Response(stream).arrayBuffer()));
    }
  }
  return out;
}

const colIndex = (ref: string) => {
  const letters = /^[A-Z]+/.exec(ref)?.[0] ?? "A";
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
};

export async function readXlsx(buffer: ArrayBuffer): Promise<string[][]> {
  const files = await unzip(buffer);
  const dec = new TextDecoder();
  const xml = (name: string) => {
    const f = files.get(name);
    return f ? new DOMParser().parseFromString(dec.decode(f), "application/xml") : null;
  };
  const shared = [...(xml("xl/sharedStrings.xml")?.getElementsByTagName("si") ?? [])].map((si) =>
    [...si.getElementsByTagName("t")].map((t) => t.textContent ?? "").join(""),
  );
  // First sheet in workbook order.
  const workbook = xml("xl/workbook.xml");
  const rels = xml("xl/_rels/workbook.xml.rels");
  const firstSheet = workbook?.getElementsByTagName("sheet")[0];
  const rid =
    firstSheet?.getAttribute("r:id") ??
    firstSheet?.getAttributeNS(
      "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
      "id",
    );
  const target = [...(rels?.getElementsByTagName("Relationship") ?? [])]
    .find((r) => r.getAttribute("Id") === rid)
    ?.getAttribute("Target");
  const sheetPath = target
    ? `xl/${target.replace(/^\/?xl\//, "").replace(/^\//, "")}`
    : "xl/worksheets/sheet1.xml";
  const sheet = xml(sheetPath) ?? xml("xl/worksheets/sheet1.xml");
  if (!sheet) throw new Error("The Excel file has no sheet.");
  const grid: string[][] = [];
  for (const row of sheet.getElementsByTagName("row")) {
    const r: string[] = [];
    for (const c of row.getElementsByTagName("c")) {
      const i = colIndex(c.getAttribute("r") ?? "A");
      const type = c.getAttribute("t");
      const v = c.getElementsByTagName("v")[0]?.textContent ?? "";
      let value = v;
      if (type === "s") value = shared[Number(v)] ?? "";
      else if (type === "inlineStr")
        value = [...c.getElementsByTagName("t")].map((t) => t.textContent ?? "").join("");
      else if (type === "b") value = v === "1" ? "TRUE" : "FALSE";
      r[i] = value;
    }
    grid.push(Array.from(r, (x) => x ?? ""));
  }
  return grid;
}

/** "02/11/2026", "2026-11-02", "2 Nov 2026" or an Excel date number -> "2026-11-02" (or null). */
export function parseDate(value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  if (/^\d{5}(\.\d+)?$/.test(v)) {
    const d = new Date(Date.UTC(1899, 11, 30) + Math.floor(Number(v)) * 86_400_000);
    return d.toISOString().slice(0, 10);
  }
  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(v);
  if (m) return iso(+m[1]!, +m[2]!, +m[3]!);
  m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/.exec(v);
  if (m) {
    const year = m[3]!.length === 2 ? 2000 + +m[3]! : +m[3]!;
    return iso(year, +m[2]!, +m[1]!); // Pakistan uses day/month/year
  }
  const t = Date.parse(v);
  return Number.isNaN(t) ? null : new Date(t).toISOString().slice(0, 10);
}

function iso(y: number, mo: number, d: number): string | null {
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** "1,180" / "Rs 1,180" / "1180.0" -> 1180; "" -> null; "twelve" -> NaN. */
export function parseNumber(value: string): number | null {
  const v = value
    .trim()
    .replace(/^rs\.?\s*/i, "")
    .replace(/[,\s]/g, "");
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

export function downloadCsv(name: string, rows: string[][]) {
  const text = rows
    .map((r) => r.map((c) => (/[",\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c)).join(","))
    .join("\r\n");
  const url = URL.createObjectURL(
    new Blob([String.fromCharCode(0xfeff) + text], { type: "text/csv;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
