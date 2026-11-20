import type { Category } from "@northnectar/types";

/**
 * Seed categories (from the approved mockup). A category is only shown on the site when it is
 * `active` AND contains at least one active product, so empty categories hide automatically.
 */
export const seedCategories: Category[] = [
  {
    id: "cat-herbal-tea",
    slug: "herbal-tea",
    name: "Herbal Tea",
    description:
      "Wild Himalayan herbal infusions, picked on the slopes of Hunza and packed at source. Naturally caffeine-free, with nothing added.",
    image: {
      src: "/images/products/product-tumuro-tea-100g.webp",
      alt: "Hunza Wild Thyme Tea pouch",
      width: 1400,
      height: 1400,
      background: "#ebe6d6",
    },
    sortOrder: 5,
    status: "active",
    seo: {
      title: "Himalayan Herbal Tea from Hunza",
      description:
        "Shop wild thyme (tumuro) and other Himalayan herbal teas from Hunza, Gilgit-Baltistan. Naturally caffeine-free, packed at source, cash on delivery across Pakistan.",
    },
  },
  {
    id: "cat-superfoods",
    slug: "superfoods",
    name: "Superfoods",
    description:
      "Sea buckthorn berries and other nutrient-rich Himalayan harvests, carefully dried in mountain air.",
    image: {
      src: "/images/products/product-sea-buckthorn-berries.webp",
      alt: "Sea Buckthorn Berries pouch with a bowl of berries",
      width: 600,
      height: 600,
    },
    sortOrder: 3,
    status: "active",
    seo: {
      title: "Himalayan Superfoods: Sea Buckthorn and More",
      description:
        "Dried sea buckthorn berries and other Himalayan superfoods from Gilgit-Baltistan. Naturally dried, no additives, delivered across Pakistan.",
    },
  },
  {
    id: "cat-herbal-roots",
    slug: "herbal-roots",
    name: "Herbal Roots",
    description: "Sun-dried Himalayan roots, sourced by region and sorted by hand.",
    image: {
      src: "/images/products/product-mulethi-roots.webp",
      alt: "Mulethi licorice roots",
      width: 600,
      height: 600,
    },
    sortOrder: 1,
    status: "active",
  },
  {
    id: "cat-dry-fruits",
    slug: "dry-fruits",
    name: "Dry Fruits",
    shortName: "Dry Fruits",
    description:
      "Sun-dried apricots and export-quality nuts from the orchards of Gilgit-Baltistan.",
    image: {
      src: "/images/products/product-dried-apricots.webp",
      alt: "Dried apricots pouch with a bowl of apricots",
      width: 608,
      height: 608,
    },
    sortOrder: 2,
    status: "active",
  },
  {
    id: "cat-shilajit",
    slug: "shilajit",
    name: "Shilajit",
    description: "Pure Himalayan shilajit resin from the high mountains.",
    image: {
      src: "/images/products/product-shilajit-resin.webp",
      alt: "Jar of Himalayan Shilajit Resin with a spoon",
      width: 608,
      height: 608,
    },
    sortOrder: 4,
    status: "active",
  },
  {
    id: "cat-pure-honey",
    slug: "pure-honey",
    name: "Pure Honey",
    shortName: "Honey",
    description: "Raw honey from Himalayan valleys.",
    image: {
      src: "/images/categories/category-pure-honey.webp",
      alt: "Jars of pure Himalayan honey",
      width: 220,
      height: 220,
    },
    sortOrder: 6,
    status: "active",
  },
  {
    id: "cat-natural-oils",
    slug: "natural-oils",
    name: "Natural Oils",
    shortName: "Oils",
    description: "Cold-pressed natural oils from Gilgit-Baltistan.",
    image: {
      src: "/images/categories/category-natural-oils.webp",
      alt: "Bottles of natural cold-pressed oils",
      width: 220,
      height: 220,
    },
    sortOrder: 7,
    status: "active",
  },
  {
    id: "cat-wholesale",
    slug: "wholesale",
    name: "Wholesale",
    description:
      "Bulk Himalayan herbs, roots, dry fruits and nuts for retailers, hakeems and exporters.",
    image: {
      src: "/images/products/product-ephedra.webp",
      alt: "Bulk sacks and boxes of Ephedra",
      width: 600,
      height: 600,
    },
    sortOrder: 8,
    status: "active",
  },
];
