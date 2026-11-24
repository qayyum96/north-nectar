"use server";

import { requireStaff } from "@/lib/auth";
import { putMedia } from "@/lib/media";

const FOLDER = /^(products|categories|posts)\/[A-Za-z0-9_-]{1,80}$/;
const MAX_BYTES = 1024 * 1024; // 1 MB, same as the browser step (lib/image-upload.ts)

/**
 * Saves an image prepared in the browser (already resized and converted to WebP) and returns its
 * public URL. Owners and managers only.
 */
export async function uploadCatalogImage(
  form: FormData,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const staff = await requireStaff();
  if (staff.role === "staff")
    return { ok: false, error: "Only owners and managers can upload images." };
  const file = form.get("file");
  const folder = String(form.get("folder") ?? "");
  if (!(file instanceof Blob) || !FOLDER.test(folder))
    return { ok: false, error: "That image couldn't be uploaded." };
  if (file.type !== "image/webp") return { ok: false, error: "Images are saved as WebP." };
  if (file.size > MAX_BYTES) return { ok: false, error: "That image is too large (over 1 MB)." };
  // A real WebP file starts with "RIFF" ....  "WEBP"; the label alone could be faked.
  const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const ascii = (from: number, to: number) => String.fromCharCode(...head.slice(from, to));
  if (ascii(0, 4) !== "RIFF" || ascii(8, 12) !== "WEBP")
    return { ok: false, error: "That file isn't a valid image." };
  try {
    const url = await putMedia(`${folder}/${crypto.randomUUID()}.webp`, file, "image/webp");
    return { ok: true, url };
  } catch (error) {
    console.error("[media] upload failed:", error instanceof Error ? error.message : error);
    return { ok: false, error: "The upload failed. Please try again." };
  }
}
