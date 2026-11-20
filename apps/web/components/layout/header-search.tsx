import { cn } from "@northnectar/ui";
import { SearchIcon } from "@northnectar/ui/icons";

/**
 * Product search: a plain GET form to /shop?q=..., so it works without JavaScript and matches the
 * SearchAction in the WebSite structured data. Mockup: 44px pill (desktop), 46px (mobile).
 */
export function HeaderSearch({
  id,
  size = "desktop",
  className,
}: {
  id: string;
  size?: "desktop" | "mobile";
  className?: string;
}) {
  return (
    <form action="/shop" method="get" role="search" className={className}>
      <label
        htmlFor={id}
        className={cn(
          "flex items-center gap-[10px] rounded-full border border-[#ddd1b8] bg-white px-4 text-[#5e5a4e] focus-within:border-forest-600",
          size === "desktop" ? "h-11 w-60" : "h-[46px] w-full",
        )}
      >
        <span className="sr-only">Search products</span>
        <SearchIcon size={18} className="shrink-0" />
        <input
          id={id}
          name="q"
          type="search"
          enterKeyHint="search"
          autoComplete="off"
          placeholder="Search herbs, dry fruits, shilajit"
          className={cn(
            "min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-[#5e5a4e]",
            size === "desktop" ? "text-[15px]" : "text-[16px]",
          )}
        />
      </label>
    </form>
  );
}
