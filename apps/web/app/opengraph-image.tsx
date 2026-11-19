import { ImageResponse } from "next/og";
import { images } from "@/lib/images";
import { OG_SIZE, OgFrame, loadOgFonts, publicAsDataUri } from "@/lib/og";
import { siteConfig } from "@/lib/seo/config";

export const alt = siteConfig.defaultOgImage.alt;
export const size = OG_SIZE;
export const contentType = "image/png";

/** Default social share image for every page without its own (products get their own in Phase 3). */
export default async function OpengraphImage() {
  const [fonts, emblem] = await Promise.all([
    loadOgFonts(),
    publicAsDataUri(images.brand.emblemCream.src, "image/svg+xml"),
  ]);

  return new ImageResponse(
    <OgFrame emblem={emblem}>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{ fontSize: 28, letterSpacing: 6, color: "#9ed7a6", textTransform: "uppercase" }}
        >
          Himalayan botanicals
        </div>
        <div
          style={{
            fontFamily: "Oswald",
            fontSize: 112,
            lineHeight: 0.95,
            textTransform: "uppercase",
            marginTop: 16,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <span>Picked in the</span>
          <span style={{ color: "#d1ae6c" }}>Himalayas for you</span>
        </div>
        <div style={{ fontSize: 30, color: "#e7efe2", marginTop: 24, maxWidth: 900 }}>
          Natural products from Hunza and Gilgit-Baltistan, packed at source.
        </div>
      </div>
    </OgFrame>,
    { ...size, fonts },
  );
}
