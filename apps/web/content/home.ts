import { images } from "@/lib/images";

/**
 * Home page copy and merchandising. Products are referenced by slug and fetched from the data
 * layer; any block whose product is not active is skipped automatically.
 * No copy here depends on how many products exist.
 */
export const homeContent = {
  hero: {
    announcement: {
      label: "New",
      text: "Hunza Wild Thyme Tea is here",
      productSlug: "hunza-wild-thyme-tea",
    },
    eyebrow: "North Nectar · Himalayan botanicals & natural ingredients",
    lead: "Sea buckthorn, wild thyme tea and more from Gilgit-Baltistan. Gathered by hand, naturally dried and packed at source, then delivered to your door anywhere in Pakistan.",
    primaryCta: { label: "Shop the harvest", href: "/shop" },
    secondaryCta: { label: "Our story", href: "/about" },
    socialProof: "Loved across Pakistan",
    trustNote: "Cash on delivery nationwide",
    /** Decorative images inside the headline ("Picked in [img] the Himalayas [img] for you."). */
    chips: [images.home.showcaseSeaBuckthorn, images.home.harvestBasket],
  },

  story: {
    label: "From the valley to your home",
    title: "The North Nectar story",
    stickerTop: { big: "100%", small: "Natural" },
    stickerBottom: { big: "0", small: "Additives" },
    sideImages: [
      {
        src: "/images/products/product-sea-buckthorn-berries.webp",
        alt: "Sea Buckthorn Berries pouch and bowl",
        width: 608,
        height: 608,
      },
      {
        src: "/images/products/product-white-apricot.webp",
        alt: "White Apricot pouch and bowl",
        width: 608,
        height: 608,
      },
    ],
  },

  marquee: [
    "Naturally dried",
    "Himalayan sourcing",
    "Hand-picked",
    "No additives",
    "Packed at source",
    "Cash on delivery",
  ],

  categories: { eyebrow: "Shop the harvest", title: "Browse by category" },
  bestSellers: {
    eyebrow: "Most loved",
    title: "Best sellers",
    /** Category tabs, in this order, shown only for categories that have active products. */
    tabCategorySlugs: ["superfoods", "herbal-roots", "dry-fruits"],
  },
  newArrivals: { eyebrow: "Fresh from the valley", title: "New arrivals" },

  /**
   * Promo cards: the first two ACTIVE entries are shown side by side (mockup layout). The first
   * card is always peach, the second always dark. Entries are tried in order, and the spotlight
   * product is only used as a last resort, so draft products never leave an empty slot.
   */
  promos: [
    {
      productSlug: "dried-sea-buckthorn-berries",
      eyebrow: "Himalayan superfood",
      title: "Sea buckthorn berries",
      text: "Tangy wild berries from Gilgit-Baltistan, carefully dried.",
    },
    {
      productSlug: "himalayan-shilajit-resin",
      eyebrow: "Premium pick",
      title: "Himalayan shilajit resin",
      text: "Sourced from the high mountains of Gilgit-Baltistan.",
    },
    {
      productSlug: "hunza-wild-thyme-tea",
      eyebrow: "Our signature tea",
      title: "Hunza wild thyme tea (Tumuro)",
      text: "Wild-picked tumuro from Hunza, naturally caffeine-free.",
    },
  ],

  spotlight: {
    productSlug: "hunza-wild-thyme-tea",
    eyebrow: "New · Our signature tea",
    title: "Hunza Wild Thyme Tea",
    subtitle: "Tumuro, as it is known in the valley",
    /** Spotlight copy (falls back to the product description when removed). */
    description:
      "A gentle, aromatic herbal infusion of wild thyme picked on the slopes of Hunza. Naturally caffeine-free and lovely after a meal.",
    brewTitle: "How to brew the perfect cup",
    brewNote: "For thyme tea and sea buckthorn infusions",
  },

  origin: {
    watermark: "Our origin",
    title: "From the valleys of Gilgit-Baltistan",
    text: "Every herb, root and fruit comes from families in Hunza and Ghanche who have gathered them for generations. We pack at source so nothing is lost on the way to you.",
    features: [
      {
        title: "Himalayan sourcing",
        text: "Gathered by hand where each plant grows wild.",
        icon: images.icons.himalayanSourcingGreen,
      },
      {
        title: "Naturally dried",
        text: "Slow drying in mountain air. Nothing added.",
        icon: images.icons.naturallyDriedGreen,
      },
    ],
    cta: { label: "Read our story", href: "/about" },
    photos: [images.home.harvestBasket, images.home.valleyFlatlay],
  },

  /**
   * PLACEHOLDER testimonials from the mockup. While `isPlaceholder` is true they are shown only on
   * development and preview builds, never in production, because publishing invented reviews
   * would mislead customers. Replace with real, verifiable reviews and set isPlaceholder: false.
   */
  reviews: {
    eyebrow: "Customer reviews",
    title: "Loved across Pakistan",
    isPlaceholder: true,
    items: [
      {
        title: "Genuine quality",
        quote: "The shilajit is the real thing. Packed well and arrived in three days.",
        name: "Usman T.",
        city: "Rawalpindi",
        image: { src: "/images/products/product-shilajit-resin.webp", alt: "Shilajit Resin" },
      },
      {
        title: "Fresh and well packed",
        quote: "Sea buckthorn arrived fresh and sealed. Tangy and lovely with yogurt.",
        name: "Hamza A.",
        city: "Lahore",
        image: {
          src: "/images/products/product-sea-buckthorn-berries.webp",
          alt: "Sea Buckthorn Berries",
        },
      },
      {
        title: "Easy cash on delivery",
        quote: "Paid on delivery and the apricots reached Karachi in four days.",
        name: "Mehwish K.",
        city: "Karachi",
        image: { src: "/images/products/product-dried-apricots.webp", alt: "Dried Apricots" },
      },
    ],
  },

  wholesale: {
    eyebrow: "For businesses",
    title: "Wholesale and export",
    text: "Bulk supply of Himalayan herbs, roots, dry fruits and nuts for retailers, hakeems, cafés and exporters.",
    primaryCta: { label: "Send an enquiry", href: "/contact?subject=wholesale" },
    secondaryCta: { label: "WhatsApp us" },
    photos: [
      {
        src: "/images/products/product-ephedra.webp",
        alt: "Bulk sacks and boxes of dried herbs",
        width: 608,
        height: 608,
      },
      {
        src: "/images/products/product-walnut-kernels.webp",
        alt: "Retail and wholesale walnut kernel packs",
        width: 608,
        height: 608,
      },
    ],
  },

  banner: {
    eyebrow: "Take a trip",
    title: "Straight from the valley to your home",
    text: "Family-owned and sourced direct from the mountains of Gilgit-Baltistan. Pure, natural and carefully dried, the way it has always been done.",
    cta: { label: "See product range", href: "/shop" },
    image: images.home.storyVideoPoster,
  },
};
