/**
 * Exports avatar.glb to Mixamo upload formats (OBJ, ZIP, GLB for Blender→FBX).
 */
import { mkdir, writeFile, readFile, stat, copyFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";

globalThis.self = globalThis;
globalThis.window = globalThis;
globalThis.document = { createElementNS: () => ({ style: {} }), createElement: () => ({ style: {} }) };

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const glbPath = join(root, "public", "avatar", "avatar.glb");
const outDir = join(root, "public", "avatar", "mixamo");

async function extractTextures() {
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
  const doc = await io.read(glbPath);
  const texDir = join(outDir, "textures");
  await mkdir(texDir, { recursive: true });
  for (const tex of doc.getRoot().listTextures()) {
    const buf = tex.getImage();
    if (!buf) continue;
    await writeFile(join(texDir, `${tex.getName()}.png`), Buffer.from(buf));
  }
}

async function exportObjThree() {
  const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
  const { OBJExporter } = await import("three/examples/jsm/exporters/OBJExporter.js");
  const buf = await readFile(glbPath);
  const loader = new GLTFLoader();
  const gltf = await new Promise((resolve, reject) => loader.parse(buf.buffer, "", resolve, reject));
  await writeFile(join(outDir, "character.obj"), new OBJExporter().parse(gltf.scene));
}

async function exportObjTrimesh() {
  execSync(
    `python3 -c "
import trimesh, os
scene = trimesh.load('${glbPath}')
os.makedirs('${outDir}', exist_ok=True)
mesh = trimesh.util.concatenate(tuple(g for g in scene.geometry.values()))
mesh.export('${join(outDir, "character-mesh.obj")}')
"`,
    { stdio: "inherit" },
  );
}

async function exportFbxFallback() {
  await copyFile(glbPath, join(outDir, "character-for-blender.glb"));
}

async function createZip() {
  execSync(
    `cd "${outDir}" && zip -r -q character-mixamo.zip character.obj character-mesh.obj character-for-blender.glb README.txt textures/`,
    { stdio: "inherit" },
  );
}

const readme = `Mixamo upload files — Vrishabh Memoji avatar
==========================================

Upload to https://www.mixamo.com → Upload Character (FBX, OBJ, or ZIP):

  character.obj            — rigged mesh export
  character-mesh.obj       — merged mesh (try if OBJ fails)
  character-mixamo.zip     — all files + textures
  character-for-blender.glb — open in Blender → Export → FBX

FBX: Mixamo prefers FBX. This environment cannot write FBX directly.
     Open character-for-blender.glb in Blender (free), then File → Export → FBX.

After Mixamo rigs your character, pick "Typing" or "Wave" and download as FBX or GLB.
`;

await mkdir(outDir, { recursive: true });
await extractTextures();
await exportObjThree();
await exportObjTrimesh();
await exportFbxFallback();
await writeFile(join(outDir, "README.txt"), readme);
await createZip();

const objStat = await stat(join(outDir, "character.obj"));
console.log("\nExported to public/avatar/mixamo/");
console.log(`  character.obj              ${(objStat.size / 1024 / 1024).toFixed(1)} MB`);
console.log("  character-mesh.obj");
console.log("  character-mixamo.zip");
console.log("  character-for-blender.glb  → Export as FBX in Blender");
