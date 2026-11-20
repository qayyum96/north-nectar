import type { Category, Product } from "@northnectar/types";
import { cn } from "@northnectar/ui";
import { ProductCard } from "./product-card";

/** Responsive product grid: 2 columns on phones, 3 on tablets, 4 on desktop (configurable). */
export function ProductGrid({
  products,
  categories,
  columns = 4,
  className,
}: {
  products: Product[];
  /** Used to label each card with its category name. */
  categories: Pick<Category, "id" | "name">[];
  columns?: 3 | 4;
  className?: string;
}) {
  const nameOf = (id: string) => categories.find((c) => c.id === id)?.name;
  return (
    <ul
      data-rv="rise"
      className={cn(
        "grid grid-cols-2 gap-x-3 gap-y-4 md:grid-cols-3 md:gap-x-6 md:gap-y-7",
        columns === 4 && "lg:grid-cols-4",
        className,
      )}
    >
      {products.map((product) => (
        <li key={product.id}>
          <ProductCard product={product} categoryName={nameOf(product.categoryId)} />
        </li>
      ))}
    </ul>
  );
}
