import { ChatIcon, FacebookIcon, InstagramIcon, TikTokIcon } from "@northnectar/ui/icons";
import Image from "next/image";
import { IntentLink as Link } from "@/components/ui/intent-link";
import type { ComponentType } from "react";
import { footerCopy } from "@/content/site";
import { getCommerceSettings } from "@/lib/commerce/settings";
import { paymentBadges } from "@/lib/constants/commerce";
import { images } from "@/lib/images";
import { getFooterShopLinks } from "@/lib/navigation";
import { footerCompanyLinks, footerHelpLinks, footerLegalLinks, type NavLink } from "@/lib/routes";
import { activeSocialLinks, siteConfig, type SocialId } from "@/lib/seo/config";
import { NewsletterBand } from "./newsletter-band";

const socialIcons: Record<SocialId, ComponentType<{ size?: number }>> = {
  instagram: InstagramIcon,
  facebook: FacebookIcon,
  tiktok: TikTokIcon,
  whatsapp: ChatIcon,
};

/** Footer link: 15px text, 12px apart (mockup); the ::before widens the tap area without overlap. */
const footerLink =
  "relative inline-block self-start text-[15px] leading-[23px] text-[#e6dcc6] before:absolute before:-inset-y-[6px] before:inset-x-0 before:content-[''] hover:text-white hover:underline";

const columnTitle =
  "m-0 font-display text-[15px] leading-[23px] font-bold tracking-[0.06em] text-[#d1ae6c] uppercase";

function FooterColumn({ title, links }: { title: string; links: NavLink[] }) {
  return (
    <nav aria-label={title} className="flex flex-col gap-3">
      <h2 className={columnTitle}>{title}</h2>
      <ul className="m-0 flex list-none flex-col gap-3 p-0">
        {links.map((link) => (
          <li key={link.label} className="flex">
            <Link href={link.href} className={footerLink}>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Site footer, mockup values (mobile base, `md:` desktop). */
export async function SiteFooter({ newsletter }: { newsletter: "light" | "dark" | "none" }) {
  const [shopLinks, settings] = await Promise.all([getFooterShopLinks(), getCommerceSettings()]);
  const socialLinks = activeSocialLinks();
  const { logoStackedCream } = images.brand;
  const year = new Date().getFullYear();

  return (
    <footer className="on-dark">
      {newsletter !== "none" ? <NewsletterBand tone={newsletter} /> : null}
      <div className="relative overflow-hidden bg-[#1a3a23] text-[#efe2c4]">
        <Image
          src={images.decor.mountainsCream.src}
          width={images.decor.mountainsCream.width}
          height={images.decor.mountainsCream.height}
          alt=""
          unoptimized
          aria-hidden="true"
          className="pointer-events-none absolute -right-[120px] -bottom-[10px] h-auto w-[520px] max-w-none opacity-[0.08] md:right-0 md:w-[760px]"
        />
        <div className="relative mx-auto flex max-w-site flex-col gap-12 px-5 pt-12 pb-8 md:px-8 md:pt-16">
          <div className="grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-[1.6fr_repeat(4,minmax(0,1fr))]">
            <div className="col-span-full flex flex-col gap-[18px] md:col-span-1">
              <Link
                href="/"
                aria-label={`${siteConfig.name}, home`}
                className="self-start rounded-lg"
              >
                <Image
                  src={logoStackedCream.src}
                  width={logoStackedCream.width}
                  height={logoStackedCream.height}
                  alt=""
                  unoptimized
                  className="block h-auto w-[200px]"
                />
              </Link>
              <p className="m-0 max-w-[300px] text-[15px] leading-[1.6] text-[#cdbf9f]">
                {footerCopy.blurb}
              </p>
              {socialLinks.length > 0 ? (
                <ul
                  className="m-0 flex list-none gap-2 p-0"
                  aria-label="North Nectar on social media"
                >
                  {socialLinks.map((social) => {
                    const Icon = socialIcons[social.id];
                    return (
                      <li key={social.id}>
                        <a
                          href={social.href}
                          aria-label={`North Nectar on ${social.label}`}
                          className="inline-flex size-11 items-center justify-center rounded-full border border-[#3c6146] text-[#efe2c4] hover:border-[#d1ae6c] hover:text-[#d1ae6c]"
                        >
                          <Icon size={18} />
                        </a>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </div>

            <FooterColumn title="Shop" links={shopLinks} />
            <FooterColumn title="Help" links={footerHelpLinks} />
            <FooterColumn title="Company" links={footerCompanyLinks} />

            <div className="flex flex-col gap-3">
              <h2 className={columnTitle}>Get in touch</h2>
              <address className="flex flex-col gap-3 not-italic">
                <a href={`tel:${siteConfig.contact.phoneE164}`} className={footerLink}>
                  {siteConfig.contact.phoneDisplay}
                </a>
                <a href={`mailto:${siteConfig.contact.email}`} className={footerLink}>
                  {siteConfig.contact.email}
                </a>
                <span className="text-[15px] leading-[1.55] text-[#e6dcc6]">
                  {siteConfig.address.display}
                </span>
              </address>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#2f5238] pt-6">
            <p className="m-0 text-[14px] leading-[21px] text-[#b7a987]">
              {footerCopy.copyright(year)}
              {footerLegalLinks.map((link) => (
                <span key={link.href}>
                  {" · "}
                  <Link
                    href={link.href}
                    className="relative before:absolute before:inset-x-0 before:-inset-y-3 before:content-[''] hover:text-[#efe2c4] hover:underline"
                  >
                    {link.label}
                  </Link>
                </span>
              ))}
            </p>
            <ul className="m-0 flex list-none flex-wrap gap-2 p-0" aria-label="Payment methods">
              {paymentBadges(settings).map((badge) => (
                <li
                  key={badge}
                  className="rounded-[6px] bg-[#efe2c4] px-[10px] py-1 text-[14px] leading-[21px] font-semibold text-ink"
                >
                  {badge}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
