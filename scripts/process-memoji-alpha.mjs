/**
 * Strips baked-in checkerboard from Memoji figurine PNGs and writes RGBA versions.
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

function isCheckerboard(r, g, b) {
  if (r < 175 || g < 175 || b < 175) return false;
  const spread = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
  return spread < 12;
}

async function processFile(name) {
  const input = join(root, name);
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (isCheckerboard(r, g, b)) {
      data[i + 3] = 0;
    } else {
      data[i + 3] = 255;
    }
  }

  const outName = name.replace(".png", "-alpha.png");
  await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toFile(join(root, outName));

  console.log(`Wrote ${outName} (${info.width}x${info.height})`);
}

for (const file of files) {
  await processFile(file);
}
