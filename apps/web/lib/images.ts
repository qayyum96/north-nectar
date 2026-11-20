import type { ImageAsset } from "@northnectar/types";

/**
 * SINGLE SOURCE OF TRUTH FOR STATIC IMAGES.
 *
 * Every image used by layout and page sections is referenced from here, so replacing a placeholder
 * means dropping the new file into /public/images with the same name (or editing one line below).
 * Product and category images live in the data layer (packages/data) and follow the same naming.
 * See IMAGES.md at the app root for the full list, recommended sizes and formats.
 *
 * Current files are placeholders taken from the approved mockup.
 */

const img = (
  src: string,
  width: number,
  height: number,
  alt: string,
  background?: string,
): ImageAsset => ({
  src,
  width,
  height,
  alt,
  ...(background ? { background } : {}),
});

export const images = {
  brand: {
    emblemGreen: img("/images/brand/emblem-green.svg", 1488, 660, "North Nectar"),
    emblemCream: img("/images/brand/emblem-cream.svg", 1488, 660, "North Nectar"),
    wordmarkGreen: img("/images/brand/wordmark-green.svg", 1608, 180, "North Nectar"),
    wordmarkCream: img("/images/brand/wordmark-cream.svg", 1608, 180, "North Nectar"),
    logoStackedCream: img(
      "/images/brand/logo-stacked-cream.svg",
      1608,
      996,
      "North Nectar, Himalayan botanicals and natural ingredients",
    ),
  },
  icons: {
    naturallyDriedGreen: img("/images/brand/icon-naturally-dried-green.svg", 360, 312, ""),
    naturallyDriedCream: img("/images/brand/icon-naturally-dried-cream.svg", 360, 312, ""),
    himalayanSourcingGreen: img("/images/brand/icon-himalayan-sourcing-green.svg", 360, 312, ""),
    himalayanSourcingCream: img("/images/brand/icon-himalayan-sourcing-cream.svg", 360, 312, ""),
    carefullySelectedGreen: img("/images/brand/icon-carefully-selected-green.svg", 360, 312, ""),
    carefullySelectedCream: img("/images/brand/icon-carefully-selected-cream.svg", 360, 312, ""),
  },
  decor: {
    // Decorative only: empty alt so screen readers skip them.
    leaf1: img("/images/decor/leaf-1.webp", 160, 308, ""),
    leaf2: img("/images/decor/leaf-2.webp", 195, 316, ""),
    leaf3: img("/images/decor/leaf-3.webp", 293, 111, ""),
    leafCutout1: img("/images/decor/leaf-cutout-1.webp", 228, 440, ""),
    leafCutout2: img("/images/decor/leaf-cutout-2.webp", 340, 200, ""),
    seaBuckthornBranch: img(
      "/images/decor/illustration-sea-buckthorn-branch.svg",
      624,
      1752,
      "Engraved illustration of a sea buckthorn branch with berries",
    ),
    branchPatternGreen: img("/images/decor/pattern-branch-green.svg", 1200, 1248, ""),
    branchPatternCream: img("/images/decor/pattern-branch-cream.svg", 1200, 1248, ""),
    mountainsCream: img("/images/decor/scene-mountains-cream.svg", 1836, 696, ""),
  },
  home: {
    harvestBasket: img(
      "/images/home/hero-himalayan-harvest-basket.webp",
      2160,
      836,
      "Basket of Himalayan roots, herbs, honeycomb and dried apricots",
    ),
    valleyFlatlay: img(
      "/images/home/hero-valley-flatlay.webp",
      567,
      658,
      "Himalayan dry fruits, honey and herbs laid out from above",
    ),
    storyVideoPoster: img(
      "/images/home/story-video-poster.jpg",
      1600,
      900,
      "Himalayan dry fruits, herbs and honey from above",
    ),
    showcaseSeaBuckthorn: img(
      "/images/home/showcase-sea-buckthorn.webp",
      608,
      608,
      "Sea Buckthorn Berries pouch and bowl",
    ),
    showcaseWhiteApricot: img(
      "/images/home/showcase-white-apricot.webp",
      608,
      608,
      "White Apricot pouch and bowl",
    ),
    showcaseShilajit: img(
      "/images/home/showcase-shilajit.webp",
      461,
      468,
      "Himalayan Shilajit Resin jar",
    ),
  },
  /** /about (Our story). Currently reuse home and product photos; replace with sourcing photos. */
  about: {
    heroBasket: img(
      "/images/home/hero-himalayan-harvest-basket.webp",
      2160,
      836,
      "Basket of Himalayan roots, herbs, honeycomb and dried apricots",
    ),
    heroFlatlay: img(
      "/images/home/hero-valley-flatlay.webp",
      567,
      658,
      "Himalayan dry fruits, honey and herbs from above",
    ),
    stepGathered: img(
      "/images/home/hero-himalayan-harvest-basket.webp",
      2160,
      836,
      "Basket of freshly gathered herbs and roots",
    ),
    stepDried: img(
      "/images/products/product-sea-buckthorn-berries.webp",
      600,
      600,
      "Dried sea buckthorn berries",
    ),
    stepSelected: img(
      "/images/products/product-dried-apricots.webp",
      608,
      608,
      "Selected dried apricots",
    ),
    stepPacked: img(
      "/images/products/product-sea-buckthorn-label-front.webp",
      1400,
      1310,
      "North Nectar label",
    ),
  },
  categories: {
    pureHoney: img(
      "/images/categories/category-pure-honey.webp",
      220,
      220,
      "Jars of pure Himalayan honey",
    ),
    naturalOils: img(
      "/images/categories/category-natural-oils.webp",
      220,
      220,
      "Bottles of natural cold-pressed oils",
    ),
  },
} as const;

export const videos = {
  story: {
    src: "/videos/north-nectar-story.mp4",
    type: "video/mp4",
    durationLabel: "1:30",
    poster: images.home.storyVideoPoster,
  },
} as const;
