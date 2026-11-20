# Phase 6: SEO and performance audit

Date: 20 November 2026. Build: production (`NEXT_PUBLIC_SITE_ENV=production`), served by
`next start` behind a local HTTP/2 proxy.

## How it was measured

- **Lighthouse 13.6**, mobile preset (Moto G Power emulation, simulated slow 4G, 4× CPU slowdown),
  three runs per page, **median** reported. Scores swing ±5 between identical runs on the test
  laptop, so single runs are not meaningful.
- **HTTP/2:** `next start` only speaks HTTP/1.1, which Lighthouse simulates with 6 connections per
  origin and which inflated LCP on product and listing pages by about 1.2 s. Production hosting
  (Vercel or any CDN) serves HTTP/2 or HTTP/3, so the final numbers use a local HTTP/2 proxy.
- **SEO crawl** of every sitemap URL (status, title and description length, canonical, H1 count,
  Open Graph and Twitter tags, JSON-LD validity, image alt attributes, `lang`), plus every internal
  link, robots rules and 404 behaviour.

## Results (median of 3, mobile)

| Page                    | Performance | Accessibility | Best practices | SEO | LCP   | TBT    |   CLS |
| ----------------------- | ----------: | ------------: | -------------: | --: | ----- | ------ | ----: |
| Home                    |          94 |           100 |            100 | 100 | 1.2 s | 281 ms |     0 |
| Shop                    |          96 |           100 |            100 | 100 | 2.3 s | 197 ms |     0 |
| Category (Superfoods)   |          97 |           100 |            100 | 100 | 2.1 s | 176 ms |     0 |
| Product (Sea Buckthorn) |          97 |           100 |            100 | 100 | 1.9 s | 127 ms |     0 |
| Product (Wild Thyme)    |          98 |           100 |            100 | 100 | 1.8 s | 142 ms |     0 |
| About                   |          99 |           100 |            100 | 100 | 1.0 s | 107 ms |     0 |
| Contact                 |          95 |           100 |            100 | 100 | 1.0 s | 256 ms |     0 |
| Cart                    |          98 |           100 |            100 | 69* | 0.9 s | 153 ms | 0.005 |
| Checkout                |          94 |           100 |            100 | 69* | 0.9 s | 278 ms | 0.017 |
| Privacy policy (draft)  |          98 |           100 |            100 | 69* | 1.0 s | 175 ms |     0 |
| Order confirmation      |          97 |           100 |            100 | 69* | 2.1 s | 166 ms |     0 |
| Wishlist                |          99 |           100 |            100 | 69* | 0.9 s | 120 ms | 0.015 |

\* The only failing SEO audit on these pages is "page is blocked from indexing". They are
`noindex` on purpose (transactional pages, and policies until their text is final).

Home (individual runs 91–98) and Checkout (86–97) sit at the edge of the measurement noise. All
Core Web Vitals are in the "good" range on every page (LCP < 2.5 s, CLS < 0.1).

Starting point, for comparison (first run, HTTP/1.1): Shop 89, Product 87, Category 91, and
Accessibility 96–97 on five pages.

## What was fixed

**Performance**

1. **LCP images prioritised.** The product gallery's main image and the About hero image now
   preload with `fetchPriority="high"`. On listing pages the LCP element turned out to be a
   decorative leaf in the header, which was lazy-loaded; both header leaves now preload with high
   priority (they are 3 KB each).
2. **Zod removed from the shared bundle.** `lib/env.ts` validated two environment variables with
   Zod, which put ~32 KB (gzip) of Zod on every page. It now uses plain TypeScript checks.
3. **Forms use `zod/mini`.** The contact and checkout schemas (shared by the browser and the Server
   Actions) use Zod's tree-shakable build. Same rules and messages; much smaller form pages.
4. **Cart drawer and mobile menu load after hydration** (`next/dynamic`, `ssr: false`). Both start
   closed, so they no longer add to first render and hydration on every page.
5. **Modern browser targets** (`browserslist`: Chrome/Edge 111, Firefox 128, Safari 16.4, the same
   baseline Tailwind 4 requires), so no legacy polyfills are bundled for modern browsers.
6. **Rejected:** `experimental.inlineCss`. It embedded the stylesheet three times per page (style
   tag plus the RSC payload), roughly tripling HTML size, and made LCP worse. Reverted, with a note
   in `next.config.ts`.

Initial JavaScript on a typical page went from 15 files to 10, about 160 KB gzip, most of which is
React and the Next.js runtime.

**Accessibility (now 100 everywhere)**

- Inactive product tabs and the checkout "Done" step: `#8a836f` → `#736c5a` (3.6 → 4.9:1).
- Inner-page eyebrows on the sand background: `#1f7a3f` → `#1c7039` (4.4 → 5.1:1).
- About step numbers: gold `#d1ae6c` → `#a8843f` (2.1 → 3.5:1, large text).
- Form placeholders darkened to `#736c5a`.

These are small, deliberate deviations from the mockup colours for WCAG AA contrast.

**SEO**

- Titles shortened to ≤ 60 characters and meta descriptions to ≤ 160 so Google shows them in full
  (home, shop, both products, about, contact).
- `/wishlist` added to the robots.txt disallow list (it is also `noindex`).

**Caching**

- `/images/*` was served as `immutable` for a year, but images are replaced in place under the same
  name (see `apps/web/IMAGES.md`). Now `max-age=86400, stale-while-revalidate=604800`, so replaced
  photos show up within a day.

## Verified and already correct

- Every indexable page: HTTP 200, self-referencing canonical, exactly one H1, `lang="en-PK"`,
  Open Graph and Twitter cards with an image, valid JSON-LD (Organization and WebSite everywhere;
  BreadcrumbList on inner pages; ProductGroup with per-size Offers on products; LocalBusiness and
  FAQPage on Contact).
- Sitemap lists only indexable pages (home, shop, active categories, active products, about,
  contact); draft policies join automatically once set to `final`.
- robots.txt allows the site and blocks cart, checkout, confirmation, wishlist and `/api/`;
  preview and development builds block everything.
- Unknown products, draft products and empty categories return 404.
- All 19 internal links return 200; every `<img>` has an alt attribute (empty for decorative).
- Security headers on every response; `X-Powered-By` removed.

## Before launch

1. Connect Google Search Console, submit `https://northnectar.com/sitemap.xml`.
2. Fill in the bank details (`paymentInstructions` in `apps/web/lib/constants/commerce.ts`).
3. Finalise the four policy texts and set them to `status: "final"`.
4. Add Vercel Speed Insights (or similar) to watch real-user Core Web Vitals; lab scores on a
   laptop are only a guide.
5. Larger product photos (about 1200 × 1200) would look sharper on high-density phones.
6. Connect Supabase (orders, contact messages, newsletter) and order emails, as noted in the README.
