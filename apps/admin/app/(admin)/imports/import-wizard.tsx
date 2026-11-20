"use client";

import { cn } from "@northnectar/ui";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Dialog } from "@/components/dialog";
import { Icon } from "@/components/icon";
import { useToast } from "@/components/toast";
import { buttonStyles } from "@/components/ui";
import {
  type CatalogSize,
  FIELDS,
  type ImportKind,
  KIND_LABEL,
  TEMPLATES,
  type ValidationResult,
  autoMap,
  validateRows,
} from "@/lib/import-kinds";
import { type Sheet, downloadCsv, readSpreadsheet } from "@/lib/spreadsheet";
import { importContext, runImport } from "./actions";

const STEPS = ["1. Upload", "2. Map columns", "3. Preview", "4. Confirm"];
const KINDS: ImportKind[] = ["products", "purchases", "movements"];

function Wizard({ initialKind, onClose }: { initialKind: ImportKind; onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [kind, setKind] = useState<ImportKind>(initialKind);
  const [file, setFile] = useState<File | null>(null);
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [mapping, setMapping] = useState<string[]>([]);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [skip, setSkip] = useState(true);
  const [reading, setReading] = useState(false);
  const [over, setOver] = useState(false);
  const [pending, start] = useTransition();
  const ctx = useRef<{ sizes: CatalogSize[]; categories: string[]; today: string } | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const router = useRouter();

  const choose = async (f: File) => {
    if (f.size > 5 * 1024 * 1024) return toast.error("The file must be under 5 MB.");
    setReading(true);
    try {
      const s = await readSpreadsheet(f);
      setFile(f);
      setSheet(s);
      setMapping(autoMap(s.headers, kind));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "The file couldn't be read.");
    } finally {
      setReading(false);
    }
  };

  const preview = () =>
    start(async () => {
      if (!sheet) return;
      ctx.current ??= await importContext();
      setResult(validateRows(kind, sheet, mapping, ctx.current));
      setStep(2);
    });

  const run = () =>
    start(async () => {
      if (!result || !file || !sheet) return;
      const r = await runImport({
        kind,
        fileName: file.name,
        fileSize: file.size,
        totalRows: sheet.rows.length,
        errors: result.errors,
        rows: result.ready,
      });
      if (!r.ok) return toast.error(r.error);
      toast.show(r.message, { label: "View history", onClick: () => router.push("/imports") });
      onClose();
      router.refresh();
    });

  const missing = FIELDS[kind].filter((f) => f.required && !mapping.includes(f.key));
  const movementsNeedOne =
    kind === "movements" && !mapping.includes("change") && !mapping.includes("count");
  const size = file
    ? file.size < 1024 * 1024
      ? `${Math.max(1, Math.round(file.size / 1024))} KB`
      : `${(file.size / 1024 / 1024).toFixed(1)} MB`
    : "";

  const footerNote = file ? (
    <span className="inline-flex items-center gap-[6px]">
      <Icon name="file" size={14} />
      {file.name}
    </span>
  ) : null;

  const footer =
    step === 0 ? (
      <button
        type="button"
        disabled={!sheet}
        onClick={() => setStep(1)}
        className={cn(buttonStyles.primary, "disabled:opacity-50")}
      >
        Continue
      </button>
    ) : step === 1 ? (
      <>
        <button type="button" onClick={() => setStep(0)} className={buttonStyles.secondary}>
          Back
        </button>
        <button
          type="button"
          disabled={pending || missing.length > 0 || movementsNeedOne}
          onClick={preview}
          className={cn(buttonStyles.primary, "disabled:opacity-50")}
        >
          {pending ? "Checking…" : "Preview rows"}
        </button>
      </>
    ) : step === 2 ? (
      <>
        <button type="button" onClick={() => setStep(1)} className={buttonStyles.secondary}>
          Back
        </button>
        <button
          type="button"
          disabled={!result || result.ready.length === 0 || (result.errors.length > 0 && !skip)}
          onClick={() => setStep(3)}
          className={cn(buttonStyles.primary, "disabled:opacity-50")}
        >
          Continue
        </button>
      </>
    ) : (
      <>
        <button type="button" onClick={() => setStep(2)} className={buttonStyles.secondary}>
          Back
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={run}
          className={cn(buttonStyles.primary, "disabled:opacity-60")}
        >
          <Icon name="upload" size={16} />
          {pending ? "Importing…" : `Import ${result?.ready.length ?? 0} rows`}
        </button>
      </>
    );

  return (
    <Dialog
      open
      onClose={onClose}
      title={`Import ${KIND_LABEL[kind].toLowerCase()}`}
      width={760}
      note={footerNote}
      footer={footer}
    >
      <ol className="m-0 mb-[18px] grid list-none grid-cols-4 gap-2 p-0">
        {STEPS.map((s, i) => (
          <li key={s} className="flex flex-col gap-[6px]">
            <span
              className={cn("h-1 rounded-full", i <= step ? "bg-forest-600" : "bg-[#e3e3e0]")}
            />
            <span
              className={cn(
                "text-[14px]",
                i === step
                  ? "text-admin-text font-bold"
                  : i < step
                    ? "text-admin-text font-medium"
                    : "text-admin-muted font-medium",
              )}
            >
              {s}
            </span>
          </li>
        ))}
      </ol>

      {step === 0 ? (
        <div className="flex flex-col gap-[14px]">
          <div className="flex flex-col gap-[6px]">
            <span className="text-[14px] font-semibold">Import into</span>
            <div
              role="radiogroup"
              aria-label="Import into"
              className="bg-admin-seg flex gap-[2px] overflow-x-auto rounded-[10px] p-[3px]"
            >
              {KINDS.map((k) => (
                <button
                  key={k}
                  type="button"
                  role="radio"
                  aria-checked={kind === k}
                  onClick={() => {
                    setKind(k);
                    if (sheet) setMapping(autoMap(sheet.headers, k));
                  }}
                  className={cn(
                    "text-admin-text h-8 shrink-0 cursor-pointer rounded-[8px] border-0 px-[14px] text-[14px]",
                    kind === k
                      ? "bg-white font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.12)]"
                      : "bg-transparent font-medium",
                  )}
                >
                  {KIND_LABEL[k]}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={() => input.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(true);
            }}
            onDragLeave={() => setOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setOver(false);
              const f = e.dataTransfer.files[0];
              if (f) void choose(f);
            }}
            className={cn(
              "flex cursor-pointer flex-col items-center gap-2 rounded-[14px] border-[1.5px] border-dashed px-5 py-[34px] text-center",
              over ? "border-forest-600 bg-[#f3f7f1]" : "border-[#c9c9c5] bg-[#fafaf8]",
            )}
          >
            <Icon name="upload" size={22} className="text-forest-600" />
            <span className="font-bold">
              {reading ? "Reading the file…" : "Drop your CSV or Excel file here"}
            </span>
            <span className="text-admin-muted">
              or <span className="font-semibold text-forest-600">browse your computer</span> · .csv,
              .xlsx up to 5 MB
            </span>
          </button>
          <input
            ref={input}
            type="file"
            hidden
            accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) void choose(f);
            }}
          />
          {file && sheet ? (
            <div className="border-admin-line flex items-center gap-[10px] rounded-[12px] border p-3">
              <span className="grid size-10 place-items-center rounded-[8px] bg-[#eef3ec] text-forest-600">
                <Icon name="file" size={18} />
              </span>
              <span className="flex flex-1 flex-col">
                <span className="font-semibold">{file.name}</span>
                <span className="text-admin-muted">
                  {size} · {sheet.rows.length} {sheet.rows.length === 1 ? "row" : "rows"} found
                </span>
              </span>
              <Icon name="check" size={18} className="text-forest-600" />
            </div>
          ) : null}
          <span className="text-admin-muted inline-flex items-center gap-2">
            <Icon name="download" size={14} />
            Not sure about the format?
            <button
              type="button"
              onClick={() => downloadCsv(`north-nectar-${kind}-template.csv`, TEMPLATES[kind])}
              className="cursor-pointer border-0 bg-transparent p-0 font-semibold text-forest-600 hover:underline"
            >
              Download the {KIND_LABEL[kind].toLowerCase()} template
            </button>
          </span>
        </div>
      ) : null}

      {step === 1 && sheet ? (
        <div className="flex flex-col gap-[14px]">
          <p className="text-admin-muted m-0">
            Match the columns in your file to North Nectar fields. We matched most of them for you.
          </p>
          <div className="grid grid-cols-[minmax(0,1fr)_24px_minmax(0,1fr)] items-center gap-x-3 gap-y-[10px]">
            <span className="text-[14px] font-semibold">Column in your file</span>
            <span />
            <span className="text-[14px] font-semibold">North Nectar field</span>
            {sheet.headers.map((h, i) => {
              const example = sheet.rows.find((r) => r[i])?.[i] ?? "";
              return (
                <div key={`${h}-${i}`} className="contents">
                  <span className="flex min-w-0 flex-col rounded-[10px] bg-[#f7f7f5] px-3 py-2">
                    <span className="truncate font-semibold">{h}</span>
                    <span className="text-admin-muted truncate">
                      {example ? `e.g. ${example}` : "Empty"}
                    </span>
                  </span>
                  <span aria-hidden="true" className="text-admin-muted text-center">
                    →
                  </span>
                  <span className="relative block">
                    <select
                      aria-label={`Field for ${h}`}
                      value={mapping[i] ?? ""}
                      onChange={(e) =>
                        setMapping((m) =>
                          m.map((x, j) =>
                            j === i
                              ? e.target.value
                              : x === e.target.value && e.target.value
                                ? ""
                                : x,
                          ),
                        )
                      }
                      className={cn(
                        "text-admin-text h-10 w-full cursor-pointer appearance-none rounded-[10px] border bg-white pr-[34px] pl-3 text-[14px]",
                        mapping[i] ? "border-[#d4d4d1]" : "border-[#e9c46a]",
                      )}
                    >
                      <option value="">Don&apos;t import</option>
                      {FIELDS[kind].map((f) => (
                        <option key={f.key} value={f.key}>
                          {f.label}
                          {f.required ? " (required)" : ""}
                        </option>
                      ))}
                    </select>
                    <span className="text-admin-muted pointer-events-none absolute top-3 right-[10px]">
                      <Icon name="down" size={16} />
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
          {missing.length || movementsNeedOne ? (
            <p className="m-0 text-[14px] text-[#b42318]">
              {movementsNeedOne ? "Choose a column for the quantity change or the new count. " : ""}
              {missing.length ? `Still needed: ${missing.map((f) => f.label).join(", ")}.` : ""}
            </p>
          ) : null}
        </div>
      ) : null}

      {step === 2 && result ? (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex h-6 items-center gap-[6px] rounded-full bg-[#e3f4e8] px-[10px] text-[14px] font-semibold text-[#1d6b3a]">
              <span className="size-[6px] rounded-full bg-[#1d6b3a]" />
              {result.ready.length} {result.ready.length === 1 ? "row" : "rows"} ready
            </span>
            {result.errors.length ? (
              <span className="inline-flex h-6 items-center gap-[6px] rounded-full bg-[#fde8e6] px-[10px] text-[14px] font-semibold text-[#9b2c22]">
                <span className="size-[6px] rounded-full bg-[#9b2c22]" />
                {result.errors.length} {result.errors.length === 1 ? "row" : "rows"} with errors
              </span>
            ) : null}
          </div>
          <div className="border-admin-line max-h-[380px] overflow-auto rounded-[12px] border">
            <div className="min-w-[600px]">
              <div
                className="text-admin-muted sticky top-0 grid gap-[10px] bg-[#f7f7f5] px-3 py-[10px] text-[14px] font-semibold"
                style={{ gridTemplateColumns: result.grid }}
              >
                {result.columns.map((c) => (
                  <span key={c}>{c}</span>
                ))}
              </div>
              {result.rows.slice(0, 200).map((r) => (
                <div
                  key={r.row}
                  className={cn(
                    "grid gap-[10px] border-t border-[#efefed] px-3 py-[10px] text-[14px]",
                    r.problem ? "bg-[#fdf2f1]" : "bg-white",
                  )}
                  style={{ gridTemplateColumns: result.grid }}
                >
                  {r.cells.map((c, i) => (
                    <span
                      key={i}
                      className={cn(
                        "min-w-0 break-words",
                        i === 0 && "text-admin-muted",
                        r.bad.includes(i) && "font-semibold text-[#9b2c22]",
                      )}
                    >
                      {c}
                    </span>
                  ))}
                  <span className="font-semibold text-[#9b2c22]">{r.problem}</span>
                </div>
              ))}
            </div>
          </div>
          {result.rows.length > 200 ? (
            <span className="text-admin-muted text-[14px]">Showing the first 200 rows.</span>
          ) : null}
          {result.errors.length ? (
            <label className="inline-flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={skip}
                onChange={(e) => setSkip(e.target.checked)}
                className="size-4 accent-forest-600"
              />
              Skip the {result.errors.length} {result.errors.length === 1 ? "row" : "rows"} with
              errors and import the rest
            </label>
          ) : null}
        </div>
      ) : null}

      {step === 3 && result ? (
        <div className="flex flex-col items-center gap-3 px-4 py-6 text-center">
          <span className="grid size-16 place-items-center rounded-full bg-[#e3f4e8] text-forest-600">
            <Icon name="check" size={28} />
          </span>
          <h3 className="m-0 text-[17px] font-bold">
            Ready to import {result.ready.length} {result.ready.length === 1 ? "row" : "rows"}
          </h3>
          <p className="text-admin-muted m-0 max-w-[440px] leading-[1.6]">
            {result.summary} {kind === "products" ? "" : "You can undo from Import history."}
          </p>
        </div>
      ) : null}
    </Dialog>
  );
}

export function ImportButton({
  kind,
  label = "Import",
  primary = false,
}: {
  kind: ImportKind;
  label?: string;
  primary?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={primary ? buttonStyles.primary : buttonStyles.secondary}
      >
        <Icon name="upload" size={16} />
        {label}
      </button>
      {open ? <Wizard initialKind={kind} onClose={() => setOpen(false)} /> : null}
    </>
  );
}
