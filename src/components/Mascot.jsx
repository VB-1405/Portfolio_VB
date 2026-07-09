import { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Html, useAnimations, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import { AVATAR_MODEL_URL } from "../data";

const LAYOUT = { targetHeight: 1.75, floorY: 0, stageOffsetX: -0.04 };
const CAMERA = { fov: 30, position: [0, 0.98, 4.1], lookAt: [0, 0.9, 0] };

useGLTF.preload(AVATAR_MODEL_URL);

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

function RiggedAvatar({ pointer, reduceMotion }) {
  const pivot = useRef();
  const rigRef = useRef();
  const bones = useRef({});
  const rest = useRef({});
  const ready = useRef(false);

  const { scene, animations } = useGLTF(AVATAR_MODEL_URL);
  const model = useMemo(() => cloneSkinned(scene), [scene]);
  const { actions, mixer } = useAnimations(animations, rigRef);

  useLayoutEffect(() => {
    if (!rigRef.current || !pivot.current || ready.current) return;

    model.traverse((obj) => {
      if (!obj.isMesh) return;
      obj.castShadow = true;
      obj.receiveShadow = true;
    });

    fitModel(model, pivot.current);
    bones.current = { head: findBone(model, /head$/i), neck: findBone(model, /neck$/i) };
    for (const [key, bone] of Object.entries(bones.current)) {
      if (bone) rest.current[key] = bone.rotation.clone();
    }
    ready.current = true;
  }, [model]);

  useLayoutEffect(() => {
    if (!actions || !ready.current) return undefined;

    const clip =
      actions["Armature|mixamo.com|Layer0"] ||
      actions.typing ||
      Object.values(actions)[0];
    if (!clip) return undefined;

    clip.reset().setLoop(THREE.LoopRepeat, Infinity).fadeIn(0.3).play();
    return () => clip.fadeOut(0.2);
  }, [actions, model]);

  useFrame((state, delta) => {
    mixer?.update(delta);

    if (!pivot.current || reduceMotion) return;

    pivot.current.position.y = Math.sin(state.clock.elapsedTime * 1.1) * 0.015;
    pivot.current.rotation.y = THREE.MathUtils.lerp(
      pivot.current.rotation.y,
      -0.2 + pointer.current.x * 0.1,
      delta * 3,
    );
    pivot.current.rotation.x = THREE.MathUtils.lerp(
      pivot.current.rotation.x,
      pointer.current.y * 0.03,
      delta * 3,
    );

    const { head, neck } = bones.current;
    if (head && rest.current.head) {
      head.rotation.y = THREE.MathUtils.lerp(
        head.rotation.y,
        rest.current.head.y + pointer.current.x * 0.18,
        delta * 2.5,
      );
      head.rotation.x = THREE.MathUtils.lerp(
        head.rotation.x,
        rest.current.head.x + pointer.current.y * 0.06,
        delta * 2.5,
      );
    }
    if (neck && rest.current.neck) {
      neck.rotation.y = THREE.MathUtils.lerp(
        neck.rotation.y,
        rest.current.neck.y + pointer.current.x * 0.08,
        delta * 2,
      );
    }
  });

  return (
    <group ref={pivot} position={[LAYOUT.stageOffsetX, LAYOUT.floorY, 0]} rotation={[0, -0.22, 0]}>
      <group ref={rigRef}>
        <primitive object={model} />
      </group>
    </group>
  );
}

function TechPedestal() {
  const ringRef = useRef();

  useFrame((state) => {
    if (ringRef.current) ringRef.current.rotation.z = state.clock.elapsedTime * 0.4;
  });

  return (
    <group>
      <mesh position={[0, 0.025, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[0.5, 0.56, 0.05, 48]} />
        <meshStandardMaterial color="#0a1628" roughness={0.35} metalness={0.65} emissive="#0c2840" emissiveIntensity={0.35} />
      </mesh>
      <mesh position={[0, 0.055, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.42, 0.48, 48]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.45} />
      </mesh>
      <mesh ref={ringRef} position={[0, 0.062, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.34, 0.36, 64]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.5} depthWrite={false} />
      </mesh>
    </group>
  );
}

function AvatarScene({ pointer, reduceMotion }) {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 5, 4]} intensity={1.15} color="#fff8f0" castShadow />
      <directionalLight position={[-2.5, 3, 2]} intensity={0.5} color="#7dd3fc" />
      <pointLight position={[0, 1.6, 2.5]} intensity={0.35} color="#a5f3fc" />
      <Environment preset="city" />
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.68, 48]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.1} />
      </mesh>
      <ContactShadows position={[0, 0.05, 0]} opacity={0.45} scale={2.6} blur={2.4} far={1.5} color="#0ea5e9" />
      <TechPedestal />
      <RiggedAvatar pointer={pointer} reduceMotion={reduceMotion} />
    </>
  );
}

function AvatarCanvas({ pointer, reduceMotion }) {
  return (
    <Canvas
      className="w-full h-full"
      shadows
      dpr={[1, 1.75]}
      gl={{ alpha: true, antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
      camera={{ fov: CAMERA.fov, near: 0.1, far: 50, position: CAMERA.position }}
      onCreated={({ gl, camera }) => {
        gl.setClearColor(0x000000, 0);
        gl.outputColorSpace = THREE.SRGBColorSpace;
        camera.lookAt(...CAMERA.lookAt);
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
        <AvatarScene pointer={pointer} reduceMotion={reduceMotion} />
      </Suspense>
    </Canvas>
  );
}

export default function Mascot() {
  const pointer = useRef({ x: 0, y: 0 });
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    setReduceMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  return (
    <div className="hidden lg:block fixed left-0 bottom-0 z-30 pointer-events-none w-[min(36vw,340px)] h-[min(78vh,600px)] overflow-visible">
      <button
        type="button"
        onPointerMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          pointer.current = {
            x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
            y: -((e.clientY - rect.top) / rect.height) * 2 + 1,
          };
        }}
        onPointerLeave={() => {
          pointer.current = { x: 0, y: 0 };
        }}
        aria-label="Profile mascot — Vrishabh Bhavsar"
        className="pointer-events-auto relative h-full w-full cursor-default border-0 bg-transparent p-0 pl-1 pt-6 pb-2 outline-none overflow-visible"
      >
        <AvatarCanvas pointer={pointer} reduceMotion={reduceMotion} />
      </button>
    </div>
  );
}
