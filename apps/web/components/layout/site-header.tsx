import { CartButton } from "@/features/cart/cart-button";
import { getShopMenu } from "@/lib/navigation";
import { HeaderSearch } from "./header-search";
import { Logo } from "./logo";
import { MainNav } from "./main-nav";
import { MobileMenu } from "./mobile-menu";
import { TopBar } from "./top-bar";

/**
 * Site header (Server Component), sticky as a whole like the mockup.
 * Mobile: top bar 41px + 64px row (menu | logo | cart) + 58px search row.
 * Desktop: top bar 40px + 88px row (logo | nav | search + cart).
 * Between 1024px and 1279px the search moves to its own row so the main row never overflows.
 */
export async function SiteHeader() {
  const shopMenu = await getShopMenu();

  return (
    <header className="sticky top-0 z-30 border-b border-[#e8dfcc] bg-[#fbf8f1]">
      <TopBar />
      <div className="grid h-16 grid-cols-[1fr_auto_1fr] items-center px-2 lg:mx-auto lg:h-[88px] lg:max-w-site lg:gap-6 lg:px-8">
        <div className="justify-self-start lg:hidden">
          <MobileMenu shopMenu={shopMenu} />
        </div>
        <div className="lg:order-first lg:justify-self-start">
          <Logo />
        </div>
        <div className="hidden lg:block">
          <MainNav shopMenu={shopMenu} />
        </div>
        <div className="flex items-center gap-[10px] justify-self-end">
          <HeaderSearch id="search-desktop" className="hidden xl:block" />
          <div className="lg:hidden">
            <CartButton variant="mobile" />
          </div>
          <div className="hidden lg:block">
            <CartButton variant="desktop" />
          </div>
        </div>
      </div>
      <div className="px-4 pb-3 lg:mx-auto lg:max-w-site lg:px-8 xl:hidden">
        <HeaderSearch id="search-mobile" size="mobile" />
      </div>
    </header>
  );
}
