import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Html, useAnimations, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import { AVATAR_MODEL_URL } from "../data";

const WAVE_MS = 1200;
const LAYOUT = { targetHeight: 1.72, floorY: 0, forwardZ: 0, stageOffsetX: -0.06 };

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

function styleFigurine(root) {
  root.traverse((obj) => {
    if (!obj.isMesh) return;
    obj.castShadow = true;
    obj.receiveShadow = true;

    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    mats.forEach((mat) => {
      const styled = mat.clone();
      styled.metalness = 0.05;
      styled.roughness = 0.88;
      styled.map = null;
      styled.normalMap = null;
      styled.roughnessMap = null;
      styled.metalnessMap = null;
      styled.aoMap = null;
      if (obj.name.toLowerCase().includes("visor")) {
        styled.color = new THREE.Color("#0a0a0c");
      } else {
        styled.color = new THREE.Color("#121218");
      }
      if (Array.isArray(obj.material)) {
        obj.material[mats.indexOf(mat)] = styled;
      } else {
        obj.material = styled;
      }
    });
  });
}

function findBone(root, pattern) {
  let match = null;
  root.traverse((obj) => {
    if (!match && obj.isBone && pattern.test(obj.name)) match = obj;
  });
  return match;
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
  const bones = useRef({});
  const rest = useRef({});
  const clipMode = useRef("idle");
  const ready = useRef(false);

  const { scene, animations } = useGLTF(AVATAR_MODEL_URL);
  const model = useMemo(() => cloneSkinned(scene), [scene]);
  const { actions, mixer } = useAnimations(animations, rigRef);

  useEffect(() => {
    if (!rigRef.current || !pivot.current || ready.current) return;
    styleFigurine(model);
    fitModel(model, pivot.current);
    ready.current = true;

    bones.current = {
      head: findBone(model, /head$/i),
      neck: findBone(model, /neck$/i),
    };
    for (const [key, bone] of Object.entries(bones.current)) {
      if (bone) rest.current[key] = bone.rotation.clone();
    }
  }, [model]);

  useEffect(() => {
    if (!actions) return undefined;

    const idle = actions.idle || actions.Idle || actions.stand;
    if (!idle) return undefined;

    idle.reset().setLoop(THREE.LoopRepeat, Infinity).fadeIn(0.35).play();
    clipMode.current = "idle";

    return () => {
      idle.fadeOut(0.1);
      actions.waveHello?.fadeOut(0.1);
    };
  }, [actions]);

  useEffect(() => {
    if (!actions) return;

    const idle = actions.idle || actions.Idle || actions.stand;
    const waveHello = actions.waveHello;
    if (!idle) return;

    if (waving && waveHello) {
      waveHello.reset().setLoop(THREE.LoopRepeat, Infinity).fadeIn(0.3).play();
      idle.fadeOut(0.3);
      clipMode.current = "wave";
      return;
    }

    waveHello?.fadeOut(0.3);
    if (!idle.isRunning()) {
      idle.reset().setLoop(THREE.LoopRepeat, Infinity).fadeIn(0.3).play();
    }
    clipMode.current = "idle";
  }, [waving, actions]);

  useFrame((_, delta) => {
    mixer?.update(delta);

    if (waving) return;

    const { head, neck } = bones.current;
    if (head && rest.current.head) {
      head.rotation.y = THREE.MathUtils.lerp(
        head.rotation.y,
        rest.current.head.y + pointer.current.x * 0.22,
        delta * 2.5,
      );
      head.rotation.x = THREE.MathUtils.lerp(
        head.rotation.x,
        rest.current.head.x + pointer.current.y * 0.08,
        delta * 2.5,
      );
    }
    if (neck && rest.current.neck) {
      neck.rotation.y = THREE.MathUtils.lerp(
        neck.rotation.y,
        rest.current.neck.y + pointer.current.x * 0.1,
        delta * 2,
      );
    }
  });

  return (
    <group ref={pivot} position={[LAYOUT.stageOffsetX, LAYOUT.floorY, LAYOUT.forwardZ]} rotation={[0, -0.28, 0]}>
      <group ref={rigRef}>
        <primitive object={model} />
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
      <ambientLight intensity={0.5} />
      <directionalLight position={[2.8, 4.5, 3.2]} intensity={1.4} castShadow color="#fff8f0" />
      <directionalLight position={[-2.2, 2.8, 1.8]} intensity={0.5} color="#67e8f9" />
      <pointLight position={[0.5, 1.6, 2.2]} intensity={0.3} color="#a5f3fc" />
      <Environment preset="city" />
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.62, 48]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.12} />
      </mesh>
      <ContactShadows position={[0, 0.05, 0]} opacity={0.5} scale={2.5} blur={2.2} far={1.5} />
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
      gl={{ alpha: true, antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
      camera={{ fov: 34, near: 0.1, far: 50, position: [0, 1.05, 3.2] }}
      onCreated={({ gl, camera }) => {
        gl.setClearColor(0x000000, 0);
        gl.outputColorSpace = THREE.SRGBColorSpace;
        camera.lookAt(0, 0.95, 0);
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
