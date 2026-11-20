import type { Metadata, Viewport } from "next";
import { Figtree, Oswald } from "next/font/google";
import type { ReactNode } from "react";
import { JsonLd } from "@/components/seo/json-ld";
import { CartDrawerLazy } from "@/features/cart/cart-drawer-lazy";
import { CartProvider } from "@/features/cart/cart-provider";
import { getVariantCatalog } from "@/lib/commerce/get-variant-catalog";
import { isIndexable } from "@/lib/env";
import { getCartSuggestions, getQuickLinks } from "@/lib/navigation";
import { siteConfig } from "@/lib/seo/config";
import { graphJsonLd, organizationJsonLd, websiteJsonLd } from "@/lib/seo/json-ld";
import "./globals.css";

// Self-hosted at build time by next/font: no request to Google, and size-adjusted fallbacks
// prevent layout shift while the fonts load.
const figtree = Figtree({ subsets: ["latin"], variable: "--font-figtree", display: "swap" });
const oswald = Oswald({ subsets: ["latin"], variable: "--font-oswald", display: "swap" });

/*
 * Site-wide metadata defaults. There is deliberately NO canonical here: a root canonical would
 * be inherited by pages that forget their own. Every page sets one via buildMetadata().
 */
export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: siteConfig.titleDefault, template: siteConfig.titleTemplate },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: [...siteConfig.keywords],
  authors: [{ name: siteConfig.name, url: siteConfig.url }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  category: "shopping",
  formatDetection: { telephone: false, email: false, address: false },
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    locale: siteConfig.ogLocale,
    title: siteConfig.titleDefault,
    description: siteConfig.description,
    url: siteConfig.url,
    images: [siteConfig.defaultOgImage],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.titleDefault,
    description: siteConfig.description,
    images: [siteConfig.defaultOgImage.url],
  },
  robots: isIndexable
    ? {
        index: true,
        follow: true,
        googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
      }
    : { index: false, follow: false },
};

/**
 * Every page embeds live catalogue prices for the cart (CartProvider), so all pages refresh hourly
 * like the catalogue pages do. The order Server Action re-prices from the data layer regardless.
 */
export const revalidate = 3600;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1a3a23",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const [quickLinks, suggestions, variantCatalog] = await Promise.all([
    getQuickLinks(),
    getCartSuggestions(),
    getVariantCatalog(),
  ]);

  return (
    <html lang={siteConfig.locale} className={`${figtree.variable} ${oswald.variable}`}>
      <body>
        {children}
        <CartDrawerLazy quickLinks={quickLinks} suggestions={suggestions} />
        <CartProvider catalog={variantCatalog} />
        <JsonLd data={graphJsonLd(organizationJsonLd(), websiteJsonLd())} />
      </body>
    </html>
  );
}
