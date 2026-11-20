/**
 * Loads the catalogue from packages/data seed files into Supabase (categories, products, sizes).
 * Safe to re-run: rows are matched by id and updated. Stock is only set when a size is first
 * created, so re-running never overwrites stock counted in the admin.
 *
 *   pnpm db:seed
 */
import { seedCategories } from "../packages/data/src/seed/categories";
import { seedProducts } from "../packages/data/src/seed/products";
// @ts-expect-error: plain JS module without types
import { connect } from "./db.mjs";

const sql = connect();
const json = (value: unknown) => (value === undefined ? null : sql.json(value as never));

try {
  await sql.begin(async (tx: typeof sql) => {
    for (const c of seedCategories) {
      await tx`
        insert into public.categories (id, slug, name, short_name, description, image, sort_order, status, seo)
        values (${c.id}, ${c.slug}, ${c.name}, ${c.shortName ?? null}, ${c.description},
                ${json(c.image)}, ${c.sortOrder}, ${c.status}, ${json(c.seo)})
        on conflict (id) do update set
          slug = excluded.slug, name = excluded.name, short_name = excluded.short_name,
          description = excluded.description, image = excluded.image,
          sort_order = excluded.sort_order, status = excluded.status, seo = excluded.seo`;
    }

    for (const p of seedProducts) {
      await tx`
        insert into public.products (
          id, slug, status, name, short_name, tagline, description, botanical_name, origin,
          category_id, images, illustration, purchase_mode, badge, highlights, ways_to_enjoy,
          how_to_use, attributes, is_featured, is_best_seller, is_new_arrival, popularity_rank,
          related_product_ids, seo, created_at
        ) values (
          ${p.id}, ${p.slug}, ${p.status}, ${p.name}, ${p.shortName ?? null}, ${p.tagline},
          ${p.description}, ${p.botanicalName ?? null}, ${p.origin}, ${p.categoryId},
          ${json(p.images)}, ${json(p.illustration)}, ${p.purchaseMode}, ${json(p.badge ?? null)},
          ${p.highlights}, ${p.waysToEnjoy}, ${json(p.howToUse)}, ${json(p.attributes)},
          ${p.isFeatured}, ${p.isBestSeller}, ${p.isNewArrival}, ${p.popularityRank},
          ${p.relatedProductIds}, ${json(p.seo)}, ${p.createdAt}
        )
        on conflict (id) do update set
          slug = excluded.slug, status = excluded.status, name = excluded.name,
          short_name = excluded.short_name, tagline = excluded.tagline,
          description = excluded.description, botanical_name = excluded.botanical_name,
          origin = excluded.origin, category_id = excluded.category_id, images = excluded.images,
          illustration = excluded.illustration, purchase_mode = excluded.purchase_mode,
          badge = excluded.badge, highlights = excluded.highlights,
          ways_to_enjoy = excluded.ways_to_enjoy, how_to_use = excluded.how_to_use,
          attributes = excluded.attributes, is_featured = excluded.is_featured,
          is_best_seller = excluded.is_best_seller, is_new_arrival = excluded.is_new_arrival,
          popularity_rank = excluded.popularity_rank,
          related_product_ids = excluded.related_product_ids, seo = excluded.seo`;

      for (const [index, v] of p.variants.entries()) {
        await tx`
          insert into public.product_variants (
            id, product_id, sku, label, weight_grams, price, compare_at_price, stock, tag,
            is_default, sort_order
          ) values (
            ${v.id}, ${p.id}, ${v.sku}, ${v.label}, ${v.weightGrams}, ${v.price},
            ${v.compareAtPrice ?? null}, ${v.stock}, ${v.tag ?? null}, ${v.isDefault ?? false}, ${index}
          )
          on conflict (id) do update set
            sku = excluded.sku, label = excluded.label, weight_grams = excluded.weight_grams,
            price = excluded.price, compare_at_price = excluded.compare_at_price,
            tag = excluded.tag, is_default = excluded.is_default, sort_order = excluded.sort_order`;
      }
    }
  });

  const [counts] = await sql`
    select
      (select count(*) from public.categories)::int as categories,
      (select count(*) from public.products)::int as products,
      (select count(*) from public.products where status = 'active')::int as active_products,
      (select count(*) from public.product_variants)::int as sizes`;
  console.log("Seeded:", counts);
} finally {
  await sql.end();
}
