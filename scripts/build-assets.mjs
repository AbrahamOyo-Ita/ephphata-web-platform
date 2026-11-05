/**
 * EPHAPHATA — Brand asset pipeline
 * ------------------------------------------------------------------
 * Converts the supplied 4K backgrounds + flyers into optimised web
 * assets. Aspect ratio is preserved on every derivative (never stretched).
 *
 * Run: node scripts/build-assets.mjs
 */
import sharp from "sharp";
import { mkdir, stat } from "node:fs/promises";
import path from "node:path";

const RAW = "public/brand/raw";
const OUT = "public/brand";

const BACKGROUNDS = [
  { file: "ephaphata_green_4k.png", name: "green" },
  { file: "ephaphata_multicolor_4k.png", name: "multicolor" },
  { file: "ephaphata_red_4k.png", name: "red" },
  { file: "ephaphata_pink_4k.png", name: "pink" },
  { file: "ephaphata_blue_4k.png", name: "blue" },
];

// Flyers: (source filename, output slug, focal note)
const FLYERS = [
  ["WhatsApp Image 2026-11-05 at 6.50.00 AM (1).jpeg", "unical-lineup"],
  ["WhatsApp Image 2026-11-05 at 6.50.02 AM.jpeg", "unical-portrait"],
  ["WhatsApp Image 2026-11-05 at 6.49.59 AM (1).jpeg", "festival-multicolor"],
  ["WhatsApp Image 2026-11-05 at 6.49.59 AM.jpeg", "festival-emerald"],
  ["WhatsApp Image 2026-11-05 at 6.50.00 AM.jpeg", "festival-lineup"],
  ["WhatsApp Image 2026-11-05 at 6.50.00 AM (2).jpeg", "its-today"],
  ["WhatsApp Image 2026-11-05 at 6.50.01 AM (1).jpeg", "four-days"],
  ["WhatsApp Image 2026-11-05 at 6.50.01 AM.jpeg", "three-days"],
];

const kb = (n) => `${Math.round(n / 1024)}kB`;

async function build() {
  await mkdir(`${OUT}/bg`, { recursive: true });
  await mkdir(`${OUT}/flyers`, { recursive: true });

  console.log("→ backgrounds (16:9 preserved)");
  for (const bg of BACKGROUNDS) {
    const src = path.join(RAW, bg.file);
    const meta = await sharp(src).metadata();
    const ratio = meta.width / meta.height; // 1.777…

    for (const width of [2560, 1600, 900]) {
      const height = Math.round(width / ratio); // derive, never squish
      const base = `${OUT}/bg/${bg.name}-${width}`;
      const pipeline = sharp(src).resize(width, height, { fit: "cover", position: "centre" });

      await pipeline.clone().avif({ quality: 52, effort: 4 }).toFile(`${base}.avif`);
      await pipeline.clone().webp({ quality: 74 }).toFile(`${base}.webp`);
      await pipeline.clone().jpeg({ quality: 80, mozjpeg: true }).toFile(`${base}.jpg`);
      const s = await stat(`${base}.avif`);
      console.log(`   ${bg.name} ${width}x${height}  avif ${kb(s.size)}`);
    }
  }

  console.log("→ flyers");
  for (const [file, slug] of FLYERS) {
    const src = path.join(RAW, file);
    const meta = await sharp(src).metadata();
    const width = Math.min(1200, meta.width);
    const height = Math.round((width / meta.width) * meta.height);
    const base = `${OUT}/flyers/${slug}`;

    const p = sharp(src).resize(width, height, { fit: "inside" });
    await p.clone().avif({ quality: 55 }).toFile(`${base}.avif`);
    await p.clone().webp({ quality: 78 }).toFile(`${base}.webp`);
    await p.clone().jpeg({ quality: 84, mozjpeg: true }).toFile(`${base}.jpg`);

    // Low-quality placeholder (blurred, tiny) for progressive loading
    await sharp(src)
      .resize(24, Math.round((24 / meta.width) * meta.height))
      .blur(1.2)
      .webp({ quality: 40 })
      .toFile(`${base}-lqip.webp`);

    const s = await stat(`${base}.avif`);
    console.log(`   ${slug} ${width}x${height}  avif ${kb(s.size)}`);
  }
  console.log("✓ done");
}

build().catch((e) => {
  console.error(e);
  process.exit(1);
});
