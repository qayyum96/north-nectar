import { CartButton } from "@/features/cart/cart-button";
import { getShopMenu } from "@/lib/navigation";
import { HeaderSearch } from "./header-search";
import { Logo } from "./logo";
import { MainNav } from "./main-nav";
import { MobileSearch } from "./mobile-search";
import { MobileTabBar } from "./mobile-tab-bar";
import { TopBar } from "./top-bar";

/**
 * Site header (Server Component), sticky as a whole.
 * Phones and tablets (below lg): top bar + 64px row (logo | search icon, cart) and an app-style
 * bottom tab bar (Home, Shop, Wishlist, Menu). Tapping search opens the field under the header.
 * Desktop: top bar 40px + 88px row (logo | nav | search + cart), as in the mockup.
 * Between 1024px and 1279px the search moves to its own row so the main row never overflows.
 */
export async function SiteHeader() {
  const shopMenu = await getShopMenu();

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-[#e8dfcc] bg-[#fbf8f1]">
        <TopBar />
        <div className="relative grid h-16 grid-cols-[1fr_auto] items-center gap-2 pr-2 pl-4 lg:mx-auto lg:h-[88px] lg:max-w-site lg:grid-cols-[1fr_auto_1fr] lg:gap-6 lg:px-8">
          <div className="justify-self-start">
            <Logo />
          </div>
          <div className="hidden lg:block">
            <MainNav shopMenu={shopMenu} />
          </div>
          <div className="flex items-center gap-1 justify-self-end lg:gap-[10px]">
            <HeaderSearch id="search-desktop" className="hidden xl:block" />
            <div className="flex items-center gap-1 lg:hidden">
              <MobileSearch />
              <CartButton variant="mobile" />
            </div>
            <div className="hidden lg:block">
              <CartButton variant="desktop" />
            </div>
          </div>
        </div>
        <div className="hidden px-8 pb-3 lg:mx-auto lg:block lg:max-w-site xl:hidden">
          <HeaderSearch id="search-tablet" size="mobile" />
        </div>
      </header>
      <MobileTabBar shopMenu={shopMenu} />
    </>
  );
}
