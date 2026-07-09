/**
 * Builds public/avatar/figurine.glb — mixamo humanoid with memoji palette,
 * pedestal base, idle + waveHello skeletal clips (retargeted from mixamo rig).
 */
import { mkdir, copyFile, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { NodeIO } from "@gltf-transform/core";
import { EXTMeshoptCompression, KHRMeshQuantization } from "@gltf-transform/extensions";
import { MeshoptDecoder } from "meshoptimizer";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outDir = join(root, "public", "avatar");
const outPath = join(outDir, "figurine.glb");
const soldierPath = join(root, "scripts", "assets", "Soldier.glb");
const animSourcePath = join(root, "scripts", "assets", "anim-source.glb");

const boneBase = (name) => (name ? name.replace(/_\d+$/, "") : "");

async function downloadIfMissing(url, dest) {
  try {
    await readFile(dest);
    return;
  } catch {
    /* download */
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`);
  await mkdir(dirname(dest), { recursive: true });
  await writeFile(dest, Buffer.from(await res.arrayBuffer()));
}

function styleMemojiMaterials(doc) {
  for (const mat of doc.getRoot().listMaterials()) {
    const name = mat.getName() || "";
    mat.setMetallicFactor(0.04);
    mat.setRoughnessFactor(0.82);
    mat.setBaseColorTexture(null);
    mat.setMetallicRoughnessTexture(null);
    mat.setNormalTexture(null);
    mat.setOcclusionTexture(null);
    mat.setEmissiveTexture(null);

    if (name.includes("Visor")) {
      mat.setBaseColorFactor([0.05, 0.05, 0.06, 1]);
    } else {
      mat.setBaseColorFactor([0.11, 0.11, 0.13, 1]);
    }
  }
}

function addPedestal(doc) {
  const buffer = doc.getRoot().listBuffers()[0] || doc.createBuffer();
  const positions = new Float32Array([
    -0.38, 0, -0.38, 0.38, 0, -0.38, 0.38, 0, 0.38, -0.38, 0, 0.38,
    -0.38, 0.06, -0.38, 0.38, 0.06, -0.38, 0.38, 0.06, 0.38, -0.38, 0.06, 0.38,
  ]);
  const normals = new Float32Array([
    0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,
  ]);
  const indices = new Uint16Array([
    0, 2, 1, 0, 3, 2, 4, 5, 6, 4, 6, 7, 0, 1, 5, 0, 5, 4, 1, 2, 6, 1, 6, 5, 2, 3, 7, 2, 7, 6, 3, 0, 4, 3, 4, 7,
  ]);

  const posAccessor = doc.createAccessor("pedestal-pos").setType("VEC3").setArray(positions).setBuffer(buffer);
  const normAccessor = doc.createAccessor("pedestal-norm").setType("VEC3").setArray(normals).setBuffer(buffer);
  const idxAccessor = doc.createAccessor("pedestal-idx").setType("SCALAR").setArray(indices).setBuffer(buffer);

  const prim = doc
    .createPrimitive()
    .setMode(4)
    .setAttribute("POSITION", posAccessor)
    .setAttribute("NORMAL", normAccessor)
    .setIndices(idxAccessor);

  const mat = doc
    .createMaterial("PedestalMat")
    .setBaseColorFactor([0.04, 0.04, 0.05, 1])
    .setRoughnessFactor(0.9)
    .setMetallicFactor(0.15);
  prim.setMaterial(mat);

  const mesh = doc.createMesh("Pedestal").addPrimitive(prim);
  const node = doc.createNode("Pedestal").setMesh(mesh);
  doc.getRoot().listScenes()[0].addChild(node);
}

function buildNodeMap(doc) {
  const map = new Map();
  for (const node of doc.getRoot().listNodes()) {
    const name = node.getName();
    if (name) map.set(name, node);
    const base = boneBase(name);
    if (base && !map.has(base)) map.set(base, node);
  }
  return map;
}

function copyAccessor(targetDoc, sourceAccessor, sharedBuffer) {
  return targetDoc
    .createAccessor()
    .setType(sourceAccessor.getType())
    .setArray(sourceAccessor.getArray().slice())
    .setBuffer(sharedBuffer);
}

function retargetAnimation(sourceDoc, targetDoc, animName, outputName) {
  const sourceAnim = sourceDoc.getRoot().listAnimations().find((a) => a.getName() === animName);
  if (!sourceAnim) return null;

  const targetNodes = buildNodeMap(targetDoc);
  const newAnim = targetDoc.createAnimation(outputName || animName);
  const animBuffer = targetDoc.getRoot().listBuffers()[0];
  if (!animBuffer) return null;

  for (const srcChannel of sourceAnim.listChannels()) {
    const srcNode = srcChannel.getTargetNode();
    if (!srcNode) continue;
    const targetNode = targetNodes.get(boneBase(srcNode.getName()));
    if (!targetNode) continue;

    const srcSampler = srcChannel.getSampler();
    const input = srcSampler.getInput();
    const output = srcSampler.getOutput();
    if (!input || !output) continue;

    const newInput = copyAccessor(targetDoc, input, animBuffer);
    const newOutput = copyAccessor(targetDoc, output, animBuffer);

    const newSampler = targetDoc.createAnimationSampler()
      .setInput(newInput)
      .setOutput(newOutput)
      .setInterpolation(srcSampler.getInterpolation());

    const newChannel = targetDoc.createAnimationChannel()
      .setTargetNode(targetNode)
      .setTargetPath(srcChannel.getTargetPath())
      .setSampler(newSampler);

    newAnim.addSampler(newSampler);
    newAnim.addChannel(newChannel);
  }

  return newAnim;
}

async function main() {
  await mkdir(join(root, "scripts", "assets"), { recursive: true });
  await downloadIfMissing("https://threejs.org/examples/models/gltf/Soldier.glb", soldierPath);

  const io = new NodeIO().registerExtensions([EXTMeshoptCompression, KHRMeshQuantization]).registerDependencies({
    "meshopt.decoder": MeshoptDecoder,
  });

  let animSourceDoc = null;
  try {
    animSourceDoc = await io.read(animSourcePath);
  } catch {
    console.warn("anim-source.glb not found — using Soldier Idle only. Add scripts/assets/anim-source.glb for waveHello.");
  }

  const doc = await io.read(soldierPath);
  styleMemojiMaterials(doc);

  if (animSourceDoc) {
    retargetAnimation(animSourceDoc, doc, "waveHello", "waveHello");
    retargetAnimation(animSourceDoc, doc, "stand", "stand");
  }

  const idle = doc.getRoot().listAnimations().find((a) => a.getName() === "Idle");
  if (idle) idle.setName("idle");

  await mkdir(outDir, { recursive: true });
  await io.write(outPath, doc);
  console.log(`Wrote ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
