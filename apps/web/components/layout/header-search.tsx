import { cn } from "@northnectar/ui";
import { SearchIcon } from "@northnectar/ui/icons";

/**
 * Product search. A plain GET form to /shop?q=..., so it works without JavaScript and matches
 * the SearchAction declared in the WebSite structured data.
 */
export function HeaderSearch({ id, className }: { id: string; className?: string }) {
  return (
    <form action="/shop" method="get" role="search" className={cn("relative", className)}>
      <label htmlFor={id} className="sr-only">
        Search products
      </label>
      <SearchIcon
        size={18}
        className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-subtle"
      />
      <input
        id={id}
        name="q"
        type="search"
        enterKeyHint="search"
        autoComplete="off"
        placeholder="Search herbs, dry fruits, shilajit"
        className="h-12 w-full rounded-full border border-field bg-white pr-4 pl-11 text-base text-ink placeholder:text-muted hover:border-sand-300 focus:border-forest-600"
      />
    </form>
  );
}
