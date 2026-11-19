import { ChatIcon } from "@northnectar/ui/icons";
import Link from "next/link";
import { topBar } from "@/content/site";
import { siteConfig } from "@/lib/seo/config";

export function TopBar() {
  return (
    <div className="on-dark bg-forest-800 text-sand-100">
      <div className="mx-auto flex min-h-10 max-w-site items-center justify-center px-4 py-2 text-sm sm:px-6 lg:min-h-11 lg:justify-between lg:px-8 lg:py-0">
        <p className="text-center lg:hidden">{topBar.mobile}</p>

        <a
          href={siteConfig.contact.whatsappUrl}
          className="hidden min-h-11 items-center gap-2 hover:underline lg:inline-flex"
        >
          <ChatIcon size={16} />
          {topBar.contact}
        </a>
        <p className="hidden items-center gap-4 lg:flex">
          {topBar.promos.map((promo, i) => (
            <span key={promo} className="flex items-center gap-4">
              {i > 0 ? (
                <span aria-hidden="true" className="size-1.5 rotate-45 bg-gold-400" />
              ) : null}
              {promo}
            </span>
          ))}
        </p>
        <Link
          href={topBar.wholesale.href}
          className="hidden min-h-11 items-center hover:underline lg:inline-flex"
        >
          {topBar.wholesale.label}
        </Link>
      </div>
    </div>
  );
}
