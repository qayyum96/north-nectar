"use client";

import type { ImageAsset } from "./catalogue-shared";
import { uploadCatalogImage } from "./media-actions";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/avif"];
/** Same limit as the server (lib/media-actions.ts). */
export const MAX_IMAGE_BYTES = 1024 * 1024;
/** Tried in order until the WebP is under 1 MB: [longest side in px, quality]. */
const STEPS: [number, number][] = [
  [1600, 0.85],
  [1600, 0.75],
  [1600, 0.65],
  [1280, 0.7],
  [1024, 0.7],
];

/**
 * Shrinks a photo to at most 1600 px on its longest side and converts it to WebP in the browser,
 * then uploads it (Cloudflare R2, see lib/media.ts). A 10 MB phone photo usually ends up
 * 150-400 KB; a very detailed one gets a lower quality or a smaller size until it is under 1 MB.
 */
export async function uploadImage(file: File, folder: string, alt: string): Promise<ImageAsset> {
  if (!ACCEPTED.includes(file.type)) throw new Error(`${file.name}: use a JPG, PNG or WebP image.`);
  if (file.size > 25 * 1024 * 1024) throw new Error(`${file.name} is larger than 25 MB.`);

  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("This browser can't prepare images. Try Chrome or Edge.");

  let result: { blob: Blob; width: number; height: number } | null = null;
  for (const [side, quality] of STEPS) {
    const scale = Math.min(1, side / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(bitmap, 0, 0, width, height);
    }
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", quality),
    );
    if (!blob) break;
    result = { blob, width, height };
    if (blob.size <= MAX_IMAGE_BYTES) break;
  }
  bitmap.close();
  if (!result) throw new Error(`${file.name} couldn't be converted.`);
  if (result.blob.size > MAX_IMAGE_BYTES)
    throw new Error(`${file.name} is still over 1 MB after compressing. Try a simpler photo.`);

  const form = new FormData();
  form.set("file", new File([result.blob], "image.webp", { type: "image/webp" }));
  form.set("folder", folder);
  const uploaded = await uploadCatalogImage(form);
  if (!uploaded.ok) throw new Error(`${file.name}: ${uploaded.error}`);
  return { src: uploaded.url, alt, width: result.width, height: result.height };
}
