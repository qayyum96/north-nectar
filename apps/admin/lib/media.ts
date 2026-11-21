import "server-only";
import { AwsClient } from "aws4fetch";
import { createClient } from "@/lib/supabase/server";

/**
 * Product and category images. They go to Cloudflare R2 (10 GB free, no download fees) when the
 * R2 keys are set, and are served from NEXT_PUBLIC_MEDIA_URL (e.g. https://images.northnectar.com).
 * Without the keys (or for files uploaded before the move) they use the Supabase "catalog" bucket.
 */

export type MediaRef = { store: "r2" | "supabase"; path: string };

const SUPABASE_MARKER = "/storage/v1/object/public/catalog/";
/** File names are random, so a file never changes: browsers and Cloudflare can keep it a year. */
const CACHE = "public, max-age=31536000, immutable";

function r2() {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET } = process.env;
  const publicBase = process.env.NEXT_PUBLIC_MEDIA_URL?.replace(/\/+$/, "");
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET || !publicBase)
    return null;
  const signer = new AwsClient({
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
    service: "s3",
    region: "auto",
  });
  return {
    aws: {
      /**
       * Signs the request, then sends it with the body passed straight to fetch. (Sending the
       * signed Request object makes Next.js stream the body without a size, which R2 refuses.)
       */
      async fetch(
        url: string,
        init: { method?: string; body?: ArrayBuffer; headers?: Record<string, string> } = {},
      ) {
        const signed = await signer.sign(url, init);
        return fetch(signed.url, {
          method: signed.method,
          headers: signed.headers,
          body: init.body,
          cache: "no-store",
        });
      },
    },
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET}`,
    bucket: R2_BUCKET,
    publicBase,
  };
}

export const mediaOnR2 = () => r2() !== null;

const encodePath = (path: string) => path.split("/").map(encodeURIComponent).join("/");

/** Which store a saved image URL points at, and its path there (null for site images). */
export function mediaRef(src: string | null | undefined): MediaRef | null {
  if (!src) return null;
  const i = src.indexOf(SUPABASE_MARKER);
  if (i >= 0)
    return {
      store: "supabase",
      path: decodeURIComponent(src.slice(i + SUPABASE_MARKER.length).split("?")[0]!),
    };
  const base = process.env.NEXT_PUBLIC_MEDIA_URL?.replace(/\/+$/, "");
  if (base && src.startsWith(`${base}/`))
    return { store: "r2", path: decodeURIComponent(src.slice(base.length + 1).split("?")[0]!) };
  return null;
}

/** Saves a file and returns its public URL. */
export async function putMedia(path: string, body: Blob, contentType: string): Promise<string> {
  const c = r2();
  if (c) {
    // R2 needs the size up front; a Blob from a form is otherwise streamed without one (411).
    const res = await c.aws.fetch(`${c.endpoint}/${encodePath(path)}`, {
      method: "PUT",
      body: await body.arrayBuffer(),
      headers: { "Content-Type": contentType, "Cache-Control": CACHE },
    });
    if (!res.ok) {
      const code = /<Code>([^<]+)<\/Code>/.exec(await res.text())?.[1] ?? "";
      throw new Error(`R2 upload failed (${res.status}${code ? ` ${code}` : ""})`);
    }
    return `${c.publicBase}/${encodePath(path)}`;
  }
  const supabase = await createClient();
  const { error } = await supabase.storage
    .from("catalog")
    .upload(path, body, { contentType, cacheControl: "31536000", upsert: false });
  if (error) throw new Error(error.message);
  return supabase.storage.from("catalog").getPublicUrl(path).data.publicUrl;
}

/** Copies a stored image to a new path (same store when possible) and returns the new URL. */
export async function copyMedia(from: MediaRef, to: string): Promise<string | null> {
  const c = r2();
  if (from.store === "r2" && c) {
    const res = await c.aws.fetch(`${c.endpoint}/${encodePath(to)}`, {
      method: "PUT",
      headers: { "x-amz-copy-source": `/${c.bucket}/${encodePath(from.path)}` },
    });
    return res.ok ? `${c.publicBase}/${encodePath(to)}` : null;
  }
  const supabase = await createClient();
  const { error } = await supabase.storage.from("catalog").copy(from.path, to);
  return error ? null : supabase.storage.from("catalog").getPublicUrl(to).data.publicUrl;
}

/** Deletes stored images. Failures are ignored: a leftover file only costs a little space. */
export async function removeMedia(refs: MediaRef[]): Promise<void> {
  const c = r2();
  const onR2 = refs.filter((r) => r.store === "r2").map((r) => r.path);
  const onSupabase = refs.filter((r) => r.store === "supabase").map((r) => r.path);
  if (c)
    await Promise.all(
      onR2.map((p) =>
        c.aws.fetch(`${c.endpoint}/${encodePath(p)}`, { method: "DELETE" }).catch(() => null),
      ),
    );
  if (onSupabase.length) {
    const supabase = await createClient();
    await supabase.storage.from("catalog").remove(onSupabase);
  }
}

/** Deletes every image under a folder, e.g. "products/<id>", in both stores. */
export async function removeMediaFolder(folder: string): Promise<void> {
  const c = r2();
  if (c) {
    const res = await c.aws.fetch(
      `${c.endpoint}?list-type=2&prefix=${encodeURIComponent(`${folder}/`)}`,
    );
    if (res.ok) {
      const xml = await res.text();
      const keys = [...xml.matchAll(/<Key>([^<]+)<\/Key>/g)].map((m) =>
        m[1]!.replace(/&amp;/g, "&"),
      );
      await removeMedia(keys.map((path) => ({ store: "r2", path })));
    }
  }
  const supabase = await createClient();
  const { data: files } = await supabase.storage.from("catalog").list(folder, { limit: 100 });
  if (files?.length)
    await supabase.storage.from("catalog").remove(files.map((f) => `${folder}/${f.name}`));
}
