# North Nectar

Website, e-commerce storefront and admin portal for **North Nectar** ([northnectar.com](https://northnectar.com)),
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
cp apps/web/.env.example apps/web/.env.local     # fill in the Supabase values
cp apps/admin/.env.example apps/admin/.env.local
pnpm dev            # website http://localhost:3000
pnpm --filter @northnectar/admin dev   # admin http://localhost:3001
```

The admin's own guide (first owner account, roles, sign-in settings) is in
[`apps/admin/README.md`](apps/admin/README.md).

## Scripts (run from the repo root)

| Script                                   | What it does                                                       |
| ---------------------------------------- | ------------------------------------------------------------------ |
| `pnpm dev`                               | Start the website in development mode                              |
| `pnpm build`                             | Production build of every app (Turborepo, cached)                  |
| `pnpm start`                             | Serve the production build of the website                          |
| `pnpm lint`                              | ESLint (Next.js, TypeScript, jsx-a11y) in every package            |
| `pnpm typecheck`                         | TypeScript strict type check in every package                      |
| `pnpm format` / `format:check`           | Prettier (with Tailwind class sorting)                             |
| `pnpm check`                             | format check + lint + typecheck (use in CI)                        |
| `pnpm db:migrate`                        | Apply new files in `supabase/migrations` (needs `SUPABASE_DB_URL`) |
| `pnpm db:status`                         | List applied and pending migrations                                |
| `pnpm db:seed`                           | Copy the seed catalogue into Supabase (keeps existing stock)       |
| `pnpm admin:make-owner <email> "<name>"` | Make an existing Supabase Auth user the store owner                |

A Husky pre-commit hook runs ESLint and Prettier on staged files (lint-staged).

## Environment variables

See [`apps/web/.env.example`](apps/web/.env.example) and [`apps/admin/.env.example`](apps/admin/.env.example).

| Variable                                                     | Purpose                                                                                                |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| `NEXT_PUBLIC_SITE_URL`                                       | Base URL for canonical links, sitemap, Open Graph and JSON-LD (no trailing slash)                      |
| `NEXT_PUBLIC_SITE_ENV`                                       | `production` allows indexing. Anything else sets robots `noindex` and `Disallow: /`                    |
| `CATALOG_SOURCE`                                             | Catalogue source: `supabase` (the database) or `seed` (files in `packages/data`)                       |
| `CATALOG_INCLUDE_DRAFTS`                                     | `true` shows draft products for local layout testing. Ignored when the site env is production          |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project URL and publishable key                                                               |
| `SUPABASE_SERVICE_ROLE_KEY`                                  | Supabase secret key, server only (orders, messages, newsletter)                                        |
| `SUPABASE_DB_URL`                                            | Session pooler connection string, only for the `db:*` scripts                                          |
| `NEXT_PUBLIC_STOREFRONT_URL`                                 | Admin only: website address for store links and product images                                         |
| `REVALIDATE_SECRET`                                          | Same random value in both apps; lets the admin refresh the website after catalogue or settings changes |

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
  admin/                Admin portal (orders, catalogue, stock, reports, settings; see its README)
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

## Payments and shipping (set in the admin)

Payment methods and delivery rates live in the database (`store_settings` and `shipping_zones`)
and are edited in the admin under **Settings → Payments** and **Settings → Shipping**. The website
reads them through [`apps/web/lib/commerce/settings.ts`](apps/web/lib/commerce/settings.ts) (with
built-in defaults if the database can't be reached); the shared rules (zone matching, delivery
options, enabled methods) are in
[`packages/data/src/commerce-settings.ts`](packages/data/src/commerce-settings.ts). Delivery is
priced by city, then province, then an "everywhere else" zone; before a city is entered the cart
shows the lowest rate. Footer, cart and drawer badges come from the enabled methods only. Cards
are off until a gateway is connected.

**Before launch:** fill in the bank name and IBAN in **Settings → Payments** (or switch bank
transfer off). The placeholders are shown at checkout until then.

### Orders (current flow)

Checkout is a guest flow. The order Server Action
([`features/checkout/actions.ts`](apps/web/features/checkout/actions.ts)) validates the details with
Zod, re-prices every line from the data layer, checks stock, applies delivery, payment fee and
discount rules (`computeTotals`, shared with the cart) and refuses the order if the total changed.
No payment gateway is connected: cash on delivery, bank transfer and JazzCash/Easypaisa are settled
outside the site (wallet payments are arranged on WhatsApp after the order).

Orders are saved by the `create_order` database function (callable only with the secret key). It
locks the sizes, re-checks price and stock, reserves the units, saves the customer by phone and
numbers the order `NN1001`, `NN1002`... The confirmation page reads the order back using a private
token kept in a 7-day HttpOnly cookie. Orders are then processed in the admin (confirm, ship, deliver, cancel, return; see
[`apps/admin/README.md`](apps/admin/README.md)), which moves stock in the same transaction. Email receipts are not sent yet (`TODO(email)`). Discount codes are supported end to end but none exist yet (`discountCodes`).

### Policy pages

Privacy, Terms, Refund and Return, and Shipping live in
[`apps/web/content/policies/`](apps/web/content/policies/), one file each, with placeholder text
marked `status: "draft"`. Drafts show a notice, are `noindex` and stay out of the sitemap. Replace
the text and set `status: "final"` to publish one.

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

## Database (Supabase)

The catalogue, orders, customers, messages and newsletter live in Supabase (free plan, Postgres 17).

- Schema and row level security: [`supabase/migrations`](supabase/migrations), applied with
  `pnpm db:migrate`. Visitors can only read active products; everything else needs a staff
  sign-in or the server's secret key.
- The website reads through `CatalogRepository`
  ([`packages/data/src/repository.ts`](packages/data/src/repository.ts));
  `SupabaseCatalogRepository` caches a catalogue snapshot for 60 seconds.
- **Keep-alive:** the free plan pauses after 7 days without traffic.
  [`.github/workflows/supabase-keep-alive.yml`](.github/workflows/supabase-keep-alive.yml) makes one
  small read twice a week. Repository secrets: `SUPABASE_URL`, `SUPABASE_ANON_KEY`.
- **Backups:** [`.github/workflows/supabase-backup.yml`](.github/workflows/supabase-backup.yml) dumps
  the database every night, encrypts it and keeps it for 30 days as a workflow artifact. Repository
  secrets: `SUPABASE_DB_URL`, `BACKUP_PASSPHRASE`. Restore steps are in the workflow file.

## Mobile navigation

Below 1024px the header is a compact row (logo, search icon, cart) and an app-style bottom tab bar
provides Home, Shop, Wishlist and Menu ([`components/layout/mobile-tab-bar.tsx`](apps/web/components/layout/mobile-tab-bar.tsx)).
The wishlist is stored in the browser and listed at `/wishlist`. Desktop keeps the mockup header.

## Project status

| Phase | Scope                                                                                                     | Status |
| ----- | --------------------------------------------------------------------------------------------------------- | ------ |
| 1     | Monorepo, tooling, tokens, UI primitives, layout, SEO foundation                                          | done   |
| 2     | Data layer + Home page                                                                                    | done   |
| 3     | Shop, category and product pages                                                                          | done   |
| 4     | About and Contact                                                                                         | done   |
| 5     | Cart, checkout, confirmation + Privacy, Terms, Refund & Return and Shipping policy pages (draft, noindex) | done   |
| 6     | SEO and performance audit                                                                                 | done   |

Admin portal phases are tracked in [`apps/admin/README.md`](apps/admin/README.md).

The Phase 6 audit (method, scores, fixes and launch checklist) is in [docs/audit-phase-6.md](docs/audit-phase-6.md).
