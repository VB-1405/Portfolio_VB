import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Html, useAnimations, useGLTF } from "@react-three/drei";
import * as THREE from "three";
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

function enableShadows(root) {
  root.traverse((obj) => {
    if (!obj.isMesh) return;
    obj.castShadow = true;
    obj.receiveShadow = true;
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
  const modelRef = useRef();
  const wavePhase = useRef(0);
  const bones = useRef({});
  const rest = useRef({});
  const styled = useRef(false);

  const { scene, animations } = useGLTF(AVATAR_MODEL_URL);
  const clone = useMemo(() => scene.clone(true), [scene]);
  const { actions, mixer } = useAnimations(animations, modelRef);

  useEffect(() => {
    if (!modelRef.current || !pivot.current || styled.current) return;
    enableShadows(clone);
    fitModel(clone, pivot.current);
    styled.current = true;

    bones.current = {
      head: findBone(clone, /head$/i) || findBone(clone, /head/i),
      neck: findBone(clone, /neck$/i) || findBone(clone, /neck/i),
      rightArm: findBone(clone, /rightarm$/i),
      rightForeArm: findBone(clone, /rightforearm$/i),
      rightHand: findBone(clone, /righthand$/i),
    };

    for (const [key, bone] of Object.entries(bones.current)) {
      if (bone) rest.current[key] = bone.rotation.clone();
    }
  }, [clone]);

  useEffect(() => {
    const idle = pickIdleAction(actions);
    if (!idle) return undefined;
    idle.reset().setLoop(THREE.LoopRepeat, Infinity).fadeIn(0.3).play();
    return () => idle.stop();
  }, [actions]);

  useFrame((_, delta) => {
    mixer?.update(delta);

    const { head, neck, rightArm, rightForeArm, rightHand } = bones.current;
    if (head && rest.current.head) {
      head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, rest.current.head.y + pointer.current.x * 0.32, delta * 4);
      head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, rest.current.head.x + pointer.current.y * 0.1, delta * 4);
    }
    if (neck && rest.current.neck) {
      neck.rotation.y = THREE.MathUtils.lerp(neck.rotation.y, rest.current.neck.y + pointer.current.x * 0.12, delta * 3);
    }

    if (!rightArm || !rightForeArm || !rest.current.rightArm) return;

    if (waving) {
      wavePhase.current += delta * 7;
      const swing = Math.sin(wavePhase.current) * 0.75 + Math.sin(wavePhase.current * 1.6) * 0.22;
      rightArm.rotation.z = rest.current.rightArm.z - 0.55 - swing;
      rightForeArm.rotation.z = rest.current.rightForeArm.z - 0.35 - swing * 0.45;
      if (rightHand && rest.current.rightHand) {
        rightHand.rotation.z = rest.current.rightHand.z - swing * 0.15;
      }
      return;
    }

    wavePhase.current = 0;
    rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, rest.current.rightArm.z, delta * 8);
    rightForeArm.rotation.z = THREE.MathUtils.lerp(rightForeArm.rotation.z, rest.current.rightForeArm.z, delta * 8);
    if (rightHand && rest.current.rightHand) {
      rightHand.rotation.z = THREE.MathUtils.lerp(rightHand.rotation.z, rest.current.rightHand.z, delta * 8);
    }
  });

  return (
    <group ref={pivot} position={[LAYOUT.stageOffsetX, LAYOUT.floorY, LAYOUT.forwardZ]} rotation={[0, -0.3, 0]}>
      <group ref={modelRef}>
        <primitive object={clone} />
      </group>
      <mesh position={[0, 0.03, 0]} receiveShadow>
        <cylinderGeometry args={[0.42, 0.44, 0.07, 48]} />
        <meshStandardMaterial color="#0a0a0c" roughness={0.92} metalness={0.12} />
      </mesh>
    </group>
  );
}

function FigurineScene({ waving, pointer }) {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[2.5, 4, 3]} intensity={1.3} castShadow />
      <directionalLight position={[-2, 2.5, 1.5]} intensity={0.4} color="#67e8f9" />
      <Environment preset="city" />
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.58, 48]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.11} />
      </mesh>
      <ContactShadows position={[0, 0.05, 0]} opacity={0.48} scale={2.4} blur={2.3} far={1.5} />
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
      gl={{ alpha: true, antialias: true }}
      camera={{ fov: 34, near: 0.1, far: 50, position: [0, 1.05, 3.2] }}
      onCreated={({ gl, camera }) => {
        gl.setClearColor(0x000000, 0);
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
