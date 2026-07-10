import { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Html, useAnimations, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import { AVATAR_MODEL_URL } from "../data";

const WAVE_INTERVAL_MS = { min: 10000, max: 12000 };
const WAVE_IN_S = 0.55;
const WAVE_HOLD_S = 2;
const WAVE_OUT_S = 0.55;

const CHARACTER_HEIGHT = 1.72;
const CAMERA = { fov: 28, position: [0, 0.92, 2.05], lookAt: [0, 0.82, 0] };

useGLTF.preload(AVATAR_MODEL_URL);

function findBone(root, pattern) {
  let match = null;
  root.traverse((obj) => {
    if (!match && obj.isBone && pattern.test(obj.name)) match = obj;
  });
  return match;
}

function pickAnimation(actions) {
  if (!actions) return null;
  return (
    actions["Armature|mixamo.com|Layer0"] ||
    actions.typing ||
    actions.Typing ||
    actions.idle ||
    actions.Idle ||
    Object.values(actions)[0]
  );
}

function fitCharacter(root, pivot) {
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
  root.position.set(-center.x, -box.min.y + 0.02, -center.z - 0.05);
  pivot.scale.setScalar(CHARACTER_HEIGHT / Math.max(0.001, size.y));
}

function TechPedestal() {
  const ringRef = useRef();

  useFrame((state) => {
    if (ringRef.current) ringRef.current.rotation.z = state.clock.elapsedTime * 0.4;
  });

  return (
    <group position={[0, 0.02, 0.15]}>
      <mesh position={[0, 0.025, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[0.52, 0.58, 0.05, 48]} />
        <meshStandardMaterial color="#0a1628" roughness={0.35} metalness={0.65} emissive="#0c2840" emissiveIntensity={0.35} />
      </mesh>
      <mesh position={[0, 0.055, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.44, 0.5, 48]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.45} />
      </mesh>
      <mesh ref={ringRef} position={[0, 0.062, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.36, 0.38, 64]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.5} depthWrite={false} />
      </mesh>
    </group>
  );
}

function Workstation() {
  return (
    <group position={[0, 0.74, 0.38]}>
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.1, 0.05, 0.44]} />
        <meshStandardMaterial color="#0b1220" roughness={0.35} metalness={0.55} />
      </mesh>

      <mesh position={[0, 0.3, -0.06]} castShadow>
        <boxGeometry args={[0.88, 0.36, 0.04]} />
        <meshStandardMaterial
          color="#061018"
          emissive="#00f3ff"
          emissiveIntensity={1.5}
          roughness={0.2}
          metalness={0.4}
        />
      </mesh>
      <mesh position={[0, 0.3, -0.085]}>
        <boxGeometry args={[0.84, 0.32, 0.01]} />
        <meshStandardMaterial
          color="#00f3ff"
          emissive="#00f3ff"
          emissiveIntensity={2.2}
          transparent
          opacity={0.92}
        />
      </mesh>
      <mesh position={[0, 0.11, -0.04]} castShadow>
        <boxGeometry args={[0.06, 0.18, 0.04]} />
        <meshStandardMaterial color="#111827" roughness={0.4} metalness={0.5} />
      </mesh>

      <mesh position={[0, 0.04, 0.1]} castShadow receiveShadow>
        <boxGeometry args={[0.44, 0.02, 0.14]} />
        <meshStandardMaterial color="#1e293b" roughness={0.45} metalness={0.35} />
      </mesh>

      <mesh position={[0.29, 0.045, 0.1]} castShadow>
        <boxGeometry args={[0.08, 0.025, 0.12]} />
        <meshStandardMaterial color="#1e293b" roughness={0.45} metalness={0.35} />
      </mesh>

      <pointLight position={[0, 1.0, 0.32]} intensity={1.1} color="#00f3ff" distance={1.8} />
    </group>
  );
}

function HackerCharacter() {
  const pivot = useRef();
  const rigRef = useRef();
  const bones = useRef({});
  const ready = useRef(false);
  const waveMix = useRef(0);
  const prevWaveMix = useRef(0);
  const waveClock = useRef({ active: false, start: 0 });

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

    fitCharacter(model, pivot.current);
    bones.current = {
      head: findBone(model, /mixamorig9Head|Head$/i),
      neck: findBone(model, /mixamorig9Neck|Neck$/i),
      leftArm: findBone(model, /mixamorig9LeftArm|LeftArm$/i),
      leftForeArm: findBone(model, /mixamorig9LeftForeArm|LeftForeArm$/i),
      leftHand: findBone(model, /mixamorig9LeftHand|LeftHand$/i),
    };
    ready.current = true;
  }, [model]);

  useLayoutEffect(() => {
    if (!actions || !ready.current) return undefined;
    const clip = pickAnimation(actions);
    if (!clip) return undefined;
    clip.reset().setLoop(THREE.LoopRepeat, Infinity).fadeIn(0.3).play();
    return () => clip.fadeOut(0.2);
  }, [actions, model]);

  useEffect(() => {
    let timeoutId;
    const scheduleWave = () => {
      const delay =
        WAVE_INTERVAL_MS.min +
        Math.random() * (WAVE_INTERVAL_MS.max - WAVE_INTERVAL_MS.min);
      timeoutId = setTimeout(() => {
        waveClock.current = { active: true, start: performance.now() / 1000 };
        scheduleWave();
      }, delay);
    };
    scheduleWave();
    return () => clearTimeout(timeoutId);
  }, []);

  useFrame((state, delta) => {
    mixer?.update(delta);
    if (!ready.current) return;

    const now = performance.now() / 1000;
    let targetMix = 0;
    if (waveClock.current.active) {
      const t = now - waveClock.current.start;
      const total = WAVE_IN_S + WAVE_HOLD_S + WAVE_OUT_S;
      if (t < WAVE_IN_S) targetMix = t / WAVE_IN_S;
      else if (t < WAVE_IN_S + WAVE_HOLD_S) targetMix = 1;
      else if (t < total) targetMix = 1 - (t - WAVE_IN_S - WAVE_HOLD_S) / WAVE_OUT_S;
      else waveClock.current.active = false;
    }

    waveMix.current = THREE.MathUtils.lerp(waveMix.current, targetMix, delta * 5);
    const mix = waveMix.current;
    const dMix = mix - prevWaveMix.current;
    prevWaveMix.current = mix;

    const { head, neck, leftArm, leftForeArm, leftHand } = bones.current;
    if (head) {
      head.rotation.y += dMix * 0.72;
      head.rotation.x -= dMix * 0.12;
    }
    if (neck) neck.rotation.y += dMix * 0.22;
    if (leftArm) {
      leftArm.rotation.z -= dMix * 1.05;
      leftArm.rotation.x += dMix * 0.35;
    }
    if (leftForeArm) leftForeArm.rotation.z -= dMix * 0.85;
    if (leftHand) leftHand.rotation.z += dMix * 0.25;
  });

  return (
    <group ref={pivot} rotation={[0, -0.2, 0]}>
      <group ref={rigRef}>
        <primitive object={model} />
      </group>
    </group>
  );
}

function HackerScene() {
  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight position={[2.5, 4, 3]} intensity={0.7} color="#e2e8f0" castShadow />
      <directionalLight position={[-2, 2.5, 2]} intensity={0.35} color="#38bdf8" />
      <Environment preset="city" />
      <ContactShadows position={[0, 0.04, 0.1]} opacity={0.4} scale={2.8} blur={2.2} far={1.6} color="#0ea5e9" />
      <TechPedestal />
      <Workstation />
      <HackerCharacter />
    </>
  );
}

/** Full-height left-panel 3D avatar — desktop only (lg+). */
export default function HackerCanvas() {
  return (
    <div
      className="hidden lg:block fixed left-0 bottom-0 z-30 pointer-events-none w-[min(38vw,380px)] h-[min(88vh,680px)]"
      aria-hidden="true"
    >
      <Canvas
        className="h-full w-full"
        shadows
        dpr={[1, 1.75]}
        gl={{
          antialias: true,
          alpha: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.08,
        }}
        camera={{ fov: CAMERA.fov, near: 0.1, far: 30, position: CAMERA.position }}
        onCreated={({ gl, camera }) => {
          gl.setClearColor(0x000000, 0);
          gl.outputColorSpace = THREE.SRGBColorSpace;
          camera.lookAt(...CAMERA.lookAt);
        }}
      >
        <Suspense
          fallback={
            <Html center>
              <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400/70">
                Loading avatar…
              </span>
            </Html>
          }
        >
          <HackerScene />
        </Suspense>
      </Canvas>
    </div>
  );
}
