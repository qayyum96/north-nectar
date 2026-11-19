# North Nectar

Website and e-commerce storefront for **North Nectar** ([northnectar.com](https://northnectar.com)),
natural Himalayan products from Hunza, Gilgit-Baltistan, Pakistan.

The approved design mockup lives in [`/design`](design/README.md). Open `design/index.html` in a
browser.

## Requirements

| Tool    | Version                                                                                                                        |
| ------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Node.js | **22.12 or newer** (24 LTS recommended, see `.nvmrc`). Tailwind CSS 4 needs `require(esm)`, which older Node 22 releases lack. |
| pnpm    | 10.x (`npm i -g pnpm@10`; the version is pinned in `package.json`)                                                             |

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

| Variable               | Purpose                                                                             |
| ---------------------- | ----------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL` | Base URL for canonical links, sitemap, Open Graph and JSON-LD (no trailing slash)   |
| `NEXT_PUBLIC_SITE_ENV` | `production` allows indexing. Anything else sets robots `noindex` and `Disallow: /` |

## Repository structure

```
design/                 Approved HTML mockup (reference only, not deployed)
apps/
  web/                  northnectar.com (Next.js App Router)
    app/                Routes. Route groups: (home) light newsletter band, (store) all other pages
    components/         layout/ (header, footer, nav, breadcrumbs), seo/ (JsonLd), sections/ (Phase 2+)
    features/           cart/ (Zustand store, drawer), newsletter/, later products/, contact/, checkout/
    lib/                seo/ (config, metadata, JSON-LD), constants/ (commerce rules), images.ts, env.ts, navigation.ts
    content/            Static copy
    public/images/      Placeholder images (see apps/web/IMAGES.md)
  admin/                Placeholder for the admin portal (README only)
packages/
  config/               Shared tsconfig, ESLint, Prettier and the Tailwind v4 theme (design tokens)
  types/                Domain types: Product, ProductVariant, Category, Order, ContactMessage, ...
  data/                 Data access layer: CatalogRepository interface (+ seed implementation in Phase 2)
  ui/                   Shared, accessible UI primitives (Button, Input, Badge, Drawer, icons, ...)
```

Internal packages ship TypeScript source and are compiled by Next.js (`transpilePackages`), so no
separate build step is needed.

## Design tokens

All colours, type sizes, radii and motion come from the mockup and live in
[`packages/config/tailwind/theme.css`](packages/config/tailwind/theme.css). Primary is forest green
`#234c2e` (`bg-primary` / `bg-forest-600`). Headings use Oswald (`font-display`), body text Figtree,
both self-hosted through `next/font`. The 12px `text-xs` step is removed on purpose: the minimum
font size is 14px.

## Payments (config-driven)

Payment methods are defined in [`apps/web/lib/constants/commerce.ts`](apps/web/lib/constants/commerce.ts).
Each has a `status`: `enabled` (offered at checkout), `coming_soon` (visible, not selectable) or
`hidden`. Today: cash on delivery, bank transfer and JazzCash/Easypaisa are enabled. Card
(Stripe or a local gateway) is `coming_soon`. To add a gateway, add or enable an entry and
implement its handler (Phase 5).

## SEO

- Every route builds metadata with `buildMetadata()` (`lib/seo/metadata.ts`): title template,
  description, canonical, hreflang (`en-PK` + `x-default`), Open Graph and Twitter cards.
- `app/sitemap.ts` and `app/robots.ts` are generated. Products and categories are added from the
  data layer in Phase 2.
- JSON-LD builders in `lib/seo/json-ld.ts`: Organization + WebSite (sitewide), BreadcrumbList,
  Product / ProductGroup with offers, FAQPage, LocalBusiness.
- Add a language later by extending `siteConfig.languages`.

## Swapping the data layer to Supabase

UI code only talks to the `CatalogRepository` interface in
[`packages/data/src/repository.ts`](packages/data/src/repository.ts). The full step-by-step guide is
added with the seed implementation in Phase 2.

## Project status

| Phase | Scope                                                            | Status |
| ----- | ---------------------------------------------------------------- | ------ |
| 1     | Monorepo, tooling, tokens, UI primitives, layout, SEO foundation | done   |
| 2     | Data layer + Home page                                           | next   |
| 3     | Shop, category and product pages                                 |        |
| 4     | About and Contact                                                |        |
| 5     | Cart, checkout, confirmation                                     |        |
| 6     | SEO and performance audit                                        |        |
