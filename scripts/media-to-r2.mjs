/**
 * One-time move of uploaded product and category images from the Supabase "catalog" bucket to
 * Cloudflare R2, then points the database at the new addresses.
 *
 *   pnpm media:to-r2            copy files and update the database (safe to run again)
 *   pnpm media:to-r2 --delete   also remove the copied files from Supabase afterwards
 *
 * Reads R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, NEXT_PUBLIC_MEDIA_URL,
 * NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and SUPABASE_DB_URL from
 * apps/admin/.env.local. Nothing secret is printed.
 */
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { connect } from "./db.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envText = fs.readFileSync(path.join(root, "apps/admin/.env.local"), "utf8");
const env = (key) =>
  process.env[key] ?? envText.match(new RegExp(`^${key}=(.*)$`, "m"))?.[1]?.trim();

const need = [
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET",
  "NEXT_PUBLIC_MEDIA_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
];
const missing = need.filter((k) => !env(k));
if (missing.length) {
  console.error(`Missing in apps/admin/.env.local: ${missing.join(", ")}`);
  process.exit(1);
}

// aws4fetch is a dependency of the admin app.
const require = createRequire(path.join(root, "apps/admin/package.json"));
const { AwsClient } = await import(pathToFileURL(require.resolve("aws4fetch")).href);
const aws = new AwsClient({
  accessKeyId: env("R2_ACCESS_KEY_ID"),
  secretAccessKey: env("R2_SECRET_ACCESS_KEY"),
  service: "s3",
  region: "auto",
});
const endpoint = `https://${env("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com/${env("R2_BUCKET")}`;
const supabaseUrl = env("NEXT_PUBLIC_SUPABASE_URL").replace(/\/+$/, "");
const oldPrefix = `${supabaseUrl}/storage/v1/object/public/catalog/`;
const newPrefix = `${env("NEXT_PUBLIC_MEDIA_URL").replace(/\/+$/, "")}/`;
const encodePath = (p) => p.split("/").map(encodeURIComponent).join("/");

const sql = connect();
try {
  const files =
    await sql`select name, metadata->>'mimetype' as type from storage.objects where bucket_id = 'catalog' order by name`;
  console.log(`${files.length} file(s) in the Supabase catalog bucket`);

  let copied = 0;
  for (const f of files) {
    const res = await fetch(oldPrefix + encodePath(f.name));
    if (!res.ok) throw new Error(`Couldn't download ${f.name} (${res.status})`);
    const put = await aws.fetch(`${endpoint}/${encodePath(f.name)}`, {
      method: "PUT",
      body: await res.arrayBuffer(),
      headers: {
        "Content-Type": f.type || res.headers.get("content-type") || "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
    if (!put.ok) throw new Error(`Couldn't upload ${f.name} to R2 (${put.status})`);
    const check = await fetch(newPrefix + encodePath(f.name), { method: "HEAD" });
    if (!check.ok)
      throw new Error(
        `${f.name} isn't reachable at NEXT_PUBLIC_MEDIA_URL (${check.status}). Is the custom domain connected to the bucket?`,
      );
    copied++;
  }
  console.log(`copied to R2 and checked: ${copied}`);

  // Point every saved image address at R2 (products, categories, their SEO images, past orders).
  const swap = (col) => sql`replace(${sql(col)}::text, ${oldPrefix}, ${newPrefix})`;
  const like = `%${oldPrefix}%`;
  const updates = await sql.begin(async (tx) => [
    await tx`update public.products set images = ${swap("images")}::jsonb, seo = ${swap("seo")}::jsonb where images::text like ${like} or seo::text like ${like}`,
    await tx`update public.categories set image = ${swap("image")}::jsonb, seo = ${swap("seo")}::jsonb where image::text like ${like} or seo::text like ${like}`,
    await tx`update public.order_lines set image = replace(image, ${oldPrefix}, ${newPrefix}) where image like ${like}`,
  ]);
  console.log(
    `updated: ${updates[0].count} product(s), ${updates[1].count} categor(ies), ${updates[2].count} order line(s)`,
  );

  if (process.argv.includes("--delete") && files.length) {
    const res = await fetch(`${supabaseUrl}/storage/v1/object/catalog`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${env("SUPABASE_SERVICE_ROLE_KEY")}`,
        apikey: env("SUPABASE_SERVICE_ROLE_KEY"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prefixes: files.map((f) => f.name) }),
    });
    console.log(
      res.ok
        ? `removed ${files.length} file(s) from Supabase`
        : `Supabase delete failed (${res.status})`,
    );
  }
} finally {
  await sql.end();
}
