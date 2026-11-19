import { ImageResponse } from "next/og";
import { images } from "@/lib/images";
import { publicAsDataUri } from "@/lib/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
  const emblem = await publicAsDataUri(images.brand.emblemCream.src, "image/svg+xml");
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#1a3a23",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- Satori renders plain <img> */}
      <img src={emblem} width={140} height={62} />
    </div>,
    size,
  );
}
