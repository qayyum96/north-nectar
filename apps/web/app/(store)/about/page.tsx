import { AboutHero } from "@/components/sections/about/about-hero";
import {
  AboutCta,
  AboutIntro,
  OriginRegions,
  OurValues,
  SourcingSteps,
} from "@/components/sections/about/about-sections";
import { aboutContent } from "@/content/about";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata = buildMetadata({
  title: aboutContent.meta.title,
  description: aboutContent.meta.description,
  path: "/about",
});

/** Our story. Fully static. */
export default function AboutPage() {
  return (
    <>
      <AboutHero />
      <AboutIntro />
      <SourcingSteps />
      <OriginRegions />
      <OurValues />
      <AboutCta />
    </>
  );
}
