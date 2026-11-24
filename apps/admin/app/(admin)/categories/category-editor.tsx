"use client";

import { cn } from "@northnectar/ui";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { DangerButton, Dialog } from "@/components/dialog";
import { Icon } from "@/components/icon";
import { RichTextEditor } from "@/components/rich-text-editor";
import { useToast } from "@/components/toast";
import { Card, CardHeader, buttonStyles, fieldStyles } from "@/components/ui";
import { type ImageAsset, slugify } from "@/lib/catalogue-shared";
import { imageSrc } from "@/lib/format";
import { uploadImage } from "@/lib/image-upload";
import { deleteCategory, saveCategory } from "./actions";

export interface CategoryFormValues {
  id: string;
  isNew: boolean;
  name: string;
  slug: string;
  description: string;
  image: ImageAsset | null;
  metaTitle: string;
  metaDescription: string;
  /** Page text below the products; paragraphs separated by a blank line. */
  content: string;
  faqs: { question: string; answer: string }[];
  products: number;
}

const MAX_FAQS = 12;

const RED = "border-[#d92d20]";

const wordCount = (text: string) => text.split(/\s+/).filter(Boolean).length;

export function CategoryEditor({ initial }: { initial: CategoryFormValues }) {
  const [v, setV] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [pending, start] = useTransition();
  const slugTouched = useRef(!initial.isNew);
  const file = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const router = useRouter();

  const save = () =>
    start(async () => {
      const result = await saveCategory({
        id: v.id,
        isNew: v.isNew,
        name: v.name,
        slug: v.slug || slugify(v.name),
        description: v.description,
        image: v.image,
        metaTitle: v.metaTitle,
        metaDescription: v.metaDescription,
        content: v.content,
        faqs: v.faqs,
      });
      if (!result.ok) {
        setErrors(result.fields ?? {});
        return toast.error(result.error);
      }
      setErrors({});
      toast.show(result.message);
      router.replace(`/categories?id=${result.id}`);
      router.refresh();
    });

  const field = (k: "name" | "slug", label: string) => (
    <div className="flex flex-col gap-[6px]">
      <label htmlFor={`ce-${k}`} className="text-[14px] font-semibold">
        {label}
      </label>
      <input
        id={`ce-${k}`}
        value={v[k]}
        placeholder={k === "slug" ? slugify(v.name) : undefined}
        onChange={(e) => {
          const value =
            k === "slug" ? e.target.value.toLowerCase().replace(/\s+/g, "-") : e.target.value;
          if (k === "slug") slugTouched.current = true;
          setV((x) => ({
            ...x,
            [k]: value,
            ...(k === "name" && !slugTouched.current ? { slug: slugify(value) } : {}),
          }));
        }}
        className={cn(fieldStyles.input, errors[k] && RED)}
      />
      {errors[k] ? (
        <span role="alert" className="text-[14px] text-[#b42318]">
          {errors[k]}
        </span>
      ) : null}
    </div>
  );

  return (
    <Card>
      <CardHeader title={v.isNew ? "Add category" : "Edit category"} />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
        className="flex flex-col gap-[14px]"
      >
        <div className="flex items-center gap-[14px]">
          {v.image ? (
            <Image
              src={imageSrc(v.image.src)!}
              alt=""
              width={84}
              height={84}
              className="border-admin-line size-[86px] rounded-[14px] border object-cover"
            />
          ) : (
            <span className="border-admin-line bg-admin-bg grid size-[86px] place-items-center rounded-[14px] border text-[#a3a3a3]">
              <Icon name="image" size={22} />
            </span>
          )}
          <span className="flex flex-col gap-[6px]">
            <button
              type="button"
              disabled={uploading}
              onClick={() => file.current?.click()}
              className={cn(buttonStyles.secondary, "self-start")}
            >
              <Icon name="image" size={16} />
              {uploading ? "Uploading…" : v.image ? "Change image" : "Add image"}
            </button>
            <span className="text-admin-muted text-[14px]">Square, at least 800 px</span>
          </span>
          <input
            ref={file}
            type="file"
            hidden
            accept="image/jpeg,image/png,image/webp,image/avif"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (!f) return;
              setUploading(true);
              try {
                const img = await uploadImage(f, `categories/${v.id}`, v.name || "Category");
                setV((x) => ({ ...x, image: img }));
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Upload failed");
              } finally {
                setUploading(false);
              }
            }}
          />
        </div>
        {field("name", "Name")}
        {field("slug", "URL slug")}
        <div className="flex flex-col gap-[6px]">
          <label htmlFor="ce-description" className="text-[14px] font-semibold">
            Description
          </label>
          <textarea
            id="ce-description"
            value={v.description}
            maxLength={400}
            onChange={(e) => setV({ ...v, description: e.target.value })}
            className={cn(fieldStyles.textarea, "min-h-[72px]")}
          />
        </div>
        <div className="flex flex-col gap-[14px] border-t border-[#f0f0ee] pt-[14px]">
          <span className="flex flex-col gap-1">
            <span className="text-[14px] font-bold">Page content</span>
            <span className="text-admin-muted text-[14px] leading-[1.5]">
              Shown below the products on the category page. Helps the page appear in Google
              searches.
            </span>
          </span>
          <div className="flex flex-col gap-[6px]">
            <span className="flex justify-between gap-2">
              <label htmlFor="ce-content" className="text-[14px] font-semibold">
                About this category
              </label>
              <span className="text-admin-muted text-[14px]">{wordCount(v.content)} words</span>
            </span>
            <RichTextEditor
              id="ce-content"
              label="About this category"
              value={v.content}
              minHeight={220}
              invalid={Boolean(errors.content)}
              onChange={(content) => setV((x) => ({ ...x, content }))}
            />
            <span className="text-admin-muted text-[14px]">
              Leave a blank line between paragraphs. 300 to 500 words works well.
            </span>
            {errors.content ? (
              <span role="alert" className="text-[14px] text-[#b42318]">
                {errors.content}
              </span>
            ) : null}
          </div>
          <fieldset className="m-0 flex flex-col gap-[10px] border-0 p-0">
            <legend className="mb-[6px] p-0 text-[14px] font-semibold">Common questions</legend>
            {v.faqs.length === 0 ? (
              <span className="text-admin-muted text-[14px]">
                No questions yet. Add the questions customers ask most about this category.
              </span>
            ) : null}
            {v.faqs.map((faq, i) => {
              const err =
                errors[`faqs.${i}`] ?? errors[`faqs.${i}.question`] ?? errors[`faqs.${i}.answer`];
              const update = (patch: Partial<typeof faq>) =>
                setV((x) => ({
                  ...x,
                  faqs: x.faqs.map((f, j) => (j === i ? { ...f, ...patch } : f)),
                }));
              return (
                <div
                  key={i}
                  className={cn(
                    "bg-admin-bg flex flex-col gap-2 rounded-[12px] border p-3",
                    err ? RED : "border-admin-line",
                  )}
                >
                  <span className="flex items-center justify-between gap-2">
                    <label htmlFor={`ce-q-${i}`} className="text-[14px] font-semibold">
                      Question {i + 1}
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setV((x) => ({ ...x, faqs: x.faqs.filter((_, j) => j !== i) }))
                      }
                      className="text-admin-muted inline-flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0 text-[14px] hover:text-[#b42318]"
                      aria-label={`Remove question ${i + 1}`}
                    >
                      <Icon name="trash" size={14} />
                      Remove
                    </button>
                  </span>
                  <input
                    id={`ce-q-${i}`}
                    value={faq.question}
                    placeholder="e.g. How do I brew wild thyme tea?"
                    onChange={(e) => update({ question: e.target.value })}
                    className={fieldStyles.input}
                  />
                  <textarea
                    aria-label={`Answer ${i + 1}`}
                    value={faq.answer}
                    placeholder="Answer"
                    onChange={(e) => update({ answer: e.target.value })}
                    className={cn(fieldStyles.textarea, "min-h-[84px]")}
                  />
                  {err ? (
                    <span role="alert" className="text-[14px] text-[#b42318]">
                      {err}
                    </span>
                  ) : null}
                </div>
              );
            })}
            {v.faqs.length < MAX_FAQS ? (
              <button
                type="button"
                onClick={() =>
                  setV((x) => ({ ...x, faqs: [...x.faqs, { question: "", answer: "" }] }))
                }
                className="inline-flex cursor-pointer items-center gap-[6px] self-start border-0 bg-transparent p-0 text-[14px] font-semibold text-forest-600 hover:underline"
              >
                <Icon name="plus" size={16} />
                Add question
              </button>
            ) : null}
          </fieldset>
        </div>
        <div className="flex flex-col gap-[14px] border-t border-[#f0f0ee] pt-[14px]">
          <span className="text-[14px] font-bold">Search engine listing</span>
          <div className="flex flex-col gap-[6px]">
            <label htmlFor="ce-mt" className="text-[14px] font-semibold">
              Meta title
            </label>
            <input
              id="ce-mt"
              value={v.metaTitle}
              placeholder={v.name ? `${v.name} | North Nectar` : ""}
              onChange={(e) => setV({ ...v, metaTitle: e.target.value })}
              className={fieldStyles.input}
            />
          </div>
          <div className="flex flex-col gap-[6px]">
            <label htmlFor="ce-md" className="text-[14px] font-semibold">
              Meta description
            </label>
            <textarea
              id="ce-md"
              value={v.metaDescription}
              placeholder={v.description}
              onChange={(e) => setV({ ...v, metaDescription: e.target.value })}
              className={cn(fieldStyles.textarea, "min-h-[72px]")}
            />
          </div>
        </div>
        <div className="flex items-center justify-between gap-2">
          {v.isNew ? (
            <span />
          ) : (
            <button
              type="button"
              onClick={() => setConfirm(true)}
              className={cn(buttonStyles.secondary, "text-[#b42318]")}
            >
              <Icon name="trash" size={16} />
              Delete
            </button>
          )}
          <button
            type="submit"
            disabled={pending || uploading}
            className={cn(buttonStyles.primary, "disabled:opacity-70")}
          >
            <Icon name="check" size={16} />
            {pending ? "Saving…" : v.isNew ? "Add category" : "Save changes"}
          </button>
        </div>
      </form>
      <Dialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Delete category?"
        footer={
          <>
            <button
              type="button"
              onClick={() => setConfirm(false)}
              className={buttonStyles.secondary}
            >
              Cancel
            </button>
            <DangerButton
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const result = await deleteCategory(v.id);
                  setConfirm(false);
                  if (!result.ok) return toast.error(result.error);
                  toast.show(result.message);
                  router.replace("/categories");
                  router.refresh();
                })
              }
            >
              Delete category
            </DangerButton>
          </>
        }
      >
        <div className="flex items-start gap-[14px]">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#fde8e6] text-[#b42318]">
            <Icon name="trash" size={18} />
          </span>
          <span className="flex flex-col gap-[6px]">
            <span className="font-bold">{v.name}</span>
            <span className="text-admin-muted leading-[1.6]">
              {v.products > 0
                ? `It still has ${v.products} ${v.products === 1 ? "product" : "products"}. Move them to another category first.`
                : "This removes the category and its image from your store. This can't be undone."}
            </span>
          </span>
        </div>
      </Dialog>
    </Card>
  );
}
