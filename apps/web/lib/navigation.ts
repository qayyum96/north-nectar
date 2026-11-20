import { getDefaultVariant } from "@northnectar/data/utils";
import { catalog } from "@/lib/catalog";
import type { CartSuggestion } from "@/features/cart/cart-suggestion";
import { categoryPath, productPath, type NavGroup, type NavLink } from "@/lib/routes";

/**
 * Server-only navigation built from the catalogue, so Shop entries appear and disappear with
 * active products and categories. Client components must import from "@/lib/routes" instead.
 */

const MAX_LINKS_PER_GROUP = 5;

/** One group per active category, listing its best-selling active products. */
export async function getShopMenu(): Promise<NavGroup[]> {
  const [categories, products] = await Promise.all([
    catalog.getCategories(),
    catalog.getProducts({ sort: "best-selling" }),
  ]);
  return categories.slice(0, 4).map((category) => ({
    title: category.name,
    href: categoryPath(category.slug),
    links: products
      .filter((p) => p.categoryId === category.id)
      .slice(0, MAX_LINKS_PER_GROUP)
      .map((p) => ({ label: p.name, href: productPath(p.slug) })),
  }));
}

export async function getFooterShopLinks(): Promise<NavLink[]> {
  const categories = await catalog.getCategories();
  return [
    ...categories.slice(0, 5).map((c) => ({ label: c.name, href: categoryPath(c.slug) })),
    { label: "All products", href: "/shop" },
  ];
}

/** Product shortcuts shown in the empty cart drawer. */
export async function getQuickLinks(limit = 4): Promise<NavLink[]> {
  const products = await catalog.getProducts({ sort: "best-selling", limit });
  return products.map((p) => ({ label: p.shortName ?? p.name, href: productPath(p.slug) }));
}

/**
 * "Pairs well" suggestions for the cart drawer: best sellers with their default size. The drawer
 * shows the first one that isn't already in the cart.
 */
export async function getCartSuggestions(limit = 4): Promise<CartSuggestion[]> {
  const products = await catalog.getProducts({ sort: "best-selling" });
  return products
    .filter((p) => p.purchaseMode === "retail")
    .flatMap((p) => {
      const variant = getDefaultVariant(p);
      if (!variant || variant.stock <= 0) return [];
      const image = p.images[0];
      return [
        {
          productId: p.id,
          variantId: variant.id,
          slug: p.slug,
          name: p.name,
          shortName: p.shortName ?? p.name,
          variantLabel: variant.label,
          price: variant.price,
          image: { src: image?.src ?? "", alt: image?.alt ?? p.name },
        },
      ];
    })
    .slice(0, limit);
}
