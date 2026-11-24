import { getPostBySlug } from "@/lib/blog";
import { catalog } from "@/lib/catalog";
import { categoryPath, postPath, productPath } from "@/lib/routes";
import { absoluteUrl } from "@/lib/seo/config";
import { legacyTarget } from "@/lib/seo/legacy-redirects";

/**
 * Permanent redirects for addresses from the previous WordPress site (rewritten here by
 * next.config, see lib/seo/legacy-redirects.ts). Picks the live product, else its live category,
 * else the shop, so old links keep working as products are published or retired.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const [kind = "", ...rest] = (await params).path;
  const target = legacyTarget(kind, decodeURIComponent(rest.join("/")));

  let to = target.path ?? "/shop";
  if (!target.path) {
    if (target.post && (await getPostBySlug(target.post))) {
      to = postPath(target.post);
    } else if (target.product && (await catalog.getProductBySlug(target.product))) {
      to = productPath(target.product);
    } else if (target.category && (await catalog.getCategoryBySlug(target.category))) {
      to = categoryPath(target.category);
    }
  }

  return new Response(null, {
    status: 301,
    headers: {
      Location: absoluteUrl(to),
      // Cached for an hour, so a product published later is picked up soon after.
      "Cache-Control": "public, max-age=3600",
    },
  });
}
