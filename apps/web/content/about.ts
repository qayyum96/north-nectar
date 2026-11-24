import { type CommerceSettings, deliveryFacts } from "@northnectar/data/commerce-settings";
import { formatPkr } from "@northnectar/ui";
import { images } from "@/lib/images";

/** Copy for /about (Our story). Images come from lib/images.ts. */
export const aboutContent = {
  meta: {
    title: "Our Story: Harvests from Gilgit-Baltistan",
    description:
      "North Nectar brings the pure harvests of Hunza and Ghanche to homes across Pakistan: herbs, roots, berries and fruits, hand-picked and packed at source.",
  },
  hero: {
    eyebrow: "Our story",
    title: "From the valleys of",
    highlight: "Gilgit-Baltistan",
    lead: "North Nectar brings the pure harvests of Hunza and Ghanche to homes across Pakistan. Herbs, roots, berries and fruits, gathered by hand and packed where they grow.",
    images: [images.about.heroBasket, images.about.heroFlatlay] as const,
  },
  intro: {
    eyebrow: "Who we are",
    quote:
      "We started North Nectar to bring the pure harvests of our mountains to every home in Pakistan, exactly as nature made them.",
    paragraphs: [
      "Families in Gilgit-Baltistan have gathered wild thyme, sea buckthorn, rare roots and apricots for generations. These are the foods and remedies of our valleys.",
      "We buy directly from them, pay fairly, and pack every batch at our unit on Khaplu Road. Nothing is added, and nothing is hidden on the label.",
    ],
  },
  sourcing: {
    /** Anchor used by the footer's "How we source" link. */
    id: "how-we-source",
    eyebrow: "How we source",
    title: "From valley to doorstep",
    steps: [
      {
        title: "Gathered by hand",
        text: "Local families harvest each plant in season, where it grows wild.",
        image: images.about.stepGathered,
        background: "#f3eadb",
      },
      {
        title: "Dried in mountain air",
        text: "Slow, natural drying keeps colour, aroma and goodness.",
        image: images.about.stepDried,
        background: "#ffffff",
      },
      {
        title: "Checked and selected",
        text: "Every batch is sorted by hand and graded before packing.",
        image: images.about.stepSelected,
        background: "#ffffff",
      },
      {
        title: "Packed at source",
        text: "Sealed on Khaplu Road and sent to your door across Pakistan.",
        image: images.about.stepPacked,
        background: "#d1ae6c",
      },
    ],
  },
  regions: {
    eyebrow: "Where it comes from",
    title: "Three valleys, one promise",
    items: [
      {
        name: "Hunza",
        text: "Terraced orchards and wild slopes above the Hunza river.",
        tags: ["Wild thyme", "Apricots", "Salab Misri"],
      },
      {
        name: "Ghanche and Khaplu",
        text: "Home to our packing unit and riverside sea buckthorn.",
        tags: ["Sea buckthorn", "Walnuts", "Packing unit"],
      },
      {
        name: "High Gilgit-Baltistan",
        text: "Rare harvests from the high mountains and forests.",
        tags: ["Shilajit", "Sanghuang", "Salab Panja"],
      },
    ],
  },
  values: {
    eyebrow: "What we stand for",
    title: "Our values",
    items: [
      {
        title: "Nothing added",
        text: "No sugar, colour or preservatives. Just the plant.",
        icon: images.icons.naturallyDriedGreen,
      },
      {
        title: "Fair to growers",
        text: "We buy directly from families and pay fairly.",
        icon: images.icons.himalayanSourcingGreen,
      },
      {
        title: "Small batches",
        text: "Packed in small runs so every pouch is fresh.",
        icon: images.icons.carefullySelectedGreen,
      },
      {
        title: "Honest labels",
        text: "Origin, batch and storage on every pack.",
        icon: images.brand.emblemGreen,
      },
    ],
  },
  cta: {
    title: "Taste the mountains",
    /** Filled in from the live settings (see aboutCtaText). */
    text: "",
    action: { label: "Shop the harvest", href: "/shop" },
  },
};

/** "Cash on delivery across Pakistan. Free delivery over Rs 10,000." from the live settings. */
export function aboutCtaText(settings: CommerceSettings): string {
  const f = deliveryFacts(settings);
  return [
    f.cod ? "Cash on delivery across Pakistan." : "Delivered across Pakistan.",
    f.freeOver !== null ? `Free delivery over ${formatPkr(f.freeOver)}.` : "",
  ]
    .filter(Boolean)
    .join(" ");
}
