import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Html, useAnimations, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { AVATAR_MODEL_URL } from "../data";

const WAVE_MS = 1200;
const LAYOUT = { targetHeight: 1.72, floorY: 0, forwardZ: 0, stageOffsetX: -0.06 };

const MESH_LOOK = [
  { test: /hoodie/i, color: "#1a1a22", roughness: 0.9, metalness: 0.04 },
  { test: /pants/i, color: "#0f0f14", roughness: 0.92, metalness: 0.03 },
  { test: /sneaker/i, color: "#ececf0", roughness: 0.72, metalness: 0.1 },
  { test: /hair/i, color: "#3a2e24", roughness: 0.96, metalness: 0 },
  { test: /beard/i, color: "#2c231b", roughness: 0.94, metalness: 0 },
  { test: /eyelash/i, color: "#0a0a0e", roughness: 0.35, metalness: 0 },
  { test: /body/i, color: "#c99263", roughness: 0.78, metalness: 0.02 },
];

useGLTF.preload(AVATAR_MODEL_URL);

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

function pickIdleAction(actions) {
  if (!actions) return null;
  const named =
    actions.Idle ||
    actions.idle ||
    actions.stand ||
    Object.entries(actions).find(([name]) => /idle/i.test(name))?.[1];
  if (named) return named;
  return (
    Object.entries(actions).find(([name]) => /layer0|mixamo/i.test(name))?.[1] ||
    Object.values(actions)[0]
  );
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

function RiggedFigurine({ waving, pointer }) {
  const pivot = useRef();
  const rigRef = useRef();
  const wavePhase = useRef(0);
  const bones = useRef({});
  const dressed = useRef(false);

  const { scene, animations } = useGLTF(AVATAR_MODEL_URL);
  const { actions, mixer } = useAnimations(animations, rigRef);

  useEffect(() => {
    if (!rigRef.current || !pivot.current || dressed.current) return;
    dressFigurine(scene);
    fitModel(scene, pivot.current);
    dressed.current = true;

    bones.current = {
      head: findBone(scene, /head$/i),
      neck: findBone(scene, /neck$/i),
      rightArm: findBone(scene, /rightarm$/i),
      rightForeArm: findBone(scene, /rightforearm$/i),
      rightHand: findBone(scene, /righthand$/i),
    };
  }, [scene]);

  useEffect(() => {
    const idle = pickIdleAction(actions);
    if (!idle) return undefined;
    idle.reset().setLoop(THREE.LoopRepeat, Infinity).fadeIn(0.35).play();
    return () => idle.fadeOut(0.2);
  }, [actions]);

  useFrame((_, delta) => {
    mixer?.update(delta);

    const { head, neck, rightArm, rightForeArm, rightHand } = bones.current;

    if (head) {
      head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, pointer.current.x * 0.28, delta * 2.5);
      head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, pointer.current.y * 0.1, delta * 2.5);
    }
    if (neck) {
      neck.rotation.y = THREE.MathUtils.lerp(neck.rotation.y, pointer.current.x * 0.1, delta * 2);
    }

    if (!rightArm || !rightForeArm) return;

    if (waving) {
      wavePhase.current += delta * 7;
      const swing = Math.sin(wavePhase.current) * 0.75 + Math.sin(wavePhase.current * 1.6) * 0.22;
      rightArm.rotation.z = -0.45 - swing;
      rightForeArm.rotation.z = -0.3 - swing * 0.45;
      if (rightHand) rightHand.rotation.z = -swing * 0.15;
      return;
    }

    wavePhase.current = 0;
  });

  return (
    <group ref={pivot} position={[LAYOUT.stageOffsetX, LAYOUT.floorY, LAYOUT.forwardZ]} rotation={[0, -0.28, 0]}>
      <group ref={rigRef}>
        <primitive object={scene} />
      </group>
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
      <ambientLight intensity={0.45} />
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
