import { cn } from "@northnectar/ui";
import Link from "next/link";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd, type BreadcrumbItem } from "@/lib/seo/json-ld";

/**
 * Visible breadcrumb trail plus matching BreadcrumbList structured data.
 * Pass the trail without "Home"; it is added automatically.
 */
export function Breadcrumbs({
  items,
  tone = "light",
  className,
}: {
  items: BreadcrumbItem[];
  tone?: "light" | "dark";
  className?: string;
}) {
  const trail: BreadcrumbItem[] = [{ name: "Home", path: "/" }, ...items];
  return (
    <>
      <nav aria-label="Breadcrumb" className={className}>
        <ol
          className={cn(
            "flex flex-wrap items-center gap-x-2 text-sm",
            tone === "dark" ? "text-sand-100" : "text-subtle",
          )}
        >
          {trail.map((item, index) => {
            const last = index === trail.length - 1;
            return (
              <li key={item.path} className="flex items-center gap-2">
                {index > 0 ? <span aria-hidden="true">/</span> : null}
                {last ? (
                  <span
                    aria-current="page"
                    className={cn("font-semibold", tone === "dark" ? "text-white" : "text-ink")}
                  >
                    {item.name}
                  </span>
                ) : (
                  <Link
                    href={item.path}
                    className="inline-flex min-h-11 items-center hover:underline"
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
