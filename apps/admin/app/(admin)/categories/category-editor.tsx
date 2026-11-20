"use client";

import { cn } from "@northnectar/ui";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { DangerButton, Dialog } from "@/components/dialog";
import { Icon } from "@/components/icon";
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
  products: number;
}

const RED = "border-[#d92d20]";

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
