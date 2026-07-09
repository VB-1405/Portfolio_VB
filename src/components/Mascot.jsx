import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, createPortal, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Html, useGLTF, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import { AVATAR_MODEL_URL, MEMOJI_FACE_URL } from "../data";

const WAVE_MS = 1200;
const LAYOUT = { targetHeight: 1.72, floorY: 0, forwardZ: 0, stageOffsetX: -0.06 };

const MESH_LOOK = [
  { test: /hoodie/i, color: "#101014", roughness: 0.9, metalness: 0.04 },
  { test: /pants/i, color: "#1a2840", roughness: 0.92, metalness: 0.03 },
  { test: /sneaker/i, color: "#ececf0", roughness: 0.72, metalness: 0.1 },
  { test: /body/i, color: "#c99263", roughness: 0.78, metalness: 0.02 },
];

const RELAXED_POSE = {
  leftArm: { x: 0.367, z: 0.417 },
  rightArm: { x: 0.389, z: -0.453 },
  leftForeArm: { x: 0.018, z: 0.336 },
  rightForeArm: { x: 0.026, z: -0.51 },
};

useGLTF.preload(AVATAR_MODEL_URL);
useTexture.preload(MEMOJI_FACE_URL);

function useFigurineWave() {
  const [hovering, setHovering] = useState(false);
  const [greeting, setGreeting] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  const wave = useCallback(() => {
    if (reduceMotion) return;
    setGreeting(true);
    setTimeout(() => setGreeting(false), WAVE_MS);
  }, [reduceMotion]);

  useEffect(() => {
    setReduceMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    if (reduceMotion) return undefined;
    const start = setTimeout(wave, 2000);
    return () => clearTimeout(start);
  }, [reduceMotion, wave]);

  return {
    setHovering,
    waving: !reduceMotion && (hovering || greeting),
    wave,
  };
}

function dressFigurine(root) {
  root.traverse((obj) => {
    if (!obj.isMesh) return;

    if (/hair|beard|eyelash/i.test(obj.name)) {
      obj.visible = false;
      return;
    }

    obj.castShadow = true;
    obj.receiveShadow = true;

    const rule = MESH_LOOK.find((entry) => entry.test.test(obj.name)) || {
      color: "#222228",
      roughness: 0.86,
      metalness: 0.05,
    };

    const styleMaterial = (mat) => {
      const next = mat.clone();
      next.map = null;
      next.normalMap = null;
      next.roughnessMap = null;
      next.metalnessMap = null;
      next.aoMap = null;
      next.emissiveMap = null;
      next.color = new THREE.Color(rule.color);
      next.roughness = rule.roughness;
      next.metalness = rule.metalness;
      next.envMapIntensity = 0.85;
      next.needsUpdate = true;
      return next;
    };

    if (Array.isArray(obj.material)) {
      obj.material = obj.material.map(styleMaterial);
    } else {
      obj.material = styleMaterial(obj.material);
    }
  });
}

function findBone(root, pattern) {
  let match = null;
  root.traverse((obj) => {
    if (!match && obj.isBone && pattern.test(obj.name)) match = obj;
  });
  return match;
}

function applyRelaxedPose(root) {
  const bones = {
    leftArm: findBone(root, /leftarm$/i),
    rightArm: findBone(root, /rightarm$/i),
    leftForeArm: findBone(root, /leftforearm$/i),
    rightForeArm: findBone(root, /rightforearm$/i),
  };

  for (const [key, bone] of Object.entries(bones)) {
    const pose = RELAXED_POSE[key];
    if (!bone || !pose) continue;
    if (pose.x !== undefined) bone.rotation.x = pose.x;
    if (pose.z !== undefined) bone.rotation.z = pose.z;
  }

  root.traverse((obj) => {
    if (obj.isSkinnedMesh) obj.skeleton.update();
  });
  root.updateMatrixWorld(true);
}

function fitModel(root, pivot) {
  root.position.set(0, 0, 0);
  root.rotation.set(0, 0, 0);
  pivot.position.set(0, 0, 0);
  pivot.scale.setScalar(1);
  root.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(root);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);
  root.position.set(-center.x, -box.min.y, -center.z);
  pivot.scale.setScalar(LAYOUT.targetHeight / Math.max(0.001, size.y));
}

function HeadFace({ faceTex }) {
  const billboard = useRef();

  useEffect(() => {
    if (!faceTex) return;
    faceTex.colorSpace = THREE.SRGBColorSpace;
    faceTex.needsUpdate = true;
  }, [faceTex]);

  useFrame(({ camera }) => {
    if (!billboard.current) return;
    billboard.current.lookAt(camera.position);
  });

  return (
    <group position={[0, 2.1, 0.4]}>
      {/* Hood up */}
      <mesh position={[0, 1.2, -0.6]} renderOrder={2}>
        <sphereGeometry args={[3.2, 32, 20, 0, Math.PI * 2, 0, Math.PI * 0.58]} />
        <meshStandardMaterial color="#0c0c10" roughness={0.94} metalness={0.03} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.6, -1.1]} rotation={[0.15, 0, 0]} renderOrder={3}>
        <torusGeometry args={[2.8, 0.55, 12, 32, Math.PI]} />
        <meshStandardMaterial color="#0c0c10" roughness={0.94} metalness={0.03} />
      </mesh>

      {/* Memoji face — billboarded to camera */}
      <group ref={billboard} position={[0, 0, 2.8]} renderOrder={10}>
        <mesh>
          <planeGeometry args={[5.2, 6.4]} />
          <meshBasicMaterial
            map={faceTex}
            transparent
            toneMapped={false}
            depthTest={false}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Surgical mask */}
        <mesh position={[0, -1.35, 0.05]} renderOrder={11}>
          <planeGeometry args={[3.8, 1.6]} />
          <meshBasicMaterial color="#c5dce8" transparent opacity={0.95} depthTest={false} depthWrite={false} />
        </mesh>
        <mesh position={[-1.9, -0.7, 0.04]} rotation={[0, 0, 0.35]} renderOrder={11}>
          <planeGeometry args={[1.1, 0.22]} />
          <meshBasicMaterial color="#e8eef2" depthTest={false} depthWrite={false} />
        </mesh>
        <mesh position={[1.9, -0.7, 0.04]} rotation={[0, 0, -0.35]} renderOrder={11}>
          <planeGeometry args={[1.1, 0.22]} />
          <meshBasicMaterial color="#e8eef2" depthTest={false} depthWrite={false} />
        </mesh>
      </group>
    </group>
  );
}

function HeadAccessories({ headBone }) {
  const faceTex = useTexture(MEMOJI_FACE_URL);
  if (!headBone) return null;
  return createPortal(<HeadFace faceTex={faceTex} />, headBone);
}

function RiggedFigurine({ waving, pointer }) {
  const pivot = useRef();
  const rigRef = useRef();
  const wavePhase = useRef(0);
  const bones = useRef({});
  const poseBase = useRef({});
  const dressed = useRef(false);
  const [headBone, setHeadBone] = useState(null);

  const { scene } = useGLTF(AVATAR_MODEL_URL);
  const model = useMemo(() => cloneSkinned(scene), [scene]);

  useEffect(() => {
    if (!rigRef.current || !pivot.current || dressed.current) return;
    dressFigurine(model);
    fitModel(model, pivot.current);
    applyRelaxedPose(model);
    dressed.current = true;

    bones.current = {
      head: findBone(model, /head$/i),
      neck: findBone(model, /neck$/i),
      rightArm: findBone(model, /rightarm$/i),
      rightForeArm: findBone(model, /rightforearm$/i),
      rightHand: findBone(model, /righthand$/i),
    };

    for (const [key, bone] of Object.entries(bones.current)) {
      if (bone) poseBase.current[key] = { x: bone.rotation.x, y: bone.rotation.y, z: bone.rotation.z };
    }
    setHeadBone(bones.current.head);
  }, [model]);

  useFrame((_, delta) => {
    const { head, neck, rightArm, rightForeArm, rightHand } = bones.current;
    const base = poseBase.current;

    if (head && base.head) {
      head.rotation.y = base.head.y + pointer.current.x * 0.22;
      head.rotation.x = base.head.x + pointer.current.y * 0.08;
    }
    if (neck && base.neck) {
      neck.rotation.y = base.neck.y + pointer.current.x * 0.08;
    }

    if (!rightArm || !rightForeArm || !base.rightArm) return;

    if (waving) {
      wavePhase.current += delta * 7;
      const swing = Math.sin(wavePhase.current) * 0.55 + Math.sin(wavePhase.current * 1.6) * 0.18;
      // Raise arm upward (negative X on Mixamo right shoulder) and wave forearm
      rightArm.rotation.x = base.rightArm.x - 1.05 - swing * 0.12;
      rightArm.rotation.z = base.rightArm.z + 0.12;
      rightForeArm.rotation.x = base.rightForeArm.x - 0.55 - swing * 0.4;
      rightForeArm.rotation.z = base.rightForeArm.z + swing * 0.35;
      if (rightHand && base.rightHand) {
        rightHand.rotation.z = base.rightHand.z + swing * 0.2;
      }
      return;
    }

    wavePhase.current = 0;
    rightArm.rotation.x = base.rightArm.x;
    rightArm.rotation.z = base.rightArm.z;
    rightForeArm.rotation.x = base.rightForeArm.x;
    rightForeArm.rotation.z = base.rightForeArm.z;
    if (rightHand && base.rightHand) rightHand.rotation.z = base.rightHand.z;
  });

  return (
    <group ref={pivot} position={[LAYOUT.stageOffsetX, LAYOUT.floorY, LAYOUT.forwardZ]} rotation={[0, -0.28, 0]}>
      <group ref={rigRef}>
        <primitive object={model} />
      </group>
      <HeadAccessories headBone={headBone} />
      <mesh position={[0, 0.03, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[0.42, 0.46, 0.08, 48]} />
        <meshStandardMaterial color="#08080c" roughness={0.88} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.075, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.4, 0.44, 48]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.35} />
      </mesh>
    </group>
  );
}

function FigurineScene({ waving, pointer }) {
  return (
    <>
      <ambientLight intensity={0.48} />
      <directionalLight position={[2.8, 4.5, 3.2]} intensity={1.45} castShadow color="#fff8f0" />
      <directionalLight position={[-2.2, 2.8, 1.8]} intensity={0.55} color="#67e8f9" />
      <pointLight position={[0.5, 1.6, 2.2]} intensity={0.35} color="#a5f3fc" />
      <spotLight position={[1.5, 3.5, -1]} intensity={0.5} angle={0.4} penumbra={0.6} color="#22d3ee" />
      <Environment preset="studio" />
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.62, 48]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.14} />
      </mesh>
      <ContactShadows position={[0, 0.05, 0]} opacity={0.55} scale={2.6} blur={2.4} far={1.6} color="#000000" />
      <RiggedFigurine waving={waving} pointer={pointer} />
    </>
  );
}

function FigurineCanvas({ waving, pointer }) {
  return (
    <Canvas
      className="w-full h-full"
      shadows
      dpr={[1, 1.75]}
      gl={{ alpha: true, antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
      camera={{ fov: 32, near: 0.1, far: 50, position: [0, 1.08, 3.05] }}
      onCreated={({ gl, camera }) => {
        gl.setClearColor(0x000000, 0);
        gl.outputColorSpace = THREE.SRGBColorSpace;
        camera.lookAt(0, 0.98, 0);
      }}
      onPointerMove={(e) => {
        const rect = e.target.getBoundingClientRect();
        pointer.current = {
          x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
          y: -((e.clientY - rect.top) / rect.height) * 2 + 1,
        };
      }}
    >
      <Suspense
        fallback={
          <Html center>
            <span className="text-[10px] uppercase tracking-widest text-cyan-400/70">Loading avatar…</span>
          </Html>
        }
      >
        <FigurineScene waving={waving} pointer={pointer} />
      </Suspense>
    </Canvas>
  );
}

function MascotCompanion() {
  const pointer = useRef({ x: 0, y: 0 });
  const { setHovering, waving, wave } = useFigurineWave();

  return (
    <div className="hidden xl:block fixed left-0 bottom-0 z-30 pointer-events-none w-[min(32vw,300px)] h-[min(70vh,540px)]">
      <button
        type="button"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        onFocus={() => setHovering(true)}
        onBlur={() => setHovering(false)}
        onClick={wave}
        aria-label="Profile mascot — Vrishabh Bhavsar, wave hello"
        className="pointer-events-auto relative h-full w-full cursor-pointer border-0 bg-transparent p-0 pl-1 outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded-lg"
      >
        <FigurineCanvas waving={waving} pointer={pointer} />
      </button>
    </div>
  );
}

export default function Mascot({ variant = "companion" }) {
  if (variant === "companion") return <MascotCompanion />;
  return null;
}
