import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, useAnimations, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import { AVATAR_MODEL_URL } from "../data";

const WAVE_INTERVAL_MS = 12000;
const WAVE_DURATION_MS = 2500;
const WAVE_LERP_SPEED = 5;

const BONES = {
  head: "mixamorig9:Head",
  neck: "mixamorig9:Neck",
  leftArm: "mixamorig9:LeftArm",
  leftForeArm: "mixamorig9:LeftForeArm",
};

/** Additive euler offsets applied while waving (on top of typing clip). */
const WAVE_OFFSETS = {
  head: { x: -0.14, y: 0.95, z: 0 },
  neck: { x: 0, y: 0.55, z: 0 },
  leftArm: { x: 0.45, y: 0.05, z: -1.35 },
  leftForeArm: { x: 0, y: 0, z: -1.2 },
};

useGLTF.preload(AVATAR_MODEL_URL);

function getBone(root, name) {
  let bone = null;
  root.traverse((obj) => {
    if (!bone && obj.isBone && obj.name === name) bone = obj;
  });
  return bone;
}

function CyberDesk() {
  return (
    <group position={[0.15, -1.2, 0.35]} rotation={[0, -Math.PI / 2, 0]}>
      <mesh position={[0, 0.78, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.05, 0.04, 0.38]} />
        <meshStandardMaterial color="#0a0f18" roughness={0.4} metalness={0.5} />
      </mesh>

      <mesh position={[0, 1.08, -0.14]}>
        <boxGeometry args={[0.8, 0.3, 0.03]} />
        <meshStandardMaterial
          color="#020810"
          emissive="#00f3ff"
          emissiveIntensity={2}
          roughness={0.15}
          metalness={0.35}
        />
      </mesh>
      <mesh position={[0, 1.08, -0.155]}>
        <boxGeometry args={[0.74, 0.26, 0.008]} />
        <meshBasicMaterial color="#00f3ff" transparent opacity={0.88} />
      </mesh>

      <mesh position={[0, 0.1, -0.05]} castShadow>
        <boxGeometry args={[0.06, 0.18, 0.04]} />
        <meshStandardMaterial color="#111827" roughness={0.4} metalness={0.5} />
      </mesh>

      <mesh position={[0, 0.8, 0.1]} castShadow>
        <boxGeometry args={[0.42, 0.015, 0.13]} />
        <meshStandardMaterial color="#1a2332" roughness={0.5} metalness={0.3} />
      </mesh>

      <pointLight position={[0, 1.1, 0.02]} intensity={1.6} color="#00f3ff" distance={2.5} />
    </group>
  );
}

function AvatarRig() {
  const group = useRef();
  const boneRefs = useRef({});
  const waveInfluence = useRef(0);
  const prevInfluence = useRef(0);
  const typingAction = useRef(null);

  const [isWaving, setIsWaving] = useState(false);

  const { scene, animations } = useGLTF(AVATAR_MODEL_URL);
  const model = useMemo(() => cloneSkinned(scene), [scene]);
  const { actions, names, mixer } = useAnimations(animations, group);

  useLayoutEffect(() => {
    model.traverse((obj) => {
      if (!obj.isMesh) return;
      obj.castShadow = true;
      obj.receiveShadow = true;
    });

    boneRefs.current = {
      head: getBone(model, BONES.head),
      neck: getBone(model, BONES.neck),
      leftArm: getBone(model, BONES.leftArm),
      leftForeArm: getBone(model, BONES.leftForeArm),
    };
  }, [model]);

  useEffect(() => {
    if (!actions) return undefined;

    console.log("[HackerCanvas] actions:", actions);
    console.log("[HackerCanvas] names:", names);
    console.log(
      "[HackerCanvas] clips:",
      animations.map((clip) => clip.name),
    );

    const firstKey = names?.[0] ?? Object.keys(actions)[0];
    const typing = firstKey ? actions[firstKey] : null;
    typingAction.current = typing;

    if (!typing) {
      console.warn("[HackerCanvas] No animation action available.");
      return undefined;
    }

    typing.reset();
    typing.setLoop(THREE.LoopRepeat, Infinity);
    typing.clampWhenFinished = false;
    typing.enabled = true;
    typing.weight = 1;
    typing.play();

    console.log("[HackerCanvas] playing:", typing.getClip().name);

    return () => typing.stop();
  }, [actions, names, animations]);

  useEffect(() => {
    let waveTimeout;

    const interval = setInterval(() => {
      setIsWaving(true);
      waveTimeout = setTimeout(() => setIsWaving(false), WAVE_DURATION_MS);
    }, WAVE_INTERVAL_MS);

    return () => {
      clearInterval(interval);
      clearTimeout(waveTimeout);
    };
  }, []);

  useFrame((_, delta) => {
    const typing = typingAction.current;
    const targetInfluence = isWaving ? 1 : 0;

    waveInfluence.current = THREE.MathUtils.lerp(
      waveInfluence.current,
      targetInfluence,
      delta * WAVE_LERP_SPEED,
    );

    const influence = waveInfluence.current;
    const dInfluence = influence - prevInfluence.current;
    prevInfluence.current = influence;

    if (typing) {
      typing.weight = THREE.MathUtils.lerp(typing.weight, influence > 0.15 ? 0.25 : 1, delta * 4);
    }

    mixer?.update(delta);

    if (Math.abs(dInfluence) < 0.00001) return;

    const { head, neck, leftArm, leftForeArm } = boneRefs.current;

    if (head) {
      head.rotation.x += dInfluence * WAVE_OFFSETS.head.x;
      head.rotation.y += dInfluence * WAVE_OFFSETS.head.y;
      head.rotation.z += dInfluence * WAVE_OFFSETS.head.z;
    }
    if (neck) {
      neck.rotation.x += dInfluence * WAVE_OFFSETS.neck.x;
      neck.rotation.y += dInfluence * WAVE_OFFSETS.neck.y;
      neck.rotation.z += dInfluence * WAVE_OFFSETS.neck.z;
    }
    if (leftArm) {
      leftArm.rotation.x += dInfluence * WAVE_OFFSETS.leftArm.x;
      leftArm.rotation.y += dInfluence * WAVE_OFFSETS.leftArm.y;
      leftArm.rotation.z += dInfluence * WAVE_OFFSETS.leftArm.z;
    }
    if (leftForeArm) {
      leftForeArm.rotation.x += dInfluence * WAVE_OFFSETS.leftForeArm.x;
      leftForeArm.rotation.y += dInfluence * WAVE_OFFSETS.leftForeArm.y;
      leftForeArm.rotation.z += dInfluence * WAVE_OFFSETS.leftForeArm.z;
    }
  });

  return (
    <group ref={group} position={[0, -1.2, -0.5]} scale={1.8} rotation={[0, -Math.PI / 2, 0]}>
      <primitive object={model} />
    </group>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 4, 2]} intensity={0.65} color="#f8fafc" castShadow />
      <directionalLight position={[-2, 3, 3]} intensity={0.3} color="#67e8f9" />
      <CyberDesk />
      <AvatarRig />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.18, 0]} receiveShadow>
        <circleGeometry args={[1.4, 48]} />
        <meshStandardMaterial color="#050508" transparent opacity={0.3} />
      </mesh>
    </>
  );
}

/** Left hero panel — desktop only (lg+). Fills parent container. */
export default function HackerCanvas() {
  return (
    <Canvas
      className="h-full w-full"
      shadows
      dpr={[1, 1.5]}
      camera={{ position: [0, 1.5, 4], fov: 45, near: 0.1, far: 50 }}
      gl={{ antialias: true, alpha: true }}
      onCreated={({ gl, camera }) => {
        gl.setClearColor(0x000000, 0);
        gl.outputColorSpace = THREE.SRGBColorSpace;
        camera.lookAt(0, 1.1, 0);
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
        <Scene />
      </Suspense>
    </Canvas>
  );
}
