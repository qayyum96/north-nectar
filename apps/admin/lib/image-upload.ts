"use client";

import type { ImageAsset } from "./catalogue-shared";
import { createBrowserSupabase } from "./supabase/browser";

const MAX_SIDE = 1600;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/avif"];

/**
 * Shrinks a photo to at most 1600 px on its longest side and converts it to WebP in the browser,
 * then uploads it to the public "catalog" bucket. A 6 MB phone photo usually ends up 150-300 KB,
 * which keeps the free storage and bandwidth limits comfortable.
 */
export async function uploadImage(file: File, folder: string, alt: string): Promise<ImageAsset> {
  if (!ACCEPTED.includes(file.type)) throw new Error(`${file.name}: use a JPG, PNG or WebP image.`);
  if (file.size > 25 * 1024 * 1024) throw new Error(`${file.name} is larger than 25 MB.`);

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("This browser can't prepare images. Try Chrome or Edge.");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", 0.85),
  );
  if (!blob) throw new Error(`${file.name} couldn't be converted.`);

  const path = `${folder}/${crypto.randomUUID()}.webp`;
  const supabase = createBrowserSupabase();
  const { error } = await supabase.storage
    .from("catalog")
    .upload(path, blob, { contentType: "image/webp", cacheControl: "31536000", upsert: false });
  if (error) {
    throw new Error(
      error.message.includes("row-level security")
        ? "Only owners and managers can upload images."
        : `Upload failed: ${error.message}`,
    );
  }
  const { data } = supabase.storage.from("catalog").getPublicUrl(path);
  return { src: data.publicUrl, alt, width, height };
}
