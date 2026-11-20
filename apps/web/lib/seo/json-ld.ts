import type { Category, Product, ProductVariant } from "@northnectar/types";
import { plainText } from "@northnectar/ui";
import type {
  BreadcrumbList,
  FAQPage,
  ItemAvailability,
  LocalBusiness,
  MerchantReturnPolicy,
  Offer,
  OfferShippingDetails,
  Organization,
  Product as ProductSchema,
  ProductGroup,
  SearchAction,
  WebSite,
  WithContext,
} from "schema-dts";
import { commerceConfig } from "@/lib/constants/commerce";
import { productPath } from "@/lib/routes";
import { absoluteUrl, activeSocialLinks, siteConfig } from "./config";

/*
 * Structured data builders. Each returns a plain schema.org object; render it with <JsonLd />.
 * Builders take domain types (Product, Category) so they keep working when the data source
 * moves to Supabase.
 */

const ORG_ID = `${siteConfig.url}/#organization`;
const WEBSITE_ID = `${siteConfig.url}/#website`;
const LOCAL_BUSINESS_ID = `${siteConfig.url}/#localbusiness`;

function postalAddress() {
  return {
    "@type": "PostalAddress" as const,
    streetAddress: siteConfig.address.street,
    addressLocality: siteConfig.address.locality,
    addressRegion: siteConfig.address.region,
    addressCountry: siteConfig.address.country,
  };
}

export function organizationJsonLd(): WithContext<Organization> {
  // Only real profile pages belong in sameAs (not the WhatsApp chat link).
  const sameAs = activeSocialLinks()
    .filter((s) => s.id !== "whatsapp")
    .map((s) => s.href);
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORG_ID,
    name: siteConfig.name,
    legalName: siteConfig.legalName,
    url: siteConfig.url,
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl(siteConfig.logo.src),
      width: `${siteConfig.logo.width}`,
      height: `${siteConfig.logo.height}`,
    },
    description: siteConfig.description,
    email: siteConfig.contact.email,
    telephone: siteConfig.contact.phoneE164,
    address: postalAddress(),
    areaServed: { "@type": "Country", name: "Pakistan" },
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer service",
        telephone: siteConfig.contact.phoneE164,
        email: siteConfig.contact.email,
        areaServed: "PK",
        availableLanguage: ["English", "Urdu"],
      },
    ],
    ...(sameAs.length ? { sameAs } : {}),
  };
}

export function websiteJsonLd(): WithContext<WebSite> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: siteConfig.name,
    url: siteConfig.url,
    inLanguage: siteConfig.locale,
    publisher: { "@id": ORG_ID },
    potentialAction: searchAction,
  };
}

// "query-input" is required by Google for the sitelinks search box but is missing from schema-dts.
const searchAction = {
  "@type": "SearchAction",
  target: {
    "@type": "EntryPoint",
    urlTemplate: `${absoluteUrl("/shop")}?q={search_term_string}`,
  },
  "query-input": "required name=search_term_string",
} as SearchAction;

/** For the contact page: the packing unit in Khaplu, with opening hours. */
export function localBusinessJsonLd(): WithContext<LocalBusiness> {
  const { openingHours } = siteConfig.contact;
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": LOCAL_BUSINESS_ID,
    name: siteConfig.name,
    url: siteConfig.url,
    image: absoluteUrl(siteConfig.logo.src),
    telephone: siteConfig.contact.phoneE164,
    email: siteConfig.contact.email,
    address: postalAddress(),
    parentOrganization: { "@id": ORG_ID },
    currenciesAccepted: siteConfig.currency,
    paymentAccepted: commerceConfig.paymentMethods
      .filter((m) => m.status === "enabled")
      .map((m) => m.label)
      .join(", "),
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [...openingHours.days],
        opens: openingHours.opens,
        closes: openingHours.closes,
      },
    ],
  };
}

export interface BreadcrumbItem {
  name: string;
  /** Site-relative path. */
  path: string;
}

export function breadcrumbJsonLd(items: BreadcrumbItem[]): WithContext<BreadcrumbList> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function faqJsonLd(faqs: { question: string; answer: string }[]): WithContext<FAQPage> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
}

function availability(variant: ProductVariant): ItemAvailability {
  if (variant.stock <= 0) return "https://schema.org/OutOfStock";
  if (variant.stock <= commerceConfig.lowStockThreshold)
    return "https://schema.org/LimitedAvailability";
  return "https://schema.org/InStock";
}

/** Standard rate and transit days for Google; from Settings > Shipping when given. */
export interface ShippingFacts {
  rate: number;
  transitDays: readonly [number, number];
}

function shippingDetails(facts?: ShippingFacts): OfferShippingDetails {
  const { handlingDays } = commerceConfig.structuredData;
  const standardDeliveryFee = facts?.rate ?? commerceConfig.structuredData.standardDeliveryFee;
  const transitDays = facts?.transitDays ?? commerceConfig.structuredData.transitDays;
  return {
    "@type": "OfferShippingDetails",
    shippingRate: {
      "@type": "MonetaryAmount",
      value: standardDeliveryFee,
      currency: siteConfig.currency,
    },
    shippingDestination: { "@type": "DefinedRegion", addressCountry: siteConfig.country },
    deliveryTime: {
      "@type": "ShippingDeliveryTime",
      handlingTime: {
        "@type": "QuantitativeValue",
        minValue: handlingDays[0],
        maxValue: handlingDays[1],
        unitCode: "DAY",
      },
      transitTime: {
        "@type": "QuantitativeValue",
        minValue: transitDays[0],
        maxValue: transitDays[1],
        unitCode: "DAY",
      },
    },
  };
}

function returnPolicy(): MerchantReturnPolicy {
  return {
    "@type": "MerchantReturnPolicy",
    applicableCountry: siteConfig.country,
    returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
    merchantReturnDays: commerceConfig.structuredData.returnDays,
    returnMethod: "https://schema.org/ReturnByMail",
  };
}

function variantOffer(product: Product, variant: ProductVariant, shipping?: ShippingFacts): Offer {
  return {
    "@type": "Offer",
    url: absoluteUrl(productPath(product.slug, variant.label)),
    sku: variant.sku,
    price: variant.price,
    priceCurrency: siteConfig.currency,
    availability: availability(variant),
    itemCondition: "https://schema.org/NewCondition",
    seller: { "@id": ORG_ID },
    shippingDetails: shippingDetails(shipping),
    hasMerchantReturnPolicy: returnPolicy(),
  };
}

/**
 * Product structured data.
 * - One variant: a Product with a single Offer.
 * - Several sizes: a ProductGroup (variesBy size) with one Product + Offer per variant, which is
 *   Google's recommended pattern for size variants.
 * - Quote-only (bulk) products: a Product without offers, because there is no public price.
 *
 * No aggregateRating is emitted until real, verifiable reviews exist.
 */
export function productJsonLd(
  product: Product,
  category?: Pick<Category, "name"> | null,
  shipping?: ShippingFacts,
): WithContext<ProductSchema> | WithContext<ProductGroup> {
  const url = absoluteUrl(productPath(product.slug));
  const imagesAbs = product.images.map((img) => absoluteUrl(img.src));
  const description = product.description[0] ? plainText(product.description[0]) : product.tagline;
  const shared = {
    name: product.name,
    description,
    image: imagesAbs,
    brand: { "@type": "Brand" as const, name: siteConfig.name },
    ...(category ? { category: category.name } : {}),
    countryOfOrigin: { "@type": "Country" as const, name: "Pakistan" },
  };

  if (product.purchaseMode === "quote" || product.variants.length === 0) {
    return {
      "@context": "https://schema.org",
      "@type": "Product",
      "@id": `${url}#product`,
      url,
      ...shared,
    };
  }

  if (product.variants.length === 1) {
    const variant = product.variants[0]!;
    return {
      "@context": "https://schema.org",
      "@type": "Product",
      "@id": `${url}#product`,
      url,
      sku: variant.sku,
      ...shared,
      offers: variantOffer(product, variant, shipping),
    };
  }

  return {
    "@context": "https://schema.org",
    "@type": "ProductGroup",
    "@id": `${url}#product`,
    url,
    productGroupID: product.id,
    ...shared,
    variesBy: "https://schema.org/size",
    hasVariant: product.variants.map((variant): ProductSchema => ({
      "@type": "Product",
      sku: variant.sku,
      name: `${product.name}, ${variant.label}`,
      size: variant.label,
      image: imagesAbs[0],
      offers: variantOffer(product, variant, shipping),
    })),
  };
}

/** Combines several top-level entities into one @graph script. */
export function graphJsonLd(...nodes: object[]) {
  return {
    "@context": "https://schema.org",
    "@graph": nodes.map((node) => {
      const { "@context": _ctx, ...rest } = node as Record<string, unknown>;
      return rest;
    }),
  };
}
