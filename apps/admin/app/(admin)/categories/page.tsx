import { cn } from "@northnectar/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink, EmptyState, PageBody, PageHeader } from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { loadCatalogue } from "@/lib/catalogue";
import { imageSrc, plural } from "@/lib/format";
import { ProductThumb } from "../products/products-table";
import { CategoryEditor } from "./category-editor";

export const metadata: Metadata = { title: "Categories" };

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; new?: string }>;
}) {
  await requireStaff(["owner", "manager"]);
  const sp = await searchParams;
  const { products, categories } = await loadCatalogue();
  const counts = new Map<string, number>();
  for (const p of products) counts.set(p.category_id, (counts.get(p.category_id) ?? 0) + 1);

  const creating = sp.new === "1" || categories.length === 0;
  const current = creating ? null : (categories.find((c) => c.id === sp.id) ?? categories[0]!);
  const newId = crypto.randomUUID();

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Catalogue" }, { label: "Categories" }]}
        title="Categories"
        subtitle={`${plural(categories.length, "category", "categories")} · ${plural(products.length, "product")}`}
        actions={
          <ButtonLink href="/categories?new=1" variant="primary" icon="plus">
            Add category
          </ButtonLink>
        }
      />
      <PageBody>
        <div className="flex flex-wrap items-start gap-4">
          <section className="border-admin-line min-w-0 flex-[1.2_1_420px] overflow-hidden rounded-[12px] border bg-white shadow-[0_1px_0_rgba(0,0,0,0.03)]">
            <div className="text-admin-label border-admin-line grid grid-cols-[1fr_90px] gap-[10px] border-b bg-[#f4f2ee] px-4 py-[13px] text-[14px] font-semibold tracking-[0.05em] uppercase">
              <span>Category</span>
              <span className="text-right">Products</span>
            </div>
            {categories.length === 0 ? (
              <div className="py-10">
                <EmptyState icon="categories" title="No categories yet">
                  Add your first category on the right.
                </EmptyState>
              </div>
            ) : (
              <ul className="m-0 list-none p-0">
                {categories.map((c) => {
                  const on = current?.id === c.id;
                  return (
                    <li key={c.id}>
                      <Link
                        href={`/categories?id=${c.id}`}
                        scroll={false}
                        aria-current={on ? "true" : undefined}
                        className={cn(
                          "grid grid-cols-[1fr_90px] items-center gap-[10px] border-b border-[#efefed] px-4 py-3",
                          on
                            ? "bg-[#f3f7f1] shadow-[inset_3px_0_0_#234c2e]"
                            : "bg-white hover:bg-[#fafaf9]",
                        )}
                      >
                        <span className="flex min-w-0 items-center gap-3">
                          <ProductThumb src={imageSrc(c.image?.src)} />
                          <span className="flex min-w-0 flex-col">
                            <span className="truncate font-semibold text-forest-600">
                              {c.name}
                              {c.status === "draft" ? (
                                <span className="text-admin-muted font-normal"> · hidden</span>
                              ) : null}
                            </span>
                            <span className="text-admin-muted truncate">/{c.slug}</span>
                          </span>
                        </span>
                        <span className="text-right">{counts.get(c.id) ?? 0}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
          <div className="min-w-0 flex-[1_1_360px]">
            <CategoryEditor
              key={current?.id ?? "new"}
              initial={
                current
                  ? {
                      id: current.id,
                      isNew: false,
                      name: current.name,
                      slug: current.slug,
                      description: current.description,
                      image: current.image?.src ? current.image : null,
                      metaTitle: current.seo?.title ?? "",
                      metaDescription: current.seo?.description ?? "",
                      products: counts.get(current.id) ?? 0,
                    }
                  : {
                      id: newId,
                      isNew: true,
                      name: "",
                      slug: "",
                      description: "",
                      image: null,
                      metaTitle: "",
                      metaDescription: "",
                      products: 0,
                    }
              }
            />
          </div>
        </div>
      </PageBody>
    </>
  );
}
