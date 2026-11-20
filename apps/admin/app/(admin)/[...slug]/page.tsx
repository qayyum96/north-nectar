import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Icon } from "@/components/icon";
import { ButtonLink, Card, PageBody, PageHeader } from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { findNavItem } from "@/lib/nav";

const PHASE_NAMES: Record<number, string> = {
  2: "Phase 2: orders, customers and messages",
  3: "Phase 3: products and categories",
  4: "Phase 4: stock, purchases and suppliers",
  5: "Phase 5: reports and settings",
};

type Props = { params: Promise<{ slug: string[] }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return { title: findNavItem(`/${slug.join("/")}`)?.item.label ?? "Not found" };
}

/**
 * Sections that later phases build. Each sidebar link lands somewhere honest instead of a 404
 * while the admin is being built; the real page replaces this one as each phase ships.
 */
export default async function UpcomingSection({ params }: Props) {
  const staff = await requireStaff();
  const { slug } = await params;
  const match = findNavItem(`/${slug.join("/")}`);
  if (!match) notFound();
  const { item, group } = match;
  if (item.roles && !item.roles.includes(staff.role)) {
    return (
      <>
        <PageHeader
          crumbs={[{ label: group ?? "Admin" }, { label: item.label }]}
          title={item.label}
        />
        <PageBody>
          <Card>
            <p className="m-0">
              Your role doesn&apos;t include {item.label.toLowerCase()}. Ask the store owner if you
              need it.
            </p>
          </Card>
        </PageBody>
      </>
    );
  }

  return (
    <>
      <PageHeader
        crumbs={[{ label: group ?? "Admin" }, { label: item.label }]}
        title={item.label}
      />
      <PageBody>
        <Card className="flex flex-col items-center gap-3 py-12 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-[#eef3ec] text-forest-600">
            <Icon name={item.icon} size={22} />
          </span>
          <h2 className="m-0 text-[17px] font-bold">{item.label} is on its way</h2>
          <p className="text-admin-muted m-0 max-w-[460px]">
            This screen is built in {PHASE_NAMES[item.phase] ?? `Phase ${item.phase}`}. Everything
            already saved, such as orders and messages from the website, will be here when it
            arrives.
          </p>
          <ButtonLink href="/">Back to dashboard</ButtonLink>
        </Card>
      </PageBody>
    </>
  );
}
