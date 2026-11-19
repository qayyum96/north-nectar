# Images

All current files are **placeholders taken from the approved mockup**. To replace one, export the
final image at the recommended size and overwrite the file with **the same name and path**. No code
changes are needed.

- Static layout and section images are mapped in [`lib/images.ts`](lib/images.ts) (one place).
- Product and category images are referenced from the data layer (`packages/data`, Phase 2) using
  the same paths. When products move to Supabase, images move to Supabase Storage (see README).

## General rules

| Rule            | Value                                                       |
| --------------- | ----------------------------------------------------------- |
| Photo format    | WebP (quality ~80). Next.js also serves AVIF automatically. |
| Logos and icons | SVG                                                         |
| Max file size   | ~200 KB per photo, ~3 MB for the video                      |
| Colour          | sRGB                                                        |
| Naming          | lowercase, hyphenated, descriptive (`product-<slug>.webp`)  |
| Alt text        | Set in `lib/images.ts` / product data, not in the file name |

Sizes below are the **source** size to export. Next.js generates smaller responsive versions.

## Brand (`public/images/brand/`)

| File                                        | Use                                                 | Recommended           |
| ------------------------------------------- | --------------------------------------------------- | --------------------- |
| `emblem-green.svg`                          | Header logo mark, favicon source, Organization logo | SVG, about 2.25:1     |
| `emblem-cream.svg`                          | Logo mark on dark backgrounds, social images        | SVG                   |
| `wordmark-green.svg`                        | "North Nectar" wordmark in header                   | SVG, about 9:1        |
| `wordmark-cream.svg`                        | Wordmark on dark                                    | SVG                   |
| `logo-stacked-cream.svg`                    | Footer logo (emblem above wordmark)                 | SVG, about 1.6:1      |
| `icon-naturally-dried-{green,cream}.svg`    | Feature icon                                        | SVG, 360×312 artboard |
| `icon-himalayan-sourcing-{green,cream}.svg` | Feature icon                                        | SVG, 360×312 artboard |
| `icon-carefully-selected-{green,cream}.svg` | Feature icon                                        | SVG, 360×312 artboard |

> Also provide a **square PNG logo, 512×512** (`logo-square-512.png`) for Google's Organization logo
> and app icons when ready.

## Products (`public/images/products/`)

Square **1200×1200** WebP, product centred, light neutral background, consistent lighting across the
range. Up to 4 gallery images per product: main pack shot, lifestyle, label front, label back.

| File                                                          | Product                             | Status                          |
| ------------------------------------------------------------- | ----------------------------------- | ------------------------------- |
| `product-tumuro-tea-100g.webp`                                | Hunza Wild Thyme Tea (Tumuro), main | live product                    |
| `product-tumuro-tea-50g.webp`, `product-tumuro-tea-200g.webp` | Per-size pack shots (optional)      | missing, uses 100g              |
| `product-sea-buckthorn-berries.webp`                          | Dried Sea Buckthorn Berries, main   | live product                    |
| `product-sea-buckthorn-label-front.webp`                      | Label front (gallery)               | live product; current 1400×1310 |
| `product-sea-buckthorn-label-back.webp`                       | Label back (gallery)                | live product; current 850×1400  |
| `product-shilajit-resin.webp`                                 | Himalayan Shilajit Resin            | draft                           |
| `product-sanghuang-mushroom.webp`                             | Wild Sanghuang Mushroom             | draft                           |
| `product-mulethi-roots.webp`                                  | Mulethi Roots (Licorice)            | draft                           |
| `product-white-apricot.webp`                                  | White Apricot (Safed)               | draft                           |
| `product-dried-apricots.webp`                                 | Dried Apricots (Sukhi Khubani)      | draft                           |
| `product-walnut-kernels.webp`                                 | Walnut Kernels                      | draft                           |
| `product-salab-panja.webp`                                    | Salab Panja                         | draft                           |
| `product-salab-misri.webp`                                    | Salab Misri                         | draft                           |
| `product-ephedra.webp`                                        | Ephedra (Somakalpa), bulk           | draft                           |

Current placeholders are 608×608 (too small for zoom and retina); final files should be 1200×1200.

## Categories (`public/images/categories/`)

Square **800×800**, shown as circles (crop-safe centre). Categories without their own file reuse a
product image.

| File                                                                                                                                                                  | Category                             |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| `category-pure-honey.webp`                                                                                                                                            | Pure Honey                           |
| `category-natural-oils.webp`                                                                                                                                          | Natural Oils                         |
| `category-herbal-tea.webp`, `category-superfoods.webp`, `category-herbal-roots.webp`, `category-dry-fruits.webp`, `category-shilajit.webp`, `category-wholesale.webp` | missing; product images used for now |

## Home and story (`public/images/home/`)

| File                                 | Use                                                           | Recommended                              |
| ------------------------------------ | ------------------------------------------------------------- | ---------------------------------------- |
| `hero-himalayan-harvest-basket.webp` | Hero headline image chip, origin collage, about hero          | 2160×836 (wide, subject centred)         |
| `hero-valley-flatlay.webp`           | Origin collage, "Straight from the valley" banner, about hero | 1400×1584 portrait                       |
| `story-video-poster.jpg`             | Poster for the story video (shown until play)                 | 1600×900 (16:9), JPG or WebP             |
| `showcase-sea-buckthorn.webp`        | Tilted card in the home showcase                              | 800×800                                  |
| `showcase-white-apricot.webp`        | Tilted card in the showcase, newsletter band                  | 800×800                                  |
| `showcase-shilajit.webp`             | Hero headline image chip                                      | 600×600, transparent or light background |
| `hero-hunza-valley.webp`             | Optional real landscape photo of Hunza for about / banner     | 2400×1200 (not in mockup, recommended)   |

## Video (`public/videos/`)

| File                     | Use                                           | Recommended                                                                  |
| ------------------------ | --------------------------------------------- | ---------------------------------------------------------------------------- |
| `north-nectar-story.mp4` | "The North Nectar story" (loads only on play) | H.264 MP4, 1280×720, ≤ 3 MB, ~1:30, no audio required; optional `.webm` copy |

## Decorative (`public/images/decor/`)

Decorative images use empty alt text.

| File                                        | Use                                                    | Recommended                                     |
| ------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------- |
| `leaf-1.webp`, `leaf-2.webp`, `leaf-3.webp` | Floating leaves                                        | transparent WebP, ~400px long edge              |
| `leaf-cutout-1.webp`, `leaf-cutout-2.webp`  | Leaves on cards and empty states                       | transparent WebP, ~400px                        |
| `illustration-sea-buckthorn-branch.svg`     | Product description illustration                       | SVG                                             |
| `pattern-branch-{green,cream}.svg`          | Background branch pattern                              | SVG (currently 170 KB each, optimise with SVGO) |
| `scene-mountains-cream.svg`                 | Mountain and forest silhouette (footer, dark sections) | SVG (128 KB, optimise with SVGO)                |

## Generated (no files needed)

| Route                              | What                                                           |
| ---------------------------------- | -------------------------------------------------------------- |
| `/opengraph-image`                 | Default 1200×630 social image (from `app/opengraph-image.tsx`) |
| `/products/[slug]/opengraph-image` | Per-product social image (Phase 3)                             |
| `/icon.svg`, `/apple-icon`         | Favicon and Apple touch icon, from the emblem                  |
