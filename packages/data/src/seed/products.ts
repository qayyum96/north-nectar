import type {
  ImageAsset,
  Product,
  ProductBadge,
  ProductVariant,
  PurchaseMode,
} from "@northnectar/types";

/*
 * Seed catalogue (from the approved mockup). Prices are placeholder whole-rupee amounts.
 *
 * LIVE: the two real products are written in full and set to `status: "active"`.
 * DRAFT: the other nine exist so every layout can be built and tested with a full catalogue.
 * They never appear on the website, in the sitemap or in structured data until switched to
 * "active". The fastest way to preview the full catalogue locally is CATALOG_INCLUDE_DRAFTS=true
 * (see README).
 */

const CREATED = "2026-11-01T00:00:00.000Z";
const UPDATED = "2026-11-20T00:00:00.000Z";

const weight = (
  id: string,
  sku: string,
  grams: number,
  price: number,
  extra: Partial<ProductVariant> = {},
): ProductVariant => ({
  id,
  sku,
  label: grams >= 1000 ? `Bulk ${grams / 1000}kg` : `${grams}g`,
  weightGrams: grams,
  price,
  compareAtPrice: null,
  stock: 50,
  tag: null,
  ...extra,
});

const productImage = (file: string, alt: string, width = 608, height = 608): ImageAsset => ({
  src: `/images/products/${file}`,
  alt,
  width,
  height,
});

/* ------------------------------------------------------------------------------------------ */
/* Live product 1: Hunza Herbal Tea, Wild Thyme (Tumuro)                                       */
/* ------------------------------------------------------------------------------------------ */

const hunzaWildThymeTea: Product = {
  id: "prod-hunza-wild-thyme-tea",
  slug: "hunza-wild-thyme-tea",
  status: "active",
  name: "Hunza Herbal Tea, Wild Thyme (Tumuro)",
  tagline: "Pure Himalayan herbal infusion.",
  description: [
    "A gentle, aromatic herbal infusion of wild thyme, known in the valley as tumuro, picked by hand on the slopes of Hunza. Naturally caffeine-free and lovely after a meal.",
    "Families in Hunza have brewed tumuro for generations. We buy it directly from local pickers, dry it slowly in mountain air and pack it at source, so every cup keeps the warm, herbal aroma of the valley.",
    "Nothing is added: no flavourings, no colours and no blends. Just wild thyme from Gilgit-Baltistan.",
  ],
  botanicalName: "Thymus linearis",
  origin: "Hunza, Gilgit-Baltistan",
  categoryId: "cat-herbal-tea",
  images: [
    {
      ...productImage(
        "product-tumuro-tea-100g.webp",
        "North Nectar Hunza Herbal Tea, Wild Thyme (Tumuro) 100g kraft pouch",
        1400,
        1400,
      ),
      background: "#ebe6d6",
    },
  ],
  variants: [
    weight("var-tea-50g", "NN-TEA-WT-050", 50, 650, { stock: 40 }),
    weight("var-tea-100g", "NN-TEA-WT-100", 100, 1150, {
      stock: 60,
      tag: "Popular",
      isDefault: true,
    }),
    weight("var-tea-200g", "NN-TEA-WT-200", 200, 2100, { stock: 25, tag: "Best value" }),
  ],
  purchaseMode: "retail",
  badge: { label: "New", tone: "green" },
  highlights: ["Wild-picked in Hunza", "Naturally caffeine-free", "No flavours or additives"],
  waysToEnjoy: [
    "A warm cup after meals",
    "Iced, with a slice of lemon",
    "With a spoon of honey",
    "Mixed with green tea for a milder cup",
  ],
  howToUse: [
    { title: "1 to 2 teaspoons", description: "Add to your cup or teapot." },
    { title: "Add hot water", description: "Pour 200 to 250 ml, just off the boil." },
    { title: "Steep 5 to 10 minutes", description: "Longer for a deeper, richer cup." },
    { title: "Strain and enjoy", description: "Lovely hot, or chilled over ice." },
  ],
  attributes: [
    { label: "Product name", value: "Hunza Herbal Tea, Wild Thyme (Tumuro)" },
    { label: "Brand", value: "North Nectar" },
    { label: "Product form", value: "Dried wild thyme leaves and flowers" },
    { label: "Ingredients", value: "100% wild thyme (Thymus linearis)" },
    { label: "Caffeine", value: "Naturally caffeine-free" },
    { label: "Country of origin", value: "Pakistan" },
    { label: "Sourcing region", value: "Hunza, Gilgit-Baltistan" },
    { label: "Net weight", value: "50g, 100g or 200g" },
    {
      label: "Storage",
      value: "Cool, dry place away from sunlight. Reseal the pouch after opening.",
    },
  ],
  isFeatured: true,
  isBestSeller: false,
  isNewArrival: true,
  popularityRank: 2,
  relatedProductIds: ["prod-dried-sea-buckthorn-berries"],
  seo: {
    title: "Hunza Wild Thyme Tea (Tumuro), Himalayan Herbal Tea",
    description:
      "Wild thyme (tumuro) herbal tea, hand-picked in Hunza and packed at source. Naturally caffeine-free, no additives. 50g, 100g and 200g pouches with cash on delivery across Pakistan.",
  },
  createdAt: CREATED,
  updatedAt: UPDATED,
};

/* ------------------------------------------------------------------------------------------ */
/* Live product 2: Premium Dried Sea Buckthorn Berries                                         */
/* ------------------------------------------------------------------------------------------ */

const driedSeaBuckthornBerries: Product = {
  id: "prod-dried-sea-buckthorn-berries",
  slug: "dried-sea-buckthorn-berries",
  status: "active",
  name: "Premium Dried Sea Buckthorn Berries",
  tagline: "Tangy Himalayan superfood, carefully dried.",
  description: [
    "Tangy, bright berries carefully selected and dried in the mountains of Gilgit-Baltistan. Lovely in herbal teas, fruit blends and breakfast bowls.",
    "North Nectar Himalayan Sea Buckthorn Berries come from the mountain regions of Gilgit-Baltistan, where the shrub grows wild along rivers and slopes. We source by region, handle every batch with care and pack at source, so each pouch carries the same bright, tangy flavour.",
    "Enjoy them in herbal infusions, fruit blends and your own recipes.",
  ],
  botanicalName: "Hippophae rhamnoides",
  origin: "Gilgit-Baltistan",
  illustration: {
    src: "/images/decor/pattern-branch-green.svg",
    alt: "Engraved illustration of a sea buckthorn branch with berries",
    width: 1200,
    height: 1248,
  },
  categoryId: "cat-superfoods",
  images: [
    productImage(
      "product-sea-buckthorn-berries.webp",
      "North Nectar Dried Sea Buckthorn Berries pouch with a bowl of berries",
    ),
    {
      src: "/images/home/showcase-sea-buckthorn.webp",
      alt: "Sea Buckthorn pouch and dried berries on a wooden board",
      width: 608,
      height: 608,
      background: "#f3eadb",
    },
    {
      ...productImage(
        "product-sea-buckthorn-label-front.webp",
        "Front of the North Nectar Sea Buckthorn label",
        1400,
        1310,
      ),
      background: "#d1ae6c",
    },
    {
      ...productImage(
        "product-sea-buckthorn-label-back.webp",
        "Back of the label with product and batch information",
        850,
        1400,
      ),
      background: "#d1ae6c",
    },
  ],
  variants: [
    weight("var-sbb-100g", "NN-SBB-100", 100, 699, { stock: 80 }),
    weight("var-sbb-250g", "NN-SBB-250", 250, 1350, {
      stock: 60,
      tag: "Popular",
      isDefault: true,
    }),
    weight("var-sbb-500g", "NN-SBB-500", 500, 2650, { stock: 30, tag: "Best value" }),
  ],
  purchaseMode: "retail",
  badge: { label: "Best seller", tone: "green" },
  highlights: [
    "Hand-picked in Gilgit-Baltistan",
    "Naturally dried, nothing added",
    "Bright, tangy flavour",
  ],
  waysToEnjoy: [
    "Add to herbal teas and infusions",
    "Use in homemade fruit blends",
    "Add to food and breakfast bowls",
    "Rehydrate in warm water if needed",
  ],
  howToUse: [
    { title: "1 to 2 tsp", description: "Dried berries in a cup or pot." },
    { title: "Add hot water", description: "200 to 250 ml, just off the boil." },
    { title: "Steep 5 to 10 min", description: "Longer for a deeper flavour." },
    { title: "Strain and enjoy", description: "Hot, or chilled over ice." },
  ],
  attributes: [
    { label: "Product name", value: "Premium Dried Sea Buckthorn Berries" },
    { label: "Brand", value: "North Nectar" },
    { label: "Product form", value: "Dried berries" },
    { label: "Ingredients", value: "Sea Buckthorn Berries (Hippophae rhamnoides)" },
    { label: "Country of origin", value: "Pakistan" },
    { label: "Sourcing region", value: "Gilgit-Baltistan" },
    { label: "Net weight", value: "100g, 250g or 500g" },
    { label: "Storage", value: "Cool, dry place. Keep the pouch sealed after opening." },
  ],
  isFeatured: true,
  isBestSeller: true,
  isNewArrival: false,
  popularityRank: 1,
  relatedProductIds: ["prod-hunza-wild-thyme-tea"],
  seo: {
    title: "Dried Sea Buckthorn Berries from Gilgit-Baltistan",
    description:
      "Premium dried sea buckthorn berries (Hippophae rhamnoides), hand-picked in Gilgit-Baltistan and naturally dried. 100g, 250g and 500g pouches with cash on delivery across Pakistan.",
  },
  createdAt: CREATED,
  updatedAt: UPDATED,
};

/* ------------------------------------------------------------------------------------------ */
/* Draft products (layout and testing only)                                                     */
/* ------------------------------------------------------------------------------------------ */

interface DraftInput {
  slug: string;
  name: string;
  tagline: string;
  categoryId: string;
  image: ImageAsset;
  variants: ProductVariant[];
  rank: number;
  botanicalName?: string;
  badge?: ProductBadge;
  purchaseMode?: PurchaseMode;
  bestSeller?: boolean;
  newArrival?: boolean;
  featured?: boolean;
}

function draft(input: DraftInput): Product {
  return {
    id: `prod-${input.slug}`,
    slug: input.slug,
    status: "draft",
    name: input.name,
    tagline: input.tagline,
    description: [
      `${input.tagline} Sourced in Gilgit-Baltistan and packed at source by North Nectar.`,
      "Draft product: full description to follow.",
    ],
    ...(input.botanicalName ? { botanicalName: input.botanicalName } : {}),
    origin: "Gilgit-Baltistan",
    categoryId: input.categoryId,
    images: [input.image],
    variants: input.variants,
    purchaseMode: input.purchaseMode ?? "retail",
    badge: input.badge ?? null,
    highlights: ["Sourced in Gilgit-Baltistan", "Packed at source", "Nothing added"],
    waysToEnjoy: [],
    howToUse: [],
    attributes: [
      { label: "Brand", value: "North Nectar" },
      { label: "Country of origin", value: "Pakistan" },
      { label: "Sourcing region", value: "Gilgit-Baltistan" },
    ],
    isFeatured: input.featured ?? false,
    isBestSeller: input.bestSeller ?? false,
    isNewArrival: input.newArrival ?? false,
    popularityRank: input.rank,
    relatedProductIds: [],
    createdAt: CREATED,
    updatedAt: UPDATED,
  };
}

const drafts: Product[] = [
  draft({
    slug: "himalayan-shilajit-resin",
    name: "Himalayan Shilajit Resin",
    tagline: "Pure resin from the high mountains.",
    categoryId: "cat-shilajit",
    image: productImage(
      "product-shilajit-resin.webp",
      "Jar of Himalayan Shilajit Resin with a spoon",
    ),
    variants: [
      weight("var-shilajit-10g", "NN-SHJ-010", 10, 1999, { isDefault: true }),
      weight("var-shilajit-50g", "NN-SHJ-050", 50, 8999),
      weight("var-shilajit-150g", "NN-SHJ-150", 150, 27000),
    ],
    badge: { label: "Premium", tone: "dark" },
    bestSeller: true,
    featured: true,
    rank: 5,
  }),
  draft({
    slug: "wild-sanghuang-mushroom",
    name: "Wild Sanghuang Mushroom",
    tagline: "Phellinus linteus, a rare wild Himalayan mushroom.",
    categoryId: "cat-superfoods",
    botanicalName: "Phellinus linteus",
    image: productImage(
      "product-sanghuang-mushroom.webp",
      "Wild Sanghuang mushroom in a wooden bowl",
    ),
    variants: [
      weight("var-sanghuang-100g", "NN-SGH-100", 100, 26000, {
        compareAtPrice: 35000,
        isDefault: true,
      }),
    ],
    badge: { label: "Save 26%", tone: "orange" },
    bestSeller: true,
    rank: 3,
  }),
  draft({
    slug: "mulethi-roots-licorice",
    name: "Mulethi Roots (Licorice)",
    tagline: "Sun-dried Himalayan licorice root.",
    categoryId: "cat-herbal-roots",
    botanicalName: "Glycyrrhiza glabra",
    image: productImage("product-mulethi-roots.webp", "Mulethi licorice roots in a cloth sack"),
    variants: [
      weight("var-mulethi-250g", "NN-MUL-250", 250, 750, { compareAtPrice: 850, isDefault: true }),
    ],
    badge: { label: "Sale", tone: "orange" },
    bestSeller: true,
    rank: 4,
  }),
  draft({
    slug: "white-apricot-safed",
    name: "White Apricot (Safed)",
    tagline: "Naturally sweet Himalayan dried apricot.",
    categoryId: "cat-dry-fruits",
    image: productImage(
      "product-white-apricot.webp",
      "White Apricot pouch with a bowl of apricots",
    ),
    variants: [
      weight("var-white-apricot-250g", "NN-WAP-250", 250, 700, { isDefault: true }),
      weight("var-white-apricot-500g", "NN-WAP-500", 500, 1400),
    ],
    newArrival: true,
    rank: 6,
  }),
  draft({
    slug: "dried-apricots-sukhi-khubani",
    name: "Dried Apricots (Sukhi Khubani)",
    tagline: "Sun-dried Himalayan apricots.",
    categoryId: "cat-dry-fruits",
    image: productImage(
      "product-dried-apricots.webp",
      "Dried apricots pouch with a bowl of apricots",
    ),
    variants: [
      weight("var-apricots-250g", "NN-APR-250", 250, 499, { isDefault: true }),
      weight("var-apricots-500g", "NN-APR-500", 500, 1080),
    ],
    badge: { label: "Organic", tone: "kraft" },
    newArrival: true,
    rank: 7,
  }),
  draft({
    slug: "walnut-kernels",
    name: "Walnut Kernels",
    tagline: "Export-quality kernels, retail and bulk.",
    categoryId: "cat-dry-fruits",
    image: productImage("product-walnut-kernels.webp", "Retail and wholesale walnut kernel packs"),
    variants: [
      weight("var-walnut-250g", "NN-WAL-250", 250, 1200, { isDefault: true }),
      weight("var-walnut-25kg", "NN-WAL-25KG", 25000, 104999),
    ],
    rank: 8,
  }),
  draft({
    slug: "salab-panja",
    name: "Salab Panja",
    tagline: "Dactylorhiza hatagirea, a rare Himalayan root.",
    categoryId: "cat-herbal-roots",
    botanicalName: "Dactylorhiza hatagirea",
    image: productImage("product-salab-panja.webp", "Salab Panja pouch with dried roots"),
    variants: [
      weight("var-panja-50g", "NN-SPJ-050", 50, 8999, { isDefault: true }),
      weight("var-panja-250g", "NN-SPJ-250", 250, 31500),
    ],
    badge: { label: "Rare", tone: "kraft" },
    newArrival: true,
    rank: 9,
  }),
  draft({
    slug: "salab-misri",
    name: "Salab Misri",
    tagline: "Orchis latifolia, a prized Himalayan root.",
    categoryId: "cat-herbal-roots",
    botanicalName: "Orchis latifolia",
    image: productImage("product-salab-misri.webp", "Salab Misri pouch with dried roots", 608, 600),
    variants: [
      weight("var-misri-100g", "NN-SMS-100", 100, 35000, { isDefault: true }),
      weight("var-misri-250g", "NN-SMS-250", 250, 65000),
    ],
    badge: { label: "Rare", tone: "kraft" },
    rank: 10,
  }),
  draft({
    slug: "ephedra-somakalpa",
    name: "Ephedra (Somakalpa)",
    tagline: "Dried botanical raw material, bulk only.",
    categoryId: "cat-herbal-roots",
    image: productImage("product-ephedra.webp", "Bulk sacks and boxes of Ephedra"),
    variants: [],
    purchaseMode: "quote",
    badge: { label: "Bulk only", tone: "dark" },
    rank: 11,
  }),
];

export const seedProducts: Product[] = [driedSeaBuckthornBerries, hunzaWildThymeTea, ...drafts];
