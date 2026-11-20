import { Suspense } from "react";
import { JsonLd } from "@/components/seo/json-ld";
import {
  ContactFaq,
  ContactHero,
  ContactMain,
} from "@/components/sections/contact/contact-sections";
import { contactContent } from "@/content/contact";
import { ContactForm, ContactFormFallback } from "@/features/contact/contact-form";
import { catalog } from "@/lib/catalog";
import { faqJsonLd, localBusinessJsonLd } from "@/lib/seo/json-ld";
import { buildMetadata } from "@/lib/seo/metadata";

/** Static with hourly ISR (the product list for wholesale prefill comes from the catalogue). */
export const revalidate = 3600;

export const metadata = buildMetadata({
  title: contactContent.meta.title,
  description: contactContent.meta.description,
  path: "/contact",
});

export default async function ContactPage() {
  const products = (await catalog.getProducts()).map((p) => ({ slug: p.slug, name: p.name }));

  return (
    <>
      <ContactHero />
      <ContactMain
        form={
          // ?subject= and ?product= are read in the browser so the page stays static.
          <Suspense fallback={<ContactFormFallback />}>
            <ContactForm products={products} />
          </Suspense>
        }
      />
      <ContactFaq />
      <JsonLd data={localBusinessJsonLd()} />
      <JsonLd data={faqJsonLd(contactContent.faq.items)} />
    </>
  );
}
