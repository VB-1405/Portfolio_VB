import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import { AVATAR_MODEL_URL } from "../data";

const INTERACT_INTERVAL_MS = 8000;
const INTERACT_DURATION_MS = 2500;
const WAVE_LERP_SPEED = 4.5;
const MONITOR_Y_ROT = THREE.MathUtils.degToRad(-25);

/** Workstation snapped to seated avatar — desk pulled in toward typing reach. */
const WORKSTATION_POSE = {
  position: [0.58, 0.48, -0.2],
  rotation: [0, -Math.PI / 2, 0],
};

const TABLE = { width: 1.5, height: 0.05, depth: 0.8 };
const TABLE_TOP_Y = TABLE.height / 2;

const POSE_BONES = {
  spine: ["mixamorig9:Spine", "Spine"],
  leftUpLeg: ["mixamorig9:LeftUpLeg", "LeftUpLeg"],
  rightUpLeg: ["mixamorig9:RightUpLeg", "RightUpLeg"],
  leftLeg: ["mixamorig9:LeftLeg", "LeftLeg"],
  rightLeg: ["mixamorig9:RightLeg", "RightLeg"],
  leftArm: ["mixamorig9:LeftArm", "LeftArm"],
  rightArm: ["mixamorig9:RightArm", "RightArm"],
  leftForeArm: ["mixamorig9:LeftForeArm", "LeftForeArm"],
  rightForeArm: ["mixamorig9:RightForeArm", "RightForeArm"],
  head: ["mixamorig9:Head", "Head"],
  neck: ["mixamorig9:Neck", "Neck"],
};

/** Head/neck euler targets while waving toward the viewport. */
const WAVE_LOOK = {
  head: { x: -0.08, y: -0.75, z: 0.05 },
  neck: { x: 0, y: -0.4, z: 0 },
};

const CAMERA_POSITION = [-3, 2, 5];

useGLTF.preload(AVATAR_MODEL_URL);

function getBone(root, names) {
  const list = Array.isArray(names) ? names : [names];
  let bone = null;
  root.traverse((obj) => {
    if (!bone && obj.isBone && list.includes(obj.name)) bone = obj;
  });
  return bone;
}

function buildBoneMap(root) {
  const nodes = {};
  for (const [key, names] of Object.entries(POSE_BONES)) {
    nodes[key] = getBone(root, names);
  }
  return nodes;
}

function createCodeTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 288;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = "#020806";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const chars = "01{}[]();const let async await fetch POST GET 0xFF sudo nmap ssh";
  ctx.font = "11px monospace";
  for (let row = 0; row < 22; row++) {
    ctx.fillStyle = row % 3 === 0 ? "#00ff9d" : "#00cc6a";
    let line = "";
    for (let i = 0; i < 38; i++) {
      line += chars[Math.floor(Math.random() * chars.length)];
    }
    ctx.fillText(line, 12, 18 + row * 12);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

const CHAIR_LOCAL_POSITION = [0, 0, 0.62];
/** Drop avatar root so glutes rest on the chair cushion after hip fold. */
const AVATAR_SEAT_ANCHOR = [0, -0.4, CHAIR_LOCAL_POSITION[2]];
const AVATAR_SCALE = 1.65;

const SIT_POSE = {
  spineX: 0.15,
  thighX: Math.PI / 2,
  kneeX: -Math.PI / 2,
  armX: -Math.PI / 3,
  forearmX: -0.1,
};

function GamingChair() {
  const glow = "#00f3ff";
  const shell = { color: "#0a0a0a", roughness: 0.55, metalness: 0.35 };
  const wheelOffsets = [
    [0.22, 0.22],
    [-0.22, 0.22],
    [0.22, -0.22],
    [-0.22, -0.22],
    [0, 0.26],
  ];

  return (
    <group position={CHAIR_LOCAL_POSITION}>
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.024, 20]} />
        <meshStandardMaterial color="#111" roughness={0.65} metalness={0.45} />
      </mesh>
      {wheelOffsets.map(([x, z], i) => (
        <mesh key={i} position={[x, 0.02, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.028, 0.028, 0.04, 10]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.7} metalness={0.25} />
        </mesh>
      ))}

      <mesh position={[0, 0.13, 0]} castShadow>
        <boxGeometry args={[0.09, 0.2, 0.09]} />
        <meshStandardMaterial color="#141414" roughness={0.6} metalness={0.4} />
      </mesh>

      <mesh position={[0, 0.26, 0]} castShadow>
        <boxGeometry args={[0.52, 0.09, 0.48]} />
        <meshStandardMaterial {...shell} />
      </mesh>
      <mesh position={[0, 0.225, 0]}>
        <boxGeometry args={[0.54, 0.018, 0.5]} />
        <meshStandardMaterial color={glow} emissive={glow} emissiveIntensity={1.8} />
      </mesh>

      <group position={[0, 0.56, -0.17]} rotation={[0.2, 0, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.5, 0.62, 0.085]} />
          <meshStandardMaterial color="#0c0c0c" roughness={0.5} metalness={0.3} />
        </mesh>
        <mesh position={[0, 0, -0.048]}>
          <boxGeometry args={[0.48, 0.58, 0.014]} />
          <meshStandardMaterial color={glow} emissive={glow} emissiveIntensity={1.2} transparent opacity={0.85} />
        </mesh>
        <mesh position={[-0.27, -0.02, 0.03]} castShadow>
          <boxGeometry args={[0.07, 0.44, 0.34]} />
          <meshStandardMaterial color="#111" roughness={0.6} />
        </mesh>
        <mesh position={[0.27, -0.02, 0.03]} castShadow>
          <boxGeometry args={[0.07, 0.44, 0.34]} />
          <meshStandardMaterial color="#111" roughness={0.6} />
        </mesh>
      </group>
    </group>
  );
}

function CyberWorkstation({ codeTexture, isWaving }) {
  const cyan = "#00f3ff";
  const magenta = "#ff00f3";

  return (
    <group
      name="cyber-workstation"
      position={WORKSTATION_POSE.position}
      rotation={WORKSTATION_POSE.rotation}
    >
      <mesh position={[0, TABLE_TOP_Y, 0]} castShadow receiveShadow>
        <boxGeometry args={[TABLE.width, TABLE.height, TABLE.depth]} />
        <meshStandardMaterial
          color="#061820"
          emissive={cyan}
          emissiveIntensity={0.22}
          roughness={0.35}
          metalness={0.55}
        />
      </mesh>

      <mesh position={[0, TABLE_TOP_Y - 0.005, TABLE.depth / 2 - 0.01]}>
        <boxGeometry args={[TABLE.width - 0.02, 0.012, 0.02]} />
        <meshStandardMaterial color={cyan} emissive={cyan} emissiveIntensity={2.2} />
      </mesh>

      <group position={[0, TABLE_TOP_Y + 0.009, TABLE.depth * 0.22]}>
        <mesh castShadow>
          <boxGeometry args={[0.44, 0.018, 0.14]} />
          <meshStandardMaterial color="#141c28" roughness={0.45} metalness={0.35} />
        </mesh>
        <mesh position={[0.3, 0.002, 0]} castShadow>
          <boxGeometry args={[0.09, 0.022, 0.12]} />
          <meshStandardMaterial color="#141c28" roughness={0.45} metalness={0.35} />
        </mesh>
      </group>

      <group position={[0, TABLE_TOP_Y, -TABLE.depth * 0.28]} rotation={[0, MONITOR_Y_ROT, 0]}>
        <mesh position={[0, 0.1, 0]} castShadow>
          <boxGeometry args={[0.05, 0.2, 0.04]} />
          <meshStandardMaterial color="#0f1419" metalness={0.5} roughness={0.4} />
        </mesh>
        <group position={[0, 0.28, 0]}>
          <mesh castShadow>
            <boxGeometry args={[1.1, 0.32, 0.05]} />
            <meshStandardMaterial color="#010408" roughness={0.2} metalness={0.4} />
          </mesh>
          <mesh position={[0, 0, -0.004]}>
            <boxGeometry args={[1.04, 0.27, 0.05]} />
            <meshStandardMaterial
              map={codeTexture}
              emissive={magenta}
              emissiveIntensity={15}
              toneMapped={false}
            />
          </mesh>
        </group>
      </group>

      <GamingChair />
      <AvatarRig isWaving={isWaving} seatAnchor={AVATAR_SEAT_ANCHOR} />

      <pointLight position={[0, 0.75, 0.05]} intensity={2.4} color={magenta} distance={2.4} />
      <pointLight position={[0, 0.4, 0.15]} intensity={0.9} color={cyan} distance={1.6} />
    </group>
  );
}

function stripAnimationTracks(root) {
  root.animations = [];
  root.traverse((child) => {
    if (child.animations?.length) child.animations = [];
    if (child.userData?.mixer) {
      child.userData.mixer.stopAllAction();
      delete child.userData.mixer;
    }
  });
}

function updateSkeletons(root) {
  root.traverse((child) => {
    if (child.isSkinnedMesh?.skeleton) child.skeleton.update();
  });
}

function setBoneEuler(bone, { x = 0, y = 0, z = 0 }) {
  if (!bone) return;
  bone.rotation.set(x, y, z);
}

function applySitPose(nodes) {
  setBoneEuler(nodes.spine, { x: SIT_POSE.spineX });
  setBoneEuler(nodes.leftUpLeg, { x: SIT_POSE.thighX });
  setBoneEuler(nodes.rightUpLeg, { x: SIT_POSE.thighX });
  setBoneEuler(nodes.leftLeg, { x: SIT_POSE.kneeX });
  setBoneEuler(nodes.rightLeg, { x: SIT_POSE.kneeX });
  setBoneEuler(nodes.leftArm, { x: SIT_POSE.armX });
  setBoneEuler(nodes.rightArm, { x: SIT_POSE.armX });
  setBoneEuler(nodes.leftForeArm, { x: SIT_POSE.forearmX });
  setBoneEuler(nodes.rightForeArm, { x: SIT_POSE.forearmX });
  setBoneEuler(nodes.head, { x: 0, y: 0, z: 0 });
  setBoneEuler(nodes.neck, { x: 0, y: 0, z: 0 });
}

function AvatarRig({ isWaving, seatAnchor }) {
  const rigRef = useRef();
  const nodesRef = useRef({});
  const waveInfluence = useRef(0);

  const { scene } = useGLTF(AVATAR_MODEL_URL);
  const model = useMemo(() => {
    const cloned = cloneSkinned(scene);
    stripAnimationTracks(cloned);
    cloned.scale.setScalar(AVATAR_SCALE);
    cloned.updateMatrixWorld(true);
    return cloned;
  }, [scene]);

  useLayoutEffect(() => {
    stripAnimationTracks(model);

    model.traverse((obj) => {
      if (!obj.isMesh) return;
      obj.castShadow = true;
      obj.receiveShadow = true;
      if (obj.material) {
        obj.material.roughness = Math.min(obj.material.roughness ?? 0.8, 0.85);
      }
    });

    nodesRef.current = buildBoneMap(model);
    applySitPose(nodesRef.current);
    updateSkeletons(model);
  }, [model]);

  useFrame((_, delta) => {
    waveInfluence.current = THREE.MathUtils.lerp(
      waveInfluence.current,
      isWaving ? 1 : 0,
      delta * WAVE_LERP_SPEED,
    );

    const nodes = nodesRef.current;
    const t = waveInfluence.current;

    // Static typing posture — no mixer, no clip playback.
    applySitPose(nodes);

    if (t > 0.0001) {
      if (nodes.head) {
        nodes.head.rotation.x = THREE.MathUtils.lerp(0, WAVE_LOOK.head.x, t);
        nodes.head.rotation.y = THREE.MathUtils.lerp(0, WAVE_LOOK.head.y, t);
        nodes.head.rotation.z = THREE.MathUtils.lerp(0, WAVE_LOOK.head.z, t);
      }
      if (nodes.neck) {
        nodes.neck.rotation.x = THREE.MathUtils.lerp(0, WAVE_LOOK.neck.x, t);
        nodes.neck.rotation.y = THREE.MathUtils.lerp(0, WAVE_LOOK.neck.y, t);
        nodes.neck.rotation.z = THREE.MathUtils.lerp(0, WAVE_LOOK.neck.z, t);
      }
      if (nodes.leftArm) {
        nodes.leftArm.rotation.z = THREE.MathUtils.lerp(0, Math.PI / 2, t);
      }
    }

    updateSkeletons(model);
  });

  return (
    <group position={seatAnchor}>
      <primitive ref={rigRef} object={model} />
    </group>
  );
}

function CyberBackdrop() {
  const nodes = useMemo(() => {
    return Array.from({ length: 18 }, (_, i) => ({
      x: (Math.random() - 0.5) * 3.5,
      y: 0.4 + Math.random() * 1.8,
      z: -1.2 - Math.random() * 1.5,
      s: 0.008 + Math.random() * 0.015,
    }));
  }, []);

  return (
    <group>
      {nodes.map((n, i) => (
        <mesh key={i} position={[n.x, n.y, n.z]}>
          <sphereGeometry args={[n.s, 6, 6]} />
          <meshBasicMaterial color="#22d3ee" transparent opacity={0.35} />
        </mesh>
      ))}
    </group>
  );
}

function ConsoleOverlay({ isWaving, secondsToNext }) {
  return (
    <Html position={[0.55, 0.05, 0]} style={{ pointerEvents: "none" }}>
      <div className="w-[148px] rounded border border-cyan-400/30 bg-black/85 p-2 font-mono text-[7px] leading-relaxed text-cyan-300/90 shadow-[0_0_14px_rgba(255,0,243,0.2)]">
        <div className="mb-1 border-b border-white/10 pb-1 text-[8px] uppercase tracking-widest text-cyan-400">
          Console
        </div>
        <div>
          {isWaving
            ? "WAVE: engaging viewer"
            : `Sequence active | Time to wave in ${secondsToNext}s`}
        </div>
        <div className="text-fuchsia-400/90">
          {isWaving ? "Resuming task…" : "Animated Sequence: 8s intervals"}
        </div>
      </div>
    </Html>
  );
}

function Scene() {
  const [isWaving, setIsWaving] = useState(false);
  const [secondsToNext, setSecondsToNext] = useState(8);
  const codeTexture = useMemo(() => createCodeTexture(), []);

  useEffect(() => {
    let waveTimeout;
    const tick = setInterval(() => {
      setSecondsToNext((prev) => (prev <= 1 ? INTERACT_INTERVAL_MS / 1000 : prev - 1));
    }, 1000);

    const interval = setInterval(() => {
      setIsWaving(true);
      setSecondsToNext(INTERACT_INTERVAL_MS / 1000);
      waveTimeout = setTimeout(() => setIsWaving(false), INTERACT_DURATION_MS);
    }, INTERACT_INTERVAL_MS);

    return () => {
      clearInterval(interval);
      clearInterval(tick);
      clearTimeout(waveTimeout);
    };
  }, []);

  return (
    <>
      <ambientLight intensity={0.48} />
      <directionalLight position={[2, 4, 3]} intensity={0.55} color="#e2e8f0" castShadow />
      <directionalLight position={[-1.5, 2, 2]} intensity={0.28} color="#67e8f9" />
      <pointLight position={[-0.5, 1.5, 1]} intensity={0.55} color="#ff00f3" />

      <group position={[0, -1.15, 0]}>
        <CyberBackdrop />
        <CyberWorkstation codeTexture={codeTexture} isWaving={isWaving} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
          <circleGeometry args={[1.6, 48]} />
          <meshStandardMaterial color="#030308" transparent opacity={0.5} />
        </mesh>
      </group>

      <ConsoleOverlay isWaving={isWaving} secondsToNext={secondsToNext} />
    </>
  );
}

/** Left hero panel — desktop hacker workstation scene (lg+). */
export default function HackerCanvas() {
  return (
    <Canvas
      className="h-full w-full touch-none"
      shadows
      dpr={[1, 1.75]}
      camera={{ position: CAMERA_POSITION, fov: 45, near: 0.1, far: 50 }}
      gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        gl.outputColorSpace = THREE.SRGBColorSpace;
      }}
    >
      <OrbitControls enableZoom={false} maxPolarAngle={Math.PI / 1.8} minPolarAngle={Math.PI / 3} />
      <Suspense
        fallback={
          <Html center>
            <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400/70">
              Loading workstation…
            </span>
          </Html>
        }
      >
        <Scene />
      </Suspense>
    </Canvas>
  );
}
