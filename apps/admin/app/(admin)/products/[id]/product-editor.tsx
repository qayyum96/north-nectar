"use client";

import { cn } from "@northnectar/ui";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { Icon } from "@/components/icon";
import { useToast } from "@/components/toast";
import {
  Card,
  CardHeader,
  PageBody,
  PageHeader,
  SelectBox,
  StatusBadge,
  buttonStyles,
  fieldStyles,
} from "@/components/ui";
import {
  BADGE_TONES,
  type ImageAsset,
  META_DESCRIPTION_MAX,
  META_TITLE_MAX,
  type ProductForm,
  type VariantForm,
  defaultMetaDescription,
  defaultMetaTitle,
  slugify,
} from "@/lib/catalogue-shared";
import { imageSrc } from "@/lib/format";
import { uploadImage } from "@/lib/image-upload";
import { duplicateProduct, saveProduct } from "../actions";
import { DeleteProductDialog } from "../products-table";

const RED = "border-[#d92d20]";

function FieldError({ message }: { message?: string }) {
  return message ? (
    <span role="alert" className="text-[14px] text-[#b42318]">
      {message}
    </span>
  ) : null;
}

function Label({
  htmlFor,
  children,
  right,
}: {
  htmlFor?: string;
  children: ReactNode;
  right?: ReactNode;
}) {
  return (
    <span className="flex justify-between gap-2">
      <label htmlFor={htmlFor} className="text-[14px] font-semibold">
        {children}
      </label>
      {right}
    </span>
  );
}

/* ---------------------------------------------------------------------------------------------
 * Description with the mockup's toolbar (B, I, U, List, Link)
 * ------------------------------------------------------------------------------------------- */

function DescriptionEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
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
    const url = window.prompt("Link address (https://…)", "https://");
    if (!url || !/^(https?:\/\/|mailto:|\/)/i.test(url)) return;
    wrap("[", `](${url})`, "link text");
  };

  const tool =
    "cursor-pointer rounded-[6px] border-0 bg-transparent px-2 py-1 text-[14px] hover:bg-[#ececea]";
  return (
    <div className="overflow-hidden rounded-[10px] border border-[#d4d4d1] focus-within:border-forest-600">
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
        id="pe-description"
        aria-label="Description"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="box-border block min-h-[120px] w-full resize-y border-0 p-3 text-[14px] leading-[1.6] outline-none"
      />
    </div>
  );
}

/* ---------------------------------------------------------------------------------------------
 * Media: upload, drop, reorder, remove
 * ------------------------------------------------------------------------------------------- */

function MediaCard({
  images,
  onChange,
  folder,
  altBase,
  error,
}: {
  images: ImageAsset[];
  onChange: (images: ImageAsset[]) => void;
  folder: string;
  altBase: string;
  error?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);
  const [over, setOver] = useState(false);
  const toast = useToast();
  const latest = useRef(images);
  useEffect(() => {
    latest.current = images;
  }, [images]);

  const add = async (files: FileList | File[]) => {
    const list = [...files].filter((f) => f.type.startsWith("image/"));
    if (!list.length) return;
    setUploading((n) => n + list.length);
    for (const file of list) {
      try {
        const img = await uploadImage(file, folder, altBase);
        latest.current = [...latest.current, img];
        onChange(latest.current);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Upload failed");
      } finally {
        setUploading((n) => n - 1);
      }
    }
  };

  const move = (i: number, to: number) => {
    const next = [...images];
    const [img] = next.splice(i, 1);
    next.splice(to, 0, img!);
    onChange(next);
  };

  return (
    <Card>
      <div className="flex items-center justify-between gap-3 pb-[14px]">
        <h2 className="m-0 text-[15px] font-[650]">Media</h2>
        <button
          type="button"
          className={buttonStyles.secondary}
          onClick={() => input.current?.click()}
        >
          <Icon name="upload" size={16} />
          Add images
        </button>
      </div>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files) void add(e.target.files);
          e.target.value = "";
        }}
      />
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          void add(e.dataTransfer.files);
        }}
        className={cn(
          "grid grid-cols-[repeat(auto-fill,minmax(110px,1fr))] gap-[10px] rounded-[12px]",
          over && "outline-2 outline-offset-4 outline-forest-600 outline-dashed",
        )}
      >
        {images.map((img, i) => (
          <div
            key={img.src}
            className={cn(
              "group border-admin-line relative overflow-hidden rounded-[12px] border",
              i === 0 ? "col-span-2 row-span-2 min-h-[230px]" : "aspect-square",
            )}
            style={{ background: img.background ?? "#f3eadb" }}
          >
            <Image
              src={imageSrc(img.src)!}
              alt={img.alt || altBase}
              fill
              sizes={i === 0 ? "280px" : "140px"}
              className="object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 flex flex-wrap justify-end gap-1 bg-gradient-to-t from-black/55 to-transparent p-2 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
              {i > 0 ? (
                <button
                  type="button"
                  onClick={() => move(i, 0)}
                  className="h-7 cursor-pointer rounded-[6px] border-0 bg-white/95 px-2 text-[13px] font-semibold"
                >
                  Make main
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  const alt = window.prompt(
                    "Describe this image for search engines and screen readers",
                    img.alt,
                  );
                  if (alt !== null)
                    onChange(images.map((x, j) => (j === i ? { ...x, alt: alt.trim() } : x)));
                }}
                className="h-7 cursor-pointer rounded-[6px] border-0 bg-white/95 px-2 text-[13px] font-semibold"
              >
                Alt text
              </button>
              <button
                type="button"
                aria-label="Remove image"
                onClick={() => onChange(images.filter((_, j) => j !== i))}
                className="grid h-7 w-7 cursor-pointer place-items-center rounded-[6px] border-0 bg-white/95 text-[#b42318]"
              >
                <Icon name="trash" size={14} />
              </button>
            </div>
          </div>
        ))}
        {Array.from({ length: uploading }, (_, i) => (
          <span
            key={`up-${i}`}
            className="text-admin-muted bg-admin-bg grid aspect-square place-items-center rounded-[12px] border border-[#e3e3e3] text-[14px]"
          >
            Uploading…
          </span>
        ))}
        <button
          type="button"
          onClick={() => input.current?.click()}
          className={cn(
            "text-admin-muted flex aspect-square cursor-pointer flex-col items-center justify-center gap-[6px] rounded-[12px] border-[1.5px] border-dashed bg-transparent text-center text-[14px] hover:bg-[#fafaf9]",
            error ? "border-[#d92d20]" : "border-[#c9c9c5]",
          )}
        >
          <Icon name="upload" size={16} />
          Drop images
        </button>
      </div>
      {error ? (
        <div className="pt-2">
          <FieldError message={error} />
        </div>
      ) : (
        <p className="text-admin-muted m-0 pt-3 text-[14px]">
          The first image is the main one. Photos are resized to 1600 px WebP before upload.
        </p>
      )}
    </Card>
  );
}

/* ---------------------------------------------------------------------------------------------
 * Variants table
 * ------------------------------------------------------------------------------------------- */

const VGRID = "64px minmax(0,1fr) minmax(0,1fr) minmax(0,1.3fr) 76px 80px 28px";

function VariantsCard({
  variants,
  onChange,
  errors,
}: {
  variants: VariantForm[];
  onChange: (v: VariantForm[]) => void;
  errors: Record<string, string>;
}) {
  const set = (i: number, patch: Partial<VariantForm>) =>
    onChange(variants.map((v, j) => (j === i ? { ...v, ...patch } : v)));
  const cell = (i: number, k: keyof VariantForm, label: string, extra?: string) => {
    const err = errors[`variants.${i}.${k}`];
    return (
      <span className="flex flex-col gap-1">
        <input
          aria-label={`${label} for ${variants[i]!.label || `size ${i + 1}`}`}
          value={String(variants[i]![k])}
          onChange={(e) => set(i, { [k]: e.target.value } as Partial<VariantForm>)}
          inputMode={k === "sku" ? undefined : "numeric"}
          className={cn(
            "box-border h-9 w-full rounded-[8px] border bg-white px-[10px] text-[14px]",
            err ? RED : "border-[#d4d4d1]",
            extra,
          )}
        />
        <FieldError message={err} />
      </span>
    );
  };
  return (
    <Card>
      <CardHeader
        title="Variants"
        action={
          <span className="text-admin-muted text-[14px]">
            {variants.length} {variants.length === 1 ? "size" : "sizes"}
          </span>
        }
      />
      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          <div
            className="text-admin-muted grid gap-[10px] border-b border-[#e3e3e3] py-[10px] text-[14px] font-semibold"
            style={{ gridTemplateColumns: VGRID }}
          >
            <span>Size</span>
            <span>Price</span>
            <span>Compare-at price</span>
            <span>SKU</span>
            <span>Stock</span>
            <span>Weight</span>
            <span />
          </div>
          {variants.map((v, i) => (
            <div
              key={v.key}
              className="grid items-center gap-[10px] border-b border-[#f0f0ee] py-[10px]"
              style={{ gridTemplateColumns: VGRID }}
            >
              <span className="flex flex-col gap-1">
                <input
                  aria-label={`Size name ${i + 1}`}
                  value={v.label}
                  placeholder="100g"
                  onChange={(e) => set(i, { label: e.target.value })}
                  className={cn(
                    "box-border h-9 w-full rounded-[8px] border px-1 text-[14px] font-bold",
                    errors[`variants.${i}.label`]
                      ? RED
                      : v.id
                        ? "border-transparent bg-transparent hover:border-[#d4d4d1] focus:border-[#d4d4d1]"
                        : "border-[#d4d4d1] px-[10px]",
                  )}
                />
              </span>
              {cell(i, "price", "Price")}
              {cell(i, "compare", "Compare-at price")}
              {cell(i, "sku", "SKU", "uppercase")}
              <span
                title={v.reserved ? `${v.reserved} held by open orders` : undefined}
                className="contents"
              >
                {cell(i, "stock", "Stock")}
              </span>
              {cell(i, "weight", "Shipping weight")}
              <button
                type="button"
                aria-label={`Remove size ${v.label || i + 1}`}
                disabled={variants.length === 1 || v.reserved > 0}
                title={v.reserved > 0 ? "In open orders" : undefined}
                onClick={() => onChange(variants.filter((_, j) => j !== i))}
                className="text-admin-muted hover:bg-admin-bg grid size-7 cursor-pointer place-items-center rounded-[6px] border-0 bg-transparent hover:text-[#b42318] disabled:cursor-default disabled:opacity-30"
              >
                <Icon name="x" size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
      <button
        type="button"
        onClick={() =>
          onChange([
            ...variants,
            {
              id: "",
              key: crypto.randomUUID(),
              label: "",
              price: "",
              compare: "",
              sku: "",
              stock: "0",
              weight: "",
              tag: "",
              isDefault: false,
              reserved: 0,
            },
          ])
        }
        className="mt-3 inline-flex cursor-pointer items-center gap-[6px] border-0 bg-transparent p-0 text-[14px] font-semibold text-forest-600 hover:underline"
      >
        <Icon name="plus" size={16} />
        Add another size
      </button>
      {errors.variants ? <FieldError message={errors.variants} /> : null}
    </Card>
  );
}

/* ---------------------------------------------------------------------------------------------
 * Website details (fields only the storefront uses)
 * ------------------------------------------------------------------------------------------- */

function RowsEditor<T extends Record<string, string>>({
  rows,
  onChange,
  fields,
  addLabel,
  empty,
}: {
  rows: T[];
  onChange: (rows: T[]) => void;
  fields: { key: keyof T & string; label: string; wide?: boolean }[];
  addLabel: string;
  empty: T;
}) {
  return (
    <div className="flex flex-col gap-2">
      {rows.map((row, i) => (
        <div key={i} className="flex items-start gap-2">
          {fields.map((f) => (
            <input
              key={f.key}
              aria-label={`${f.label} ${i + 1}`}
              placeholder={f.label}
              value={row[f.key]}
              onChange={(e) =>
                onChange(rows.map((r, j) => (j === i ? { ...r, [f.key]: e.target.value } : r)))
              }
              className={cn(fieldStyles.input, f.wide ? "flex-[2]" : "flex-1")}
            />
          ))}
          <button
            type="button"
            aria-label={`Remove row ${i + 1}`}
            onClick={() => onChange(rows.filter((_, j) => j !== i))}
            className="text-admin-muted hover:bg-admin-bg grid size-10 shrink-0 cursor-pointer place-items-center rounded-[8px] border-0 bg-transparent hover:text-[#b42318]"
          >
            <Icon name="x" size={14} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...rows, { ...empty }])}
        className="inline-flex cursor-pointer items-center gap-[6px] self-start border-0 bg-transparent p-0 text-[14px] font-semibold text-forest-600 hover:underline"
      >
        <Icon name="plus" size={16} />
        {addLabel}
      </button>
    </div>
  );
}

function WebsiteDetails({
  form,
  set,
  others,
}: {
  form: ProductForm;
  set: (patch: Partial<ProductForm>) => void;
  others: { id: string; name: string }[];
}) {
  const text = (k: keyof ProductForm, label: string, placeholder?: string, hint?: string) => (
    <div className="flex flex-col gap-[6px]">
      <Label htmlFor={`pe-${k}`}>{label}</Label>
      <input
        id={`pe-${k}`}
        value={String(form[k])}
        placeholder={placeholder}
        onChange={(e) => set({ [k]: e.target.value } as Partial<ProductForm>)}
        className={fieldStyles.input}
      />
      {hint ? <span className="text-admin-muted text-[14px]">{hint}</span> : null}
    </div>
  );
  return (
    <Card>
      <CardHeader
        title="Website details"
        action={<span className="text-admin-muted text-[14px]">Shown on the product page</span>}
      />
      <div className="flex flex-col gap-[14px]">
        <div className="grid grid-cols-1 gap-[14px] md:grid-cols-2">
          {text("tagline", "Tagline", "One line for product cards")}
          {text("shortName", "Short name", "e.g. Wild Thyme Tea", "For the cart and small spaces")}
          {text("botanicalName", "Botanical name", "e.g. Thymus linearis")}
          {text("origin", "Origin", "e.g. Hunza, Gilgit-Baltistan")}
          <div className="flex flex-col gap-[6px]">
            <Label htmlFor="pe-mode">How it is sold</Label>
            <SelectBox
              id="pe-mode"
              value={form.purchaseMode}
              onChange={(e) => set({ purchaseMode: e.target.value as ProductForm["purchaseMode"] })}
            >
              <option value="retail">Add to cart (retail)</option>
              <option value="quote">Request a quote (bulk only, no price shown)</option>
            </SelectBox>
          </div>
          <div className="flex flex-col gap-[6px]">
            <Label htmlFor="pe-badge">Badge</Label>
            <div className="flex gap-2">
              <input
                id="pe-badge"
                value={form.badgeLabel}
                placeholder="e.g. New"
                onChange={(e) => set({ badgeLabel: e.target.value })}
                className={cn(fieldStyles.input, "flex-1")}
              />
              <span className="w-[120px]">
                <SelectBox
                  aria-label="Badge colour"
                  value={form.badgeTone}
                  onChange={(e) => set({ badgeTone: e.target.value as ProductForm["badgeTone"] })}
                >
                  {BADGE_TONES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </SelectBox>
              </span>
            </div>
          </div>
        </div>

        <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
          <legend className="mb-2 p-0 text-[14px] font-semibold">Home page</legend>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {(
              [
                ["isFeatured", "Featured"],
                ["isBestSeller", "Best seller"],
                ["isNewArrival", "New arrival"],
              ] as const
            ).map(([k, l]) => (
              <label key={k} className="inline-flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={form[k]}
                  onChange={(e) => set({ [k]: e.target.checked })}
                  className="size-4 accent-forest-600"
                />
                {l}
              </label>
            ))}
            <label className="inline-flex items-center gap-2">
              Sort position
              <input
                type="number"
                min={0}
                value={form.popularityRank}
                onChange={(e) => set({ popularityRank: e.target.value })}
                className={cn(fieldStyles.input, "h-9 w-[84px]")}
                aria-describedby="pe-rank-hint"
              />
            </label>
            <span id="pe-rank-hint" className="text-admin-muted text-[14px]">
              Lower numbers show first
            </span>
          </div>
        </fieldset>

        <div className="grid grid-cols-1 gap-[14px] md:grid-cols-2">
          <div className="flex flex-col gap-[6px]">
            <Label htmlFor="pe-highlights">Highlights</Label>
            <textarea
              id="pe-highlights"
              value={form.highlights}
              onChange={(e) => set({ highlights: e.target.value })}
              placeholder={"Wild-picked in Hunza\nNaturally caffeine-free"}
              className={cn(fieldStyles.textarea, "min-h-[96px]")}
            />
            <span className="text-admin-muted text-[14px]">One per line</span>
          </div>
          <div className="flex flex-col gap-[6px]">
            <Label htmlFor="pe-ways">Ways to enjoy</Label>
            <textarea
              id="pe-ways"
              value={form.waysToEnjoy}
              onChange={(e) => set({ waysToEnjoy: e.target.value })}
              placeholder={"A warm cup after meals\nIced, with a slice of lemon"}
              className={cn(fieldStyles.textarea, "min-h-[96px]")}
            />
            <span className="text-admin-muted text-[14px]">One per line</span>
          </div>
        </div>

        <div className="flex flex-col gap-[6px]">
          <span className="text-[14px] font-semibold">How to use</span>
          <RowsEditor
            rows={form.howToUse}
            onChange={(howToUse) => set({ howToUse })}
            fields={[
              { key: "title", label: "Step" },
              { key: "description", label: "Details", wide: true },
            ]}
            addLabel="Add step"
            empty={{ title: "", description: "" }}
          />
        </div>
        <div className="flex flex-col gap-[6px]">
          <span className="text-[14px] font-semibold">Product details table</span>
          <RowsEditor
            rows={form.attributes}
            onChange={(attributes) => set({ attributes })}
            fields={[
              { key: "label", label: "Label, e.g. Ingredients" },
              { key: "value", label: "Value", wide: true },
            ]}
            addLabel="Add detail"
            empty={{ label: "", value: "" }}
          />
        </div>

        <div className="flex flex-col gap-[6px]">
          <span className="text-[14px] font-semibold">Size labels</span>
          <div className="flex flex-col gap-2">
            {form.variants.map((v, i) => (
              <div key={v.key} className="flex flex-wrap items-center gap-3">
                <span className="w-[72px] font-semibold">{v.label || `Size ${i + 1}`}</span>
                <input
                  aria-label={`Tag for ${v.label || `size ${i + 1}`}`}
                  placeholder="Tag, e.g. Popular"
                  value={v.tag}
                  onChange={(e) =>
                    set({
                      variants: form.variants.map((x, j) =>
                        j === i ? { ...x, tag: e.target.value } : x,
                      ),
                    })
                  }
                  className={cn(fieldStyles.input, "h-9 w-[200px]")}
                />
                <label className="inline-flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="pe-default"
                    checked={v.isDefault}
                    onChange={() =>
                      set({ variants: form.variants.map((x, j) => ({ ...x, isDefault: j === i })) })
                    }
                    className="size-4 accent-forest-600"
                  />
                  Selected first
                </label>
              </div>
            ))}
          </div>
        </div>

        {others.length > 0 ? (
          <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
            <legend className="mb-2 p-0 text-[14px] font-semibold">Related products</legend>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {others.map((o) => (
                <label key={o.id} className="inline-flex min-w-0 cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.relatedIds.includes(o.id)}
                    onChange={(e) =>
                      set({
                        relatedIds: e.target.checked
                          ? [...form.relatedIds, o.id]
                          : form.relatedIds.filter((x) => x !== o.id),
                      })
                    }
                    className="size-4 shrink-0 accent-forest-600"
                  />
                  <span className="truncate">{o.name}</span>
                </label>
              ))}
            </div>
          </fieldset>
        ) : null}
      </div>
    </Card>
  );
}

/* ---------------------------------------------------------------------------------------------
 * The editor
 * ------------------------------------------------------------------------------------------- */

export function ProductEditor({
  initial,
  categories,
  others,
  lastEdited,
  storefrontUrl,
}: {
  initial: ProductForm;
  categories: { id: string; name: string }[];
  others: { id: string; name: string }[];
  lastEdited: string | null;
  storefrontUrl: string;
}) {
  const [form, setForm] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [problems, setProblems] = useState<string[]>([]);
  const [heading, setHeading] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleting, setDeleting] = useState(false);
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const slugTouched = useRef(!initial.isNew);

  const set = (patch: Partial<ProductForm>) => setForm((f) => ({ ...f, ...patch }));
  const dirty = JSON.stringify(form) !== JSON.stringify(saved);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const host = new URL(storefrontUrl).host;
  const slug = form.slug || slugify(form.name);
  const metaTitle = form.metaTitle || defaultMetaTitle(form.name);
  const metaDesc = form.metaDescription || defaultMetaDescription(form);
  const units = form.variants.reduce((s, v) => s + (Number(v.stock) || 0), 0);
  const outLabels = form.variants
    .filter((v) => (Number(v.stock) || 0) - v.reserved <= 0)
    .map((v) => v.label || "New size");

  const save = () =>
    start(async () => {
      const result = await saveProduct({ ...form, slug });
      if (!result.ok) {
        setHeading(result.error);
        setProblems(result.problems ?? [result.error]);
        setErrors(result.fields ?? {});
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      setProblems([]);
      setErrors({});
      const next = { ...form, slug, isNew: false, id: result.id };
      setForm(next);
      setSaved(next);
      toast.show(
        result.message,
        form.status === "active"
          ? { label: "View on website", href: `${storefrontUrl}/products/${slug}` }
          : undefined,
      );
      if (initial.isNew) router.replace(`/products/${result.id}`);
      else router.refresh();
    });

  const duplicate = () =>
    start(async () => {
      const result = await duplicateProduct(form.id);
      if (!result.ok) return toast.error(result.error);
      toast.show(result.message);
      router.push(`/products/${result.id}`);
    });

  const canPreview = !form.isNew && saved.status === "active";

  return (
    <>
      <PageHeader
        crumbs={[
          { label: "Catalogue" },
          { label: "Products", href: "/products" },
          { label: form.isNew ? "Add product" : "Edit product" },
        ]}
        title={form.name.trim() || "Untitled product"}
        badge={<StatusBadge status={form.status} />}
        subtitle={`${form.variants.length} ${form.variants.length === 1 ? "size" : "sizes"} · ${units.toLocaleString("en-US")} units on hand${lastEdited ? ` · last edited ${lastEdited}` : form.isNew ? " · not saved yet" : ""}`}
        actions={
          <>
            {canPreview ? (
              <a
                href={`${storefrontUrl}/products/${saved.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonStyles.secondary}
              >
                <Icon name="eye" size={16} />
                Preview
              </a>
            ) : (
              <button
                type="button"
                disabled
                title="Save it as Active to see it on the website"
                className={cn(buttonStyles.secondary, "cursor-default opacity-50")}
              >
                <Icon name="eye" size={16} />
                Preview
              </button>
            )}
            <button
              type="button"
              disabled={form.isNew || pending}
              onClick={duplicate}
              className={cn(buttonStyles.secondary, "disabled:cursor-default disabled:opacity-50")}
            >
              Duplicate
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={save}
              className={cn(buttonStyles.primary, "disabled:opacity-70")}
            >
              <Icon name="check" size={16} />
              {pending ? "Saving…" : "Save"}
            </button>
          </>
        }
      />
      <PageBody>
        {problems.length > 0 ? (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-[12px] border border-[#f5c2bc] bg-[#fdecea] px-4 py-[14px] text-[#8f1d14]"
          >
            <Icon name="x" size={18} className="mt-[2px] shrink-0" />
            <span className="flex flex-col gap-1">
              <strong>{heading}</strong>
              <span>{problems.join(" ")}</span>
            </span>
          </div>
        ) : null}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
          className="flex flex-wrap items-start gap-4"
        >
          <div className="flex min-w-0 flex-[2_1_560px] flex-col gap-4">
            <Card>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-[6px]">
                  <Label htmlFor="pe-name">Title</Label>
                  <input
                    id="pe-name"
                    value={form.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      set(slugTouched.current ? { name } : { name, slug: slugify(name) });
                    }}
                    className={cn(fieldStyles.input, errors.name && RED)}
                  />
                  <FieldError message={errors.name} />
                </div>
                <div className="flex flex-col gap-[6px]">
                  <Label htmlFor="pe-description">Description</Label>
                  <DescriptionEditor
                    value={form.description}
                    onChange={(description) => set({ description })}
                  />
                  <span className="text-admin-muted text-[14px]">
                    The first paragraph shows at the top of the product page. Leave a blank line
                    between paragraphs.
                  </span>
                </div>
              </div>
            </Card>

            <MediaCard
              images={form.images}
              onChange={(images) => set({ images })}
              folder={`products/${form.id}`}
              altBase={form.name.trim() || "Product image"}
              error={errors.images}
            />

            <VariantsCard
              variants={form.variants}
              onChange={(variants) => set({ variants })}
              errors={errors}
            />

            <WebsiteDetails form={form} set={set} others={others.filter((o) => o.id !== form.id)} />

            <Card>
              <div className="flex items-center justify-between gap-3 pb-[14px]">
                <h2 className="m-0 text-[15px] font-[650]">Search engine listing</h2>
                <button
                  type="button"
                  onClick={() => {
                    slugTouched.current = false;
                    set({ metaTitle: "", metaDescription: "", slug: slugify(form.name) });
                  }}
                  className="cursor-pointer border-0 bg-transparent p-0 text-[14px] font-semibold text-forest-600 hover:underline"
                >
                  Reset to defaults
                </button>
              </div>
              <div className="mb-4 flex flex-col gap-1 rounded-[12px] border border-[#ececea] bg-[#fafaf8] px-4 py-[14px]">
                <span className="truncate text-[14px] text-[#3c4043]">
                  {host} › products › {slug || "…"}
                </span>
                <span className="text-[18px] leading-[1.3] text-[#1a0dab]">
                  {metaTitle || "Product title | North Nectar"}
                </span>
                <span className="text-[14px] leading-[1.55] text-[#4d5156]">
                  {metaDesc ||
                    "Add a description to see how this product appears in search results."}
                </span>
              </div>
              <div className="flex flex-col gap-[14px]">
                <div className="flex flex-col gap-[6px]">
                  <Label htmlFor="pe-slug">URL slug</Label>
                  <span
                    className={cn(
                      "flex items-center overflow-hidden rounded-[10px] border",
                      errors.slug ? RED : "border-[#d4d4d1]",
                    )}
                  >
                    <span className="text-admin-muted inline-flex h-10 shrink-0 items-center border-r border-[#e3e3e0] bg-[#f5f5f3] px-[10px] text-[14px]">
                      {host}/products/
                    </span>
                    <input
                      id="pe-slug"
                      value={form.slug}
                      placeholder={slugify(form.name)}
                      onChange={(e) => {
                        slugTouched.current = true;
                        set({ slug: e.target.value.toLowerCase().replace(/\s+/g, "-") });
                      }}
                      className="h-10 min-w-0 flex-1 border-0 px-[10px] text-[14px] outline-none"
                    />
                  </span>
                  <FieldError message={errors.slug} />
                </div>
                <div className="flex flex-col gap-[6px]">
                  <Label
                    htmlFor="pe-mt"
                    right={
                      <span
                        className={cn(
                          "text-[14px]",
                          metaTitle.length > META_TITLE_MAX ? "text-[#b42318]" : "text-admin-muted",
                        )}
                      >
                        {metaTitle.length} of {META_TITLE_MAX}
                      </span>
                    }
                  >
                    Meta title
                  </Label>
                  <input
                    id="pe-mt"
                    value={form.metaTitle}
                    placeholder={defaultMetaTitle(form.name)}
                    onChange={(e) => set({ metaTitle: e.target.value })}
                    className={fieldStyles.input}
                  />
                </div>
                <div className="flex flex-col gap-[6px]">
                  <Label
                    htmlFor="pe-md"
                    right={
                      <span
                        className={cn(
                          "text-[14px]",
                          metaDesc.length > META_DESCRIPTION_MAX
                            ? "text-[#b42318]"
                            : "text-admin-muted",
                        )}
                      >
                        {metaDesc.length} of {META_DESCRIPTION_MAX}
                      </span>
                    }
                  >
                    Meta description
                  </Label>
                  <textarea
                    id="pe-md"
                    value={form.metaDescription}
                    placeholder={defaultMetaDescription(form)}
                    onChange={(e) => set({ metaDescription: e.target.value })}
                    className={cn(fieldStyles.textarea, "min-h-[80px] leading-[1.55]")}
                  />
                </div>
              </div>
            </Card>

            {form.isNew ? null : (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setDeleting(true)}
                  className="inline-flex cursor-pointer items-center gap-[6px] border-0 bg-transparent p-0 text-[14px] font-semibold text-[#b42318] hover:underline"
                >
                  <Icon name="trash" size={16} />
                  Delete this product
                </button>
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-[1_1_280px] flex-col gap-4">
            <Card>
              <CardHeader title="Status" />
              <div
                role="radiogroup"
                aria-label="Status"
                className="bg-admin-seg inline-flex gap-[2px] rounded-[10px] p-[3px]"
              >
                {(["active", "draft"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    role="radio"
                    aria-checked={form.status === s}
                    onClick={() => set({ status: s })}
                    className={cn(
                      "text-admin-text h-8 cursor-pointer rounded-[8px] border-0 px-[14px] text-[14px]",
                      form.status === s
                        ? "bg-white font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.12)]"
                        : "bg-transparent font-medium",
                    )}
                  >
                    {s === "active" ? "Active" : "Draft"}
                  </button>
                ))}
              </div>
              <span className="text-admin-muted block pt-[10px] text-[14px]">
                {form.status === "active"
                  ? `Visible on ${host} and in search results.`
                  : "Hidden from your store until you set it to Active."}
              </span>
            </Card>

            <Card>
              <CardHeader title="Organisation" />
              <div className="flex flex-col gap-[14px]">
                <div className="flex flex-col gap-[6px]">
                  <Label htmlFor="pe-category">Category</Label>
                  <SelectBox
                    id="pe-category"
                    value={form.categoryId}
                    onChange={(e) => set({ categoryId: e.target.value })}
                    className={errors.categoryId ? RED : undefined}
                  >
                    <option value="">Choose a category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </SelectBox>
                  <FieldError message={errors.categoryId} />
                </div>
                <div className="flex flex-col gap-[6px]">
                  <Label htmlFor="pe-vendor">Vendor</Label>
                  <input
                    id="pe-vendor"
                    value={form.vendor}
                    onChange={(e) => set({ vendor: e.target.value })}
                    className={fieldStyles.input}
                  />
                </div>
                <div className="flex flex-col gap-[6px]">
                  <Label htmlFor="pe-tags">Tags</Label>
                  <input
                    id="pe-tags"
                    value={form.tags}
                    onChange={(e) => set({ tags: e.target.value })}
                    className={fieldStyles.input}
                  />
                  <span className="text-admin-muted text-[14px]">Separate tags with commas</span>
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader title="Inventory summary" />
              <div className="flex flex-col gap-2">
                <div className="flex justify-between gap-3">
                  <span className="text-admin-muted">On hand</span>
                  <span className="font-semibold">{units.toLocaleString("en-US")} units</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-admin-muted">Out of stock</span>
                  <span
                    className={cn(
                      "text-right font-semibold",
                      outLabels.length ? "text-[#b42318]" : "",
                    )}
                  >
                    {outLabels.length ? outLabels.join(", ") : "None"}
                  </span>
                </div>
              </div>
              <div className="pt-3">
                <Link
                  href="/stock"
                  className="text-[14px] font-semibold text-forest-600 hover:underline"
                >
                  Manage stock
                </Link>
              </div>
            </Card>
          </div>
        </form>
      </PageBody>
      <DeleteProductDialog
        product={deleting ? { id: form.id, name: form.name, sizes: form.variants.length } : null}
        onClose={() => setDeleting(false)}
        after={() => router.push("/products")}
      />
    </>
  );
}
