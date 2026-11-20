import { ChatIcon } from "@northnectar/ui/icons";
import Link from "next/link";
import { topBar, topBarPromos } from "@/content/site";
import { getCommerceSettings } from "@/lib/commerce/settings";
import { siteConfig } from "@/lib/seo/config";

/** Dark promo bar. Mockup: 40px desktop (3-column grid), 41px mobile (single centred line). */
export async function TopBar() {
  const promo = topBarPromos(await getCommerceSettings());
  return (
    <div className="on-dark bg-[#1a3a23] text-[14px] text-[#efe2c4]">
      <p className="px-4 py-[10px] text-center leading-[21px] lg:hidden">{promo.mobile}</p>
      <div className="mx-auto hidden h-10 max-w-site grid-cols-[1fr_auto_1fr] items-center gap-6 px-8 lg:grid">
        <a
          href={siteConfig.contact.whatsappUrl}
          className="inline-flex items-center gap-2 justify-self-start hover:underline"
        >
          <ChatIcon size={16} />
          {topBar.contact}
        </a>
        <p className="inline-flex items-center gap-[14px]">
          {promo.promos.map((text, i) => (
            <span key={text} className="inline-flex items-center gap-[14px]">
              {i > 0 ? (
                <span aria-hidden="true" className="text-[#a9915e]">
                  ◆
                </span>
              ) : null}
              {text}
            </span>
          ))}
        </p>
        <Link href={topBar.wholesale.href} className="justify-self-end hover:underline">
          {topBar.wholesale.label}
        </Link>
      </div>
    </div>
  );
}
