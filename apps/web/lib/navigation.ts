import { catalog } from "@/lib/catalog";
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
  return products.map((p) => ({ label: p.name, href: productPath(p.slug) }));
}
