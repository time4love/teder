/**
 * Builds static `app/opengraph-image.png` + `app/twitter-image.png` (1200×630) for WhatsApp / Facebook.
 * Not run on Vercel: commit the generated PNGs. `sharp` is optional — install locally only when regenerating:
 *   npm install sharp --save-dev && npm run generate:og
 */
import sharp from "sharp";
import { readFile, writeFile, copyFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const W = 1200;
const H = 630;
/** Matches `bg-[#F9F9F7]` */
const BG = { r: 249, g: 249, b: 247 };

const logoPath = join(root, "public", "logo.png");
const outOg = join(root, "app", "opengraph-image.png");
const outTw = join(root, "app", "twitter-image.png");

const logoBuf = await readFile(logoPath);
const resized = await sharp(logoBuf)
  .resize({ width: 1050, height: 420, fit: "inside" })
  .png()
  .toBuffer();

const { width: lw = 0, height: lh = 0 } = await sharp(resized).metadata();
const left = Math.round((W - lw) / 2);
const top = Math.round((H - lh) / 2);

const png = await sharp({
  create: { width: W, height: H, channels: 3, background: BG },
})
  .composite([{ input: resized, left, top }])
  .png({ compressionLevel: 9 })
  .toBuffer();

await writeFile(outOg, png);
await copyFile(outOg, outTw);

const kb = Math.round(png.length / 1024);
console.log(`Wrote ${outOg} and ${outTw} (${kb} KB)`);
