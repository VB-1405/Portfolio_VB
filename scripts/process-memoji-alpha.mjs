/**
 * Strips baked-in checkerboard from Memoji figurine PNGs, trims empty space, writes RGBA.
 */
import sharp from "sharp";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "public");
const files = [
  "memoji-figurine-idle.png",
  "memoji-figurine-wave.png",
  "memoji-figurine-body.png",
  "memoji-arm-idle.png",
];

/** Remove neutral gray/white checkerboard — keep skin/hair (has color variation). */
function isCheckerboard(r, g, b) {
  const spread = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
  if (spread > 9) return false;
  const lum = (r + g + b) / 3;
  return lum >= 192;
}

async function processFile(name) {
  const input = join(root, name);
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    data[i + 3] = isCheckerboard(r, g, b) ? 0 : 255;
  }

  const outName = name.replace(".png", "-alpha.png");
  await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .trim({ threshold: 1 })
    .toFile(join(root, outName));

  const trimmed = await sharp(join(root, outName)).metadata();
  console.log(`Wrote ${outName} (${trimmed.width}x${trimmed.height}, trimmed)`);
}

for (const file of files) {
  await processFile(file);
}
