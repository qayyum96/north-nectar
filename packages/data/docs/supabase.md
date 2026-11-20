# Swapping the data layer to Supabase

The website never talks to a database directly. Every page, the sitemap, the header and footer
menus and all structured data go through one object:

```ts
// apps/web/lib/catalog.ts
export const catalog: CatalogRepository = createCatalogRepository();
```

`CatalogRepository` ([`src/repository.ts`](../src/repository.ts)) is the contract. Today it is
implemented by `SeedCatalogRepository` (TypeScript seed files). Moving to Supabase means adding a
second implementation and flipping one environment variable. **No UI code changes.**

## Rules every implementation must follow

1. Return **active** records only. Drafts never reach the site, sitemap or JSON-LD.
2. `getCategories()` returns only active categories that contain at least one active product.
3. Return plain objects shaped exactly like `@northnectar/types` (`Product`, `Category`), prices as
   whole PKR integers.
4. Use `product-utils.ts` (`sortProducts`, `getMinPrice`, ...) or the SQL equivalent so sorting and
   price rules match the seed implementation.

## 1. Schema (suggested)

```sql
create type publish_status as enum ('active', 'draft');
create type purchase_mode as enum ('retail', 'quote');

create table categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name        text not null,
  short_name  text,
  description text not null default '',
  image       jsonb not null,            -- ImageAsset {src, alt, width, height, background?}
  sort_order  int  not null default 0,
  status      publish_status not null default 'draft',
  seo         jsonb
);

create table products (
  id                  uuid primary key default gen_random_uuid(),
  slug                text unique not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  status              publish_status not null default 'draft',
  name                text not null,
  tagline             text not null,
  description         text[] not null default '{}',
  botanical_name      text,
  origin              text not null,
  category_id         uuid not null references categories(id),
  images              jsonb not null default '[]',   -- ImageAsset[]
  purchase_mode       purchase_mode not null default 'retail',
  badge               jsonb,                         -- {label, tone}
  highlights          text[] not null default '{}',
  ways_to_enjoy       text[] not null default '{}',
  how_to_use          jsonb not null default '[]',   -- {title, description}[]
  attributes          jsonb not null default '[]',   -- {label, value}[]
  is_featured         boolean not null default false,
  is_best_seller      boolean not null default false,
  is_new_arrival      boolean not null default false,
  popularity_rank     int not null default 1000,
  related_product_ids uuid[] not null default '{}',
  seo                 jsonb,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table product_variants (
  id               uuid primary key default gen_random_uuid(),
  product_id       uuid not null references products(id) on delete cascade,
  sku              text unique not null,
  label            text not null,          -- "100g", "Bulk 25kg"
  weight_grams     int,
  price            int not null check (price >= 0),          -- whole PKR
  compare_at_price int check (compare_at_price is null or compare_at_price >= 0),
  stock            int not null default 0,
  tag              text,
  is_default       boolean not null default false,
  sort_order       int not null default 0
);

-- Public read access is limited to active rows; the admin portal uses an authenticated role.
alter table categories enable row level security;
alter table products enable row level security;
alter table product_variants enable row level security;
create policy "public reads active categories" on categories for select using (status = 'active');
create policy "public reads active products" on products for select using (status = 'active');
create policy "public reads variants of active products" on product_variants for select
  using (exists (select 1 from products p where p.id = product_id and p.status = 'active'));
```

Seed it from the existing seed files with a one-off script (map camelCase to snake_case).

## 2. Implementation

```ts
// packages/data/src/supabase/supabase-repository.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CatalogRepository } from "../repository";

export class SupabaseCatalogRepository implements CatalogRepository {
  constructor(private readonly db: SupabaseClient) {}

  async getProductBySlug(slug: string) {
    const { data, error } = await this.db
      .from("products")
      .select("*, variants:product_variants(*)")
      .eq("slug", slug)
      .eq("status", "active")
      .order("sort_order", { referencedTable: "product_variants" })
      .maybeSingle();
    if (error) throw error;
    return data ? mapProduct(data) : null; // snake_case row -> Product
  }
  // ...the remaining methods
}
```

Register it in `createCatalogRepository()` ([`src/index.ts`](../src/index.ts)):

```ts
case "supabase":
  return new SupabaseCatalogRepository(createSupabaseServerClient());
```

## 3. Switch over

```bash
# apps/web/.env.local (and the hosting provider)
CATALOG_SOURCE=supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## 4. Caching and freshness

Product, category and home pages are statically generated with ISR (`revalidate = 3600`).
For instant updates from the admin portal, wrap the Supabase reads in Next's data cache with tags
(`products`, `product:<slug>`, `categories`) and call `revalidateTag()` from an admin webhook or
Server Action after each save.

## 5. Images

Upload product images to a public Supabase Storage bucket, store the public URL in `images[].src`,
and add the Storage host to `images.remotePatterns` in `apps/web/next.config.ts`.
