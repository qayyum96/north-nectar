import { cn } from "@northnectar/ui";
import Link from "next/link";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd, type BreadcrumbItem } from "@/lib/seo/json-ld";

/**
 * Breadcrumb trail (mockup: 14px, #6a665a, current page #1f2a21 semibold, "/" separators 6px
 * apart on product pages, 4px elsewhere) plus matching BreadcrumbList structured data. Pass the trail without "Home".
 */
export function Breadcrumbs({
  items,
  tone = "light",
  spacing = "tight",
  className,
}: {
  items: BreadcrumbItem[];
  tone?: "light" | "dark";
  /** Gap around the "/" separators: 4px (listing and inner pages) or 6px (product pages). */
  spacing?: "tight" | "loose";
  className?: string;
}) {
  const trail: BreadcrumbItem[] = [{ name: "Home", path: "/" }, ...items];
  const dark = tone === "dark";
  return (
    <>
      <nav aria-label="Breadcrumb" className={className}>
        <ol
          className={cn(
            "m-0 flex list-none flex-wrap p-0 text-[14px] leading-[21px]",
            spacing === "loose" ? "gap-[6px]" : "gap-1",
            dark ? "text-[#b9c4b5]" : "text-[#6a665a]",
          )}
        >
          {trail.map((item, index) => {
            const last = index === trail.length - 1;
            return (
              <li
                key={item.path}
                className={cn("inline-flex", spacing === "loose" ? "gap-[6px]" : "gap-1")}
              >
                {index > 0 ? <span aria-hidden="true">/</span> : null}
                {last ? (
                  <span
                    aria-current="page"
                    className={cn("font-semibold", dark ? "text-white" : "text-ink")}
                  >
                    {item.name}
                  </span>
                ) : (
                  <Link
                    href={item.path}
                    className="relative before:absolute before:inset-x-0 before:-inset-y-3 before:content-[''] hover:underline"
                  >
                    {item.name}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      <JsonLd data={breadcrumbJsonLd(trail)} />
    </>
  );
}
