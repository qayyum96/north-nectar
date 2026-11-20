import { getMinPrice } from "@northnectar/data";
import { formatPkr } from "@northnectar/ui";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import sharp from "sharp";
import { catalog } from "@/lib/catalog";
import { images } from "@/lib/images";
import { OG_SIZE, OgFrame, loadOgFonts, publicAsDataUri } from "@/lib/og";

/**
 * Per-product social share image at a stable URL: /og/product/[slug] (1200x630 PNG).
 * Pre-rendered for every active product at build time and refreshed hourly.
 */
export const revalidate = 3600;
export const dynamicParams = true;
const size = OG_SIZE;

export async function generateStaticParams() {
  const products = await catalog.getProducts();
  return products.map((p) => ({ slug: p.slug }));
}

/** Product images are WebP, which the OG renderer cannot read: convert to PNG first. */
async function productImageDataUri(src: string) {
  if (/^https?:\/\//.test(src)) {
    const res = await fetch(src);
    const png = await sharp(Buffer.from(await res.arrayBuffer()))
      .resize(520, 520, { fit: "inside" })
      .png()
      .toBuffer();
    return `data:image/png;base64,${png.toString("base64")}`;
  }
  const file = await readFile(join(process.cwd(), "public", src.replace(/^\//, "")));
  const png = await sharp(file).resize(520, 520, { fit: "inside" }).png().toBuffer();
  return `data:image/png;base64,${png.toString("base64")}`;
}

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [fonts, emblem, product, categories] = await Promise.all([
    loadOgFonts(),
    publicAsDataUri(images.brand.emblemCream.src, "image/svg+xml"),
    catalog.getProductBySlug(slug),
    catalog.getCategories(),
  ]);

  // Drafts and unknown slugs get no share image.
  if (!product) return new Response("Not found", { status: 404 });

  const category = categories.find((c) => c.id === product.categoryId);
  const main = product.images[0];
  const picture = main ? await productImageDataUri(main.src) : null;
  const minPrice = getMinPrice(product);

  return new ImageResponse(
    <OgFrame emblem={emblem}>
      <div
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 48 }}
      >
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 620 }}>
          {category ? (
            <div
              style={{
                fontSize: 26,
                letterSpacing: 5,
                color: "#9ed7a6",
                textTransform: "uppercase",
              }}
            >
              {category.name}
            </div>
          ) : null}
          <div
            style={{
              fontFamily: "Oswald",
              fontSize: product.name.length > 28 ? 68 : 84,
              lineHeight: 1,
              textTransform: "uppercase",
              marginTop: 14,
            }}
          >
            {product.name}
          </div>
          <div style={{ fontSize: 28, color: "#e7efe2", marginTop: 20 }}>{product.tagline}</div>
          {minPrice !== null ? (
            <div style={{ display: "flex", marginTop: 26, fontSize: 30, color: "#d1ae6c" }}>
              From {formatPkr(minPrice)}
            </div>
          ) : null}
        </div>
        {picture ? (
          <div
            style={{
              display: "flex",
              width: 380,
              height: 380,
              borderRadius: 32,
              background: main?.background ?? "#ffffff",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- Satori renders plain <img> */}
            <img src={picture} width={360} height={360} style={{ objectFit: "contain" }} />
          </div>
        ) : null}
      </div>
    </OgFrame>,
    { ...size, fonts },
  );
}
