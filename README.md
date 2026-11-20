# North Nectar

Website and e-commerce storefront for **North Nectar** ([northnectar.com](https://northnectar.com)),
natural Himalayan products from Hunza, Gilgit-Baltistan, Pakistan.

The approved design mockup lives in [`/design`](design/README.md). Open `design/index.html` in a
browser.

## Requirements

| Tool    | Version                                                            |
| ------- | ------------------------------------------------------------------ |
| Node.js | 20.9 or newer (22 or 24 LTS recommended, see `.nvmrc`)             |
| pnpm    | 10.x (`npm i -g pnpm@10`; the version is pinned in `package.json`) |

With nvm-windows: `nvm use 24.18.0`. With nvm: `nvm use`.

## Setup

```bash
pnpm install
cp apps/web/.env.example apps/web/.env.local
pnpm dev            # http://localhost:3000
```

## Scripts (run from the repo root)

| Script                         | What it does                                            |
| ------------------------------ | ------------------------------------------------------- |
| `pnpm dev`                     | Start the website in development mode                   |
| `pnpm build`                   | Production build of every app (Turborepo, cached)       |
| `pnpm start`                   | Serve the production build of the website               |
| `pnpm lint`                    | ESLint (Next.js, TypeScript, jsx-a11y) in every package |
| `pnpm typecheck`               | TypeScript strict type check in every package           |
| `pnpm format` / `format:check` | Prettier (with Tailwind class sorting)                  |
| `pnpm check`                   | format check + lint + typecheck (use in CI)             |

A Husky pre-commit hook runs ESLint and Prettier on staged files (lint-staged).

## Environment variables

See [`apps/web/.env.example`](apps/web/.env.example).

| Variable                 | Purpose                                                                                       |
| ------------------------ | --------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`   | Base URL for canonical links, sitemap, Open Graph and JSON-LD (no trailing slash)             |
| `NEXT_PUBLIC_SITE_ENV`   | `production` allows indexing. Anything else sets robots `noindex` and `Disallow: /`           |
| `CATALOG_SOURCE`         | Data source: `seed` (default). `supabase` once implemented                                    |
| `CATALOG_INCLUDE_DRAFTS` | `true` shows draft products for local layout testing. Ignored when the site env is production |

Placeholder content (such as the mockup's sample customer reviews) only appears when
`NEXT_PUBLIC_SITE_ENV` is not `production`.

## Repository structure

```
design/                 Approved HTML mockup (reference only, not deployed)
apps/
  web/                  northnectar.com (Next.js App Router)
    app/                Routes. Route groups: (home) light newsletter band, (store) all other pages
    components/         layout/ (header, footer, nav, breadcrumbs), sections/home/, decor/, seo/
    features/           cart/ (store, drawer, add-to-cart), products/ (card, grid, size picker), newsletter/
    lib/                catalog.ts (data access), routes.ts (client-safe URLs), navigation.ts (menus from data),
                        seo/ (config, metadata, JSON-LD), constants/ (commerce rules), images.ts, env.ts
    content/            Static copy and merchandising (site.ts, home.ts)
    public/images/      Placeholder images (see apps/web/IMAGES.md)
  admin/                Placeholder for the admin portal (README only)
packages/
  config/               Shared tsconfig, ESLint, Prettier and the Tailwind v4 theme (design tokens)
  types/                Domain types: Product, ProductVariant, Category, Order, ContactMessage, ...
  data/                 CatalogRepository interface, seed implementation, product helpers, Supabase guide
  ui/                   Shared, accessible UI primitives (Button, Input, Badge, Tabs, Drawer, icons, ...)
```

Internal packages ship TypeScript source and are compiled by Next.js (`transpilePackages`), so no
separate build step is needed.

## Design tokens

All colours, type sizes, radii and motion come from the mockup and live in
[`packages/config/tailwind/theme.css`](packages/config/tailwind/theme.css). Primary is forest green
`#234c2e` (`bg-primary` / `bg-forest-600`). Headings use Oswald (`font-display`), body text Figtree,
both self-hosted through `next/font`. The 12px `text-xs` step is removed on purpose: the minimum
font size is 14px.

## Catalogue: products and categories

- Seed data: [`packages/data/src/seed`](packages/data/src/seed) (11 products, 8 categories).
- Every product has `status: "active" | "draft"`. Only **active** products appear on the site, in
  the sitemap and in structured data. Categories without active products are hidden automatically.
- Live today: _Hunza Herbal Tea, Wild Thyme (Tumuro)_ and _Premium Dried Sea Buckthorn Berries_.
  The other nine products are drafts. To publish one, set its `status` to `"active"`.
- Preview the full catalogue locally: `CATALOG_INCLUDE_DRAFTS=true pnpm dev`.
- Prices are whole PKR integers. Each size is a variant with its own SKU, price and stock.
- Home page sections adapt to the catalogue size (see the rules in `app/(home)/page.tsx`): empty
  sections and single-item tabs are never shown.

## Payments (config-driven)

Payment methods are defined in [`apps/web/lib/constants/commerce.ts`](apps/web/lib/constants/commerce.ts).
Each has a `status`: `enabled` (selectable and shown as a payment badge), `coming_soon` (listed at
checkout but disabled, no badge) or `hidden`. Enabled today: cash on delivery, bank transfer and
JazzCash/Easypaisa. Card (Stripe or a local gateway) is configured but `hidden`. Footer, cart and
drawer badges are generated from enabled methods only, so a new gateway's badges appear the moment
it is enabled.

## Social links

Set the profile URLs in `siteConfig.social` ([`apps/web/lib/seo/config.ts`](apps/web/lib/seo/config.ts)).
Empty entries are not rendered. A URL that is set appears as a footer icon and in
`Organization.sameAs`.

## SEO

- Every route builds metadata with `buildMetadata()` (`lib/seo/metadata.ts`): title template,
  description, canonical, hreflang (`en-PK` + `x-default`), Open Graph and Twitter cards.
- `app/sitemap.ts` is generated from the data layer (active categories and products, with
  `lastModified` and product images). `app/robots.ts` blocks non-production deployments.
- JSON-LD builders in `lib/seo/json-ld.ts`: Organization + WebSite (sitewide), BreadcrumbList,
  Product / ProductGroup with offers, FAQPage, LocalBusiness. No review markup until real reviews exist.
- Add a language later by extending `siteConfig.languages`.

## Swapping the data layer to Supabase

UI code only talks to the `CatalogRepository` interface
([`packages/data/src/repository.ts`](packages/data/src/repository.ts)) through
`apps/web/lib/catalog.ts`. To move to Supabase: create the tables, implement
`SupabaseCatalogRepository`, register it in `createCatalogRepository()` and set
`CATALOG_SOURCE=supabase`. Step-by-step guide with schema, RLS policies and caching:
[`packages/data/docs/supabase.md`](packages/data/docs/supabase.md).

## Project status

| Phase | Scope                                                                                                     | Status |
| ----- | --------------------------------------------------------------------------------------------------------- | ------ |
| 1     | Monorepo, tooling, tokens, UI primitives, layout, SEO foundation                                          | done   |
| 2     | Data layer + Home page                                                                                    | done   |
| 3     | Shop, category and product pages                                                                          | done   |
| 4     | About and Contact                                                                                         | next   |
| 5     | Cart, checkout, confirmation + Privacy, Terms, Refund & Return and Shipping policy pages (draft, noindex) |        |
| 6     | SEO and performance audit                                                                                 |        |
