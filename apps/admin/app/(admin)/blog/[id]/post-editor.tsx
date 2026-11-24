"use client";

import { cn } from "@northnectar/ui";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { DangerButton, Dialog } from "@/components/dialog";
import { Icon } from "@/components/icon";
import { RichTextEditor } from "@/components/rich-text-editor";
import { useToast } from "@/components/toast";
import {
  Card,
  CardHeader,
  PageBody,
  PageHeader,
  StatusBadge,
  Switch,
  buttonStyles,
  fieldStyles,
} from "@/components/ui";
import type { PostForm } from "@/lib/blog";
import { slugify } from "@/lib/catalogue-shared";
import { imageSrc } from "@/lib/format";
import { uploadImage } from "@/lib/image-upload";
import { deletePost, savePost } from "../actions";

const RED = "border-[#d92d20]";
const MAX_RELATED = 4;

const wordCount = (text: string) =>
  text
    .replace(/^#{2,3}\s+/gm, "")
    .split(/\s+/)
    .filter(Boolean).length;

function FieldError({ message }: { message?: string }) {
  return message ? (
    <span role="alert" className="text-[14px] text-[#b42318]">
      {message}
    </span>
  ) : null;
}

export function PostEditor({
  initial,
  products,
  lastEdited,
  today,
  storefrontUrl,
}: {
  initial: PostForm;
  products: { slug: string; name: string; live: boolean }[];
  lastEdited: string | null;
  /** YYYY-MM-DD in Pakistan time, from the server (so server and browser agree). */
  today: string;
  storefrontUrl: string;
}) {
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [pending, start] = useTransition();
  const slugTouched = useRef(!initial.isNew);
  const file = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const router = useRouter();
  const set = (patch: Partial<PostForm>) => setForm((f) => ({ ...f, ...patch }));

  const host = new URL(storefrontUrl).host;
  const slug = form.slug || slugify(form.title);
  const words = wordCount(form.body);
  const metaTitle = form.metaTitle || form.title;
  const metaDesc = form.metaDescription || form.excerpt;
  const scheduled = form.published && form.publishDate > today;
  const liveUrl =
    initial.published && initial.publishDate <= today
      ? `${storefrontUrl}/blog/${initial.slug}`
      : null;

  const save = () =>
    start(async () => {
      const result = await savePost({ ...form, slug });
      if (!result.ok) {
        setErrors(result.fields ?? {});
        return toast.error(result.error);
      }
      setErrors({});
      toast.show(result.message);
      if (form.isNew) router.replace(`/blog/${result.id}`);
      router.refresh();
    });

  const statusBadge = !form.published ? (
    <StatusBadge status="draft" label="Draft" />
  ) : scheduled ? (
    <StatusBadge status="pending" label="Scheduled" />
  ) : (
    <StatusBadge status="active" label="Published" />
  );

  return (
    <>
      <PageHeader
        crumbs={[
          { label: "Website" },
          { label: "Blog", href: "/blog" },
          { label: form.isNew ? "New post" : "Edit post" },
        ]}
        title={form.title || (form.isNew ? "New post" : "Untitled post")}
        badge={statusBadge}
        subtitle={lastEdited ? `Last edited ${lastEdited}` : "Not saved yet"}
        actions={
          <>
            {liveUrl ? (
              <a href={liveUrl} target="_blank" rel="noreferrer" className={buttonStyles.secondary}>
                <Icon name="eye" size={16} />
                View on website
              </a>
            ) : null}
            <button
              type="button"
              disabled={pending || uploading}
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
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
          className="flex flex-wrap items-start gap-4"
        >
          <div className="flex min-w-0 flex-[2_1_560px] flex-col gap-4">
            <Card>
              <div className="flex flex-col gap-[14px]">
                <div className="flex flex-col gap-[6px]">
                  <label htmlFor="po-title" className="text-[14px] font-semibold">
                    Title
                  </label>
                  <input
                    id="po-title"
                    value={form.title}
                    placeholder="e.g. How to check if shilajit is real"
                    onChange={(e) => {
                      const title = e.target.value;
                      set(slugTouched.current ? { title } : { title, slug: slugify(title) });
                    }}
                    className={cn(
                      fieldStyles.input,
                      "text-[16px] font-semibold",
                      errors.title && RED,
                    )}
                  />
                  <FieldError message={errors.title} />
                </div>
                <div className="flex flex-col gap-[6px]">
                  <span className="flex justify-between gap-2">
                    <label htmlFor="po-excerpt" className="text-[14px] font-semibold">
                      Summary
                    </label>
                    <span
                      className={cn(
                        "text-[14px]",
                        form.excerpt.length > 300 ? "text-[#b42318]" : "text-admin-muted",
                      )}
                    >
                      {form.excerpt.length} of 300
                    </span>
                  </span>
                  <textarea
                    id="po-excerpt"
                    value={form.excerpt}
                    placeholder="One or two sentences shown on the blog page and under the title."
                    onChange={(e) => set({ excerpt: e.target.value })}
                    className={cn(fieldStyles.textarea, "min-h-[72px]", errors.excerpt && RED)}
                  />
                  <FieldError message={errors.excerpt} />
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between gap-3 pb-[14px]">
                <h2 className="m-0 text-[15px] font-[650]">Article</h2>
                <span className="text-admin-muted text-[14px]">
                  {words} words · {Math.max(1, Math.round(words / 200))} min read
                </span>
              </div>
              <RichTextEditor
                id="po-body"
                label="Article"
                value={form.body}
                minHeight={420}
                headings
                invalid={Boolean(errors.body)}
                onChange={(body) => set({ body })}
              />
              <p className="text-admin-muted m-0 mt-2 text-[14px] leading-[1.55]">
                Leave a blank line between paragraphs. Use <strong>H</strong> for section headings
                (they also make the &ldquo;In this article&rdquo; list). Link to products with{" "}
                <strong>Link</strong>, for example /products/himalayan-shilajit-resin. 600 to 1,200
                words works well.
              </p>
              <FieldError message={errors.body} />
            </Card>

            <Card>
              <div className="flex items-center justify-between gap-3 pb-[14px]">
                <h2 className="m-0 text-[15px] font-[650]">Search engine listing</h2>
              </div>
              <div className="mb-4 flex flex-col gap-1 rounded-[12px] border border-[#ececea] bg-[#fafaf8] px-4 py-[14px]">
                <span className="truncate text-[14px] text-[#3c4043]">
                  {host} › blog › {slug || "…"}
                </span>
                <span className="text-[18px] leading-[1.3] text-[#1a0dab]">
                  {metaTitle ? `${metaTitle} | North Nectar` : "Post title | North Nectar"}
                </span>
                <span className="text-[14px] leading-[1.55] text-[#4d5156]">
                  {metaDesc || "Add a summary to see how this post appears in search results."}
                </span>
              </div>
              <div className="flex flex-col gap-[14px]">
                <div className="flex flex-col gap-[6px]">
                  <label htmlFor="po-slug" className="text-[14px] font-semibold">
                    URL slug
                  </label>
                  <span
                    className={cn(
                      "flex items-center overflow-hidden rounded-[10px] border",
                      errors.slug ? RED : "border-[#d4d4d1]",
                    )}
                  >
                    <span className="text-admin-muted inline-flex h-10 shrink-0 items-center border-r border-[#e3e3e0] bg-[#f5f5f3] px-[10px] text-[14px]">
                      {host}/blog/
                    </span>
                    <input
                      id="po-slug"
                      value={form.slug}
                      placeholder={slugify(form.title)}
                      onChange={(e) => {
                        slugTouched.current = true;
                        set({ slug: e.target.value.toLowerCase().replace(/\s+/g, "-") });
                      }}
                      className="text-admin-text h-10 min-w-0 flex-1 border-0 bg-white px-3 text-[14px] outline-none"
                    />
                  </span>
                  <FieldError message={errors.slug} />
                  {!form.isNew && initial.published && form.slug !== initial.slug ? (
                    <span className="text-[14px] text-[#8a5a00]">
                      Changing the slug of a published post breaks links to the old address.
                    </span>
                  ) : null}
                </div>
                <div className="flex flex-col gap-[6px]">
                  <label htmlFor="po-mt" className="text-[14px] font-semibold">
                    Meta title <span className="text-admin-muted font-normal">(optional)</span>
                  </label>
                  <input
                    id="po-mt"
                    value={form.metaTitle}
                    placeholder={form.title}
                    onChange={(e) => set({ metaTitle: e.target.value })}
                    className={fieldStyles.input}
                  />
                </div>
                <div className="flex flex-col gap-[6px]">
                  <label htmlFor="po-md" className="text-[14px] font-semibold">
                    Meta description{" "}
                    <span className="text-admin-muted font-normal">
                      (optional, uses the summary)
                    </span>
                  </label>
                  <textarea
                    id="po-md"
                    value={form.metaDescription}
                    placeholder={form.excerpt}
                    onChange={(e) => set({ metaDescription: e.target.value })}
                    className={cn(fieldStyles.textarea, "min-h-[72px]")}
                  />
                </div>
              </div>
            </Card>

            {form.isNew ? null : (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setConfirm(true)}
                  className="inline-flex cursor-pointer items-center gap-[6px] border-0 bg-transparent p-0 text-[14px] font-semibold text-[#b42318] hover:underline"
                >
                  <Icon name="trash" size={16} />
                  Delete this post
                </button>
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-[1_1_280px] flex-col gap-4">
            <Card>
              <CardHeader title="Publishing" />
              <div className="flex flex-col gap-[14px]">
                <span className="flex items-center justify-between gap-3">
                  <span className="flex flex-col">
                    <span className="text-[14px] font-semibold">Published</span>
                    <span className="text-admin-muted text-[14px]">
                      {form.published ? "Visible on the website" : "Only visible here"}
                    </span>
                  </span>
                  <Switch
                    checked={form.published}
                    label="Published"
                    onChange={(published) => set({ published })}
                  />
                </span>
                <div className="flex flex-col gap-[6px]">
                  <label htmlFor="po-date" className="text-[14px] font-semibold">
                    Publish date
                  </label>
                  <input
                    id="po-date"
                    type="date"
                    value={form.publishDate}
                    onChange={(e) => set({ publishDate: e.target.value })}
                    className={cn(fieldStyles.input, errors.publishDate && RED)}
                  />
                  <span className="text-admin-muted text-[14px]">
                    {form.publishDate
                      ? scheduled
                        ? "A future date schedules the post."
                        : "Shown on the article."
                      : "Leave empty to use the day you publish."}
                  </span>
                </div>
                <div className="flex flex-col gap-[6px]">
                  <label htmlFor="po-author" className="text-[14px] font-semibold">
                    Author
                  </label>
                  <input
                    id="po-author"
                    value={form.author}
                    onChange={(e) => set({ author: e.target.value })}
                    className={cn(fieldStyles.input, errors.author && RED)}
                  />
                  <FieldError message={errors.author} />
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader title="Cover image" />
              {form.coverImage ? (
                <Image
                  src={imageSrc(form.coverImage.src)!}
                  alt=""
                  width={form.coverImage.width}
                  height={form.coverImage.height}
                  className="border-admin-line mb-3 h-auto w-full rounded-[10px] border object-cover"
                />
              ) : (
                <span className="border-admin-line bg-admin-bg mb-3 grid aspect-[16/10] w-full place-items-center rounded-[10px] border text-[#a3a3a3]">
                  <Icon name="image" size={24} />
                </span>
              )}
              <span className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => file.current?.click()}
                  className={buttonStyles.secondary}
                >
                  <Icon name="upload" size={16} />
                  {uploading ? "Uploading…" : form.coverImage ? "Change image" : "Add image"}
                </button>
                {form.coverImage ? (
                  <button
                    type="button"
                    onClick={() => set({ coverImage: null })}
                    className="text-admin-muted cursor-pointer border-0 bg-transparent p-0 text-[14px] hover:text-[#b42318]"
                  >
                    Remove
                  </button>
                ) : null}
              </span>
              <span className="text-admin-muted mt-2 block text-[14px]">
                Landscape, at least 1200 px wide. Also used when the post is shared.
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
                    const img = await uploadImage(f, `posts/${form.id}`, form.title || "Blog post");
                    set({ coverImage: img });
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Upload failed");
                  } finally {
                    setUploading(false);
                  }
                }}
              />
            </Card>

            <Card>
              <CardHeader title="Products in this article" />
              <p className="text-admin-muted m-0 mb-3 text-[14px] leading-[1.5]">
                Shown under the article (up to {MAX_RELATED}). Only live products appear on the
                website.
              </p>
              <ul className="m-0 flex max-h-[320px] list-none flex-col gap-1 overflow-y-auto p-0">
                {products.map((p) => {
                  const on = form.relatedProducts.includes(p.slug);
                  const full = !on && form.relatedProducts.length >= MAX_RELATED;
                  return (
                    <li key={p.slug}>
                      <label
                        className={cn(
                          "flex min-h-9 cursor-pointer items-center gap-[10px] rounded-[8px] px-2 text-[14px] hover:bg-[#fafaf9]",
                          full && "cursor-not-allowed opacity-50",
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={on}
                          disabled={full}
                          onChange={() =>
                            set({
                              relatedProducts: on
                                ? form.relatedProducts.filter((s) => s !== p.slug)
                                : [...form.relatedProducts, p.slug],
                            })
                          }
                          className="size-4 accent-[#234c2e]"
                        />
                        <span className="min-w-0 flex-1 truncate">{p.name}</span>
                        {p.live ? null : <span className="text-admin-muted">draft</span>}
                      </label>
                    </li>
                  );
                })}
              </ul>
            </Card>
          </div>
        </form>
      </PageBody>
      <Dialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Delete post?"
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
                  const result = await deletePost(form.id);
                  setConfirm(false);
                  if (!result.ok) return toast.error(result.error);
                  toast.show(result.message);
                  router.replace("/blog");
                  router.refresh();
                })
              }
            >
              Delete post
            </DangerButton>
          </>
        }
      >
        <span className="text-admin-muted leading-[1.6]">
          This removes <strong className="text-admin-text">{form.title || "this post"}</strong> and
          its cover image from your website. This can&apos;t be undone.
        </span>
      </Dialog>
    </>
  );
}
