import { Container, Eyebrow, buttonVariants } from "@northnectar/ui";
import Image from "next/image";
import { IntentLink as Link } from "@/components/ui/intent-link";
import { HeaderSearch } from "@/components/layout/header-search";
import { images } from "@/lib/images";

/** 404 body, shared by the root 404 (wrapped in the shell) and the store 404 (inside its layout). */
export function NotFoundContent() {
  return (
    <section aria-labelledby="not-found-title" className="relative overflow-hidden py-16 lg:py-28">
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
        <HeaderSearch id="search-404" size="mobile" className="mx-auto mt-8 max-w-md" />
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
  );
}
