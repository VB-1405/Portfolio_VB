/**
 * Fixes avatar.glb materials for web:
 * - Head slot Ch06_body1 used shoes/pants atlas (no face) — reassign face diffuse
 * - Drop huge normal maps (23MB) that can block texture loading on GitHub Pages
 * - Lower metalness so untextured fallback isn't glossy black
 */
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const path = join(root, "public", "avatar", "avatar.glb");

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(path);
const gltfRoot = doc.getRoot();

const textures = Object.fromEntries(gltfRoot.listTextures().map((t) => [t.getName(), t]));
const faceDiffuse = textures["Ch06_1001_Diffuse"];

if (!faceDiffuse) {
  console.error("Ch06_1001_Diffuse not found");
  process.exit(1);
}

for (const mat of gltfRoot.listMaterials()) {
  mat.setMetallicFactor(0.04);
  mat.setRoughnessFactor(0.85);
  mat.setMetallicRoughnessTexture(null);
  mat.setNormalTexture(null);

  if (mat.getName() === "Ch06_body1" || mat.getName() === "Ch06_eyelashes") {
    mat.setBaseColorTexture(faceDiffuse);
  }
}

// Remove unused normal/spec/gloss textures to shrink file
const keep = new Set(["Ch06_1001_Diffuse", "Ch06_1002_Diffuse"]);
for (const tex of [...gltfRoot.listTextures()]) {
  if (!keep.has(tex.getName())) tex.dispose();
}

await io.write(path, doc);
const { size } = await import("node:fs/promises").then((fs) => fs.stat(path));
console.log(`Wrote ${path} (${(size / 1024 / 1024).toFixed(1)} MB)`);
