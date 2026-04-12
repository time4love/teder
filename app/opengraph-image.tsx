import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs";

export const alt = "תדר-ישר-אל";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * WhatsApp / Facebook expect ~1.91:1 (e.g. 1200×630). Raw `logo.png` is very wide (1950×650),
 * so crawlers often fall back to `app/icon.png`. This canvas matches the homepage hero background
 * and centers the same logo asset.
 */
export default async function OpenGraphImage(): Promise<ImageResponse> {
  const logo = await readFile(join(process.cwd(), "public", "logo.png"));
  const src = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F9F9F7",
        }}
      >
        {/* next/image is not used in @vercel/og ImageResponse */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt=""
          src={src}
          height={380}
          width={1140}
          style={{
            objectFit: "contain",
            maxWidth: "95%",
            maxHeight: "78%",
          }}
        />
      </div>
    ),
    { ...size },
  );
}
