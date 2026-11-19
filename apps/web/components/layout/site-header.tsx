import { CartButton } from "@/features/cart/cart-button";
import { getShopMenu } from "@/lib/navigation";
import { HeaderSearch } from "./header-search";
import { Logo } from "./logo";
import { MainNav } from "./main-nav";
import { MobileMenu } from "./mobile-menu";
import { TopBar } from "./top-bar";

/**
 * Site header (Server Component). Client JavaScript is limited to the nav (active state and
 * Shop panel), the mobile menu and the cart button.
 * The top bar scrolls away; the main row stays sticky.
 */
export async function SiteHeader() {
  const shopMenu = await getShopMenu();

  return (
    <>
      <TopBar />
      <header className="sticky top-0 z-40 border-b border-line bg-cream/95 backdrop-blur supports-[backdrop-filter]:bg-cream/85">
        <div className="mx-auto grid h-16 max-w-site grid-cols-[auto_1fr_auto] items-center gap-2 px-4 sm:px-6 lg:h-[5.5rem] lg:grid-cols-[auto_1fr_auto] lg:gap-6 lg:px-8">
          {/* Mobile: menu | logo | cart. Desktop: logo | nav | search + cart. */}
          <div className="flex items-center lg:contents">
            <MobileMenu shopMenu={shopMenu} />
          </div>
          <div className="flex justify-center lg:order-first lg:justify-start">
            <Logo />
          </div>
          <div className="hidden justify-center lg:flex">
            <MainNav shopMenu={shopMenu} />
          </div>
          <div className="flex items-center justify-end gap-3">
            <HeaderSearch id="search-desktop" className="hidden w-60 xl:block" />
            <div className="lg:hidden">
              <CartButton variant="mobile" />
            </div>
            <div className="hidden lg:block">
              <CartButton variant="desktop" />
            </div>
          </div>
        </div>
      </header>
      <div className="border-b border-line bg-cream px-4 py-3 sm:px-6 lg:px-8 xl:hidden">
        <HeaderSearch id="search-mobile" className="mx-auto max-w-site" />
      </div>
    </>
  );
}
