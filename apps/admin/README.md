# North Nectar admin portal (placeholder)

Not built yet. This folder reserves the place for the internal admin app so the monorepo layout is
final from day one.

## Planned scope

- Products: create, edit, publish (`status: active | draft`), variants with SKU, price (PKR) and stock
- Categories: create, order and publish
- Orders: list, status updates (pending → confirmed → packed → shipped → delivered), customer details
- Contact messages and newsletter subscribers
- Image uploads to Supabase Storage

## How it will plug in

- Next.js App Router app at `apps/admin`, deployed separately (e.g. `admin.northnectar.com`), behind
  Supabase Auth with role-based access.
- Reuses `@northnectar/ui` (components and Tailwind tokens), `@northnectar/types` (domain models) and
  `@northnectar/config` (TypeScript, ESLint, Prettier, Tailwind preset).
- Writes go through a write-side repository added to `@northnectar/data`. The website keeps reading
  through `CatalogRepository`, so publishing a product in the admin makes it appear on the site with
  no website code changes.

## To start it

```bash
pnpm create next-app apps/admin --ts --app --tailwind --eslint --use-pnpm --skip-install
# then set "name": "@northnectar/admin" and extend the shared configs like apps/web does
```
