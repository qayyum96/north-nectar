import { ChatIcon, FacebookIcon, InstagramIcon, TikTokIcon } from "@northnectar/ui/icons";
import Image from "next/image";
import Link from "next/link";
import type { ComponentType } from "react";
import { footerCopy } from "@/content/site";
import { paymentBadges } from "@/lib/constants/commerce";
import { images } from "@/lib/images";
import {
  footerCompanyLinks,
  footerHelpLinks,
  getFooterShopLinks,
  type NavLink,
} from "@/lib/navigation";
import { siteConfig, type SocialId } from "@/lib/seo/config";
import { NewsletterBand } from "./newsletter-band";

const socialIcons: Record<SocialId, ComponentType<{ size?: number }>> = {
  instagram: InstagramIcon,
  facebook: FacebookIcon,
  tiktok: TikTokIcon,
  whatsapp: ChatIcon,
};

function FooterColumn({ title, links }: { title: string; links: NavLink[] }) {
  return (
    <div>
      <h2 className="font-display text-lg font-semibold tracking-wide text-gold-400 uppercase">
        {title}
      </h2>
      <ul className="mt-3">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="inline-flex min-h-11 min-w-11 items-center text-md text-sand-100 hover:text-white hover:underline"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export async function SiteFooter({ newsletter }: { newsletter: "light" | "dark" | "none" }) {
  const shopLinks = await getFooterShopLinks();
  const { logoStackedCream } = images.brand;
  const year = new Date().getFullYear();

  return (
    <footer className="on-dark">
      {newsletter !== "none" ? <NewsletterBand tone={newsletter} /> : null}
      <div className="relative overflow-hidden bg-forest-800 text-kraft">
        <Image
          src={images.decor.mountainsCream.src}
          width={images.decor.mountainsCream.width}
          height={images.decor.mountainsCream.height}
          alt=""
          unoptimized
          className="pointer-events-none absolute -right-28 bottom-0 w-[32rem] max-w-none opacity-[0.12] lg:right-0 lg:w-[47rem]"
        />
        <div className="relative mx-auto max-w-site px-4 pt-12 pb-8 sm:px-6 lg:px-8 lg:pt-16">
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-[1.6fr_repeat(4,minmax(0,1fr))]">
            <div className="col-span-2 lg:col-span-1">
              <Link
                href="/"
                aria-label={`${siteConfig.name}, home`}
                className="inline-block rounded-lg"
              >
                <Image
                  src={logoStackedCream.src}
                  width={logoStackedCream.width}
                  height={logoStackedCream.height}
                  alt=""
                  unoptimized
                  className="h-auto w-48"
                />
              </Link>
              <p className="mt-5 max-w-xs text-md leading-relaxed">{footerCopy.blurb}</p>
              <ul className="mt-6 flex gap-2.5" aria-label="North Nectar on social media">
                {siteConfig.social.map((social) => {
                  const Icon = socialIcons[social.id];
                  return (
                    <li key={social.id}>
                      <a
                        href={social.href}
                        aria-label={social.label}
                        className="grid size-12 place-items-center rounded-full border border-white/20 text-sand-100 transition-colors hover:border-gold-400 hover:text-gold-400"
                      >
                        <Icon size={18} />
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>

            <FooterColumn title="Shop" links={shopLinks} />
            <FooterColumn title="Help" links={footerHelpLinks} />
            <FooterColumn title="Company" links={footerCompanyLinks} />

            <div className="col-span-2 sm:col-span-1">
              <h2 className="font-display text-lg font-semibold tracking-wide text-gold-400 uppercase">
                Get in touch
              </h2>
              <address className="mt-3 text-md text-sand-100 not-italic">
                <a
                  href={`tel:${siteConfig.contact.phoneE164}`}
                  className="flex min-h-11 items-center hover:text-white hover:underline"
                >
                  {siteConfig.contact.phoneDisplay}
                </a>
                <a
                  href={`mailto:${siteConfig.contact.email}`}
                  className="flex min-h-11 items-center hover:text-white hover:underline"
                >
                  {siteConfig.contact.email}
                </a>
                <p className="mt-2 max-w-60 leading-relaxed">{siteConfig.address.display}</p>
              </address>
            </div>
          </div>

          <div className="mt-12 flex flex-col gap-5 border-t border-white/10 pt-6 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-sm text-kraft/90">{footerCopy.copyright(year)}</p>
            <ul className="flex flex-wrap gap-2" aria-label="Payment options">
              {paymentBadges().map((badge) => (
                <li
                  key={badge}
                  className="rounded-md bg-kraft px-2.5 py-1 text-sm font-semibold text-forest-950"
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
