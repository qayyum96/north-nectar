import { Container, Eyebrow, buttonVariants } from "@northnectar/ui";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { HeaderSearch } from "@/components/layout/header-search";
import { StorefrontShell } from "@/components/layout/storefront-shell";
import { images } from "@/lib/images";

export const metadata: Metadata = {
  title: "Page not found",
  description: "The page you are looking for has moved or no longer exists.",
  // Next.js adds `noindex` to 404 responses automatically.
};

export default function NotFound() {
  return (
    <StorefrontShell newsletter="dark">
      <section
        aria-labelledby="not-found-title"
        className="relative overflow-hidden py-16 lg:py-28"
      >
        <Image
          src={images.decor.leaf2.src}
          width={images.decor.leaf2.width}
          height={images.decor.leaf2.height}
          alt=""
          className="pointer-events-none absolute top-10 -right-6 w-20 rotate-12 animate-leaf-float drop-shadow-xl lg:right-24 lg:w-32"
        />
        <Container className="relative max-w-3xl text-center">
          <Eyebrow>Error 404</Eyebrow>
          <h1 id="not-found-title" className="heading-display mt-4 text-display-xl">
            This trail leads nowhere
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-lg text-body">
            The page may have moved, or the link is out of date. Try a search, or head back to the
            harvest.
          </p>
          <HeaderSearch id="search-404" className="mx-auto mt-8 max-w-md" />
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/shop" className={buttonVariants({ size: "lg", display: true })}>
              Shop the harvest
            </Link>
            <Link href="/" className={buttonVariants({ variant: "secondary", size: "lg" })}>
              Back to home
            </Link>
          </div>
        </Container>
      </section>
    </StorefrontShell>
  );
}
