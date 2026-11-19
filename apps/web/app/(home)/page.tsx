import { Container, Eyebrow, buttonVariants } from "@northnectar/ui";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo/metadata";
import { siteConfig } from "@/lib/seo/config";

export const metadata = buildMetadata({
  title: siteConfig.titleDefault,
  absoluteTitle: true,
  description: siteConfig.description,
  path: "/",
});

/**
 * Phase 1 placeholder so the layout (header, footer, drawer, SEO) can be reviewed.
 * The full home page from the mockup is built in Phase 2 on top of the data layer.
 */
export default function HomePage() {
  return (
    <section aria-labelledby="home-title" className="py-16 lg:py-24">
      <Container>
        <Eyebrow>North Nectar · Himalayan botanicals &amp; natural ingredients</Eyebrow>
        <h1 id="home-title" className="heading-display mt-4 max-w-5xl text-display-2xl">
          Picked in the Himalayas for you.
        </h1>
        <p className="mt-6 max-w-xl text-xl text-body">
          Sea buckthorn, wild thyme tea and more from Gilgit-Baltistan. Gathered by hand, naturally
          dried and packed at source, then delivered to your door anywhere in Pakistan.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/shop"
            className={buttonVariants({ variant: "accent", size: "lg", display: true })}
          >
            Shop the harvest
          </Link>
          <Link
            href="/about"
            className={buttonVariants({ variant: "outline", size: "lg", display: true })}
          >
            Our story
          </Link>
        </div>
      </Container>
    </section>
  );
}
