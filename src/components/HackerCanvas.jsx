import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, useAnimations, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import { AVATAR_MODEL_URL } from "../data";

const WAVE_INTERVAL_MS = 12000;
const WAVE_HOLD_S = 2.5;
const WAVE_BLEND_S = 0.55;

const BONE_NAMES = {
  head: "mixamorig9:Head",
  neck: "mixamorig9:Neck",
  leftArm: "mixamorig9:LeftArm",
  leftForeArm: "mixamorig9:LeftForeArm",
};

const WAVE_POSE = {
  head: { x: -0.1, y: 0.85, z: 0 },
  neck: { x: 0, y: 0.45, z: 0 },
  leftArm: { x: 0.35, y: 0, z: -1.25 },
  leftForeArm: { x: 0, y: 0, z: -1.1 },
};

useGLTF.preload(AVATAR_MODEL_URL);

function findBone(root, names) {
  const list = Array.isArray(names) ? names : [names];
  let match = null;
  root.traverse((obj) => {
    if (match || !obj.isBone) return;
    if (list.includes(obj.name)) {
      match = obj;
      return;
    }
    const normalized = obj.name.replace(/^mixamorig9/, "mixamorig9:");
    if (list.some((n) => normalized === n || obj.name === n.replace(":", ""))) {
      match = obj;
    }
  });
  return match;
}

function pickTypingAction(actions) {
  if (!actions) return null;
  return (
    actions["Armature|mixamo.com|Layer0"] ||
    actions.typing ||
    actions.Typing ||
    Object.values(actions).find((a) => a?.getClip()?.name?.toLowerCase().includes("typing")) ||
    Object.values(actions)[0]
  );
}

function CyberDesk() {
  return (
    <group position={[0.55, 0.05, 0]} rotation={[0, -Math.PI / 2, 0]}>
      <mesh position={[0, 0.72, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.05, 0.04, 0.38]} />
        <meshStandardMaterial color="#0a0f18" roughness={0.4} metalness={0.5} />
      </mesh>

      <mesh position={[0, 1.02, -0.12]}>
        <boxGeometry args={[0.75, 0.28, 0.03]} />
        <meshStandardMaterial
          color="#020810"
          emissive="#00f3ff"
          emissiveIntensity={2}
          roughness={0.15}
          metalness={0.35}
        />
      </mesh>
      <mesh position={[0, 1.02, -0.135]}>
        <boxGeometry args={[0.7, 0.24, 0.008]} />
        <meshBasicMaterial color="#00f3ff" transparent opacity={0.85} />
      </mesh>

      <mesh position={[0, 0.76, 0.08]} castShadow>
        <boxGeometry args={[0.38, 0.015, 0.12]} />
        <meshStandardMaterial color="#1a2332" roughness={0.5} metalness={0.3} />
      </mesh>

      <pointLight position={[0, 1.05, 0.05]} intensity={1.4} color="#00f3ff" distance={2.2} />
    </group>
  );
}

function AvatarRig() {
  const rigRef = useRef();
  const bones = useRef({});
  const waveMix = useRef(0);
  const prevWaveMix = useRef(0);
  const wavePhase = useRef("idle");
  const waveStart = useRef(0);
  const typingAction = useRef(null);
  const ready = useRef(false);

  const [isWaving, setIsWaving] = useState(false);

  const { scene, animations } = useGLTF(AVATAR_MODEL_URL);
  const model = useMemo(() => cloneSkinned(scene), [scene]);
  const { actions, mixer } = useAnimations(animations, rigRef);

  useLayoutEffect(() => {
    if (!rigRef.current || ready.current) return;

    model.traverse((obj) => {
      if (!obj.isMesh) return;
      obj.castShadow = true;
      obj.receiveShadow = true;
    });

    bones.current = {
      head: findBone(model, [BONE_NAMES.head, "mixamorig9Head"]),
      neck: findBone(model, [BONE_NAMES.neck, "mixamorig9Neck"]),
      leftArm: findBone(model, [BONE_NAMES.leftArm, "mixamorig9LeftArm"]),
      leftForeArm: findBone(model, [BONE_NAMES.leftForeArm, "mixamorig9LeftForeArm"]),
    };

    ready.current = true;
  }, [model]);

  useLayoutEffect(() => {
    if (!actions || !ready.current) return undefined;

    const typing = pickTypingAction(actions);
    typingAction.current = typing;
    if (!typing) return undefined;

    typing.reset().setLoop(THREE.LoopRepeat, Infinity).fadeIn(0.25).play();
    return () => typing.fadeOut(0.2);
  }, [actions, model]);

  useEffect(() => {
    const id = setInterval(() => {
      setIsWaving(true);
      wavePhase.current = "in";
      waveStart.current = performance.now() / 1000;
    }, WAVE_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!isWaving) return;
    wavePhase.current = "in";
    waveStart.current = performance.now() / 1000;
  }, [isWaving]);

  useFrame((_, delta) => {
    const typing = typingAction.current;
    const mix = waveMix.current;

    if (typing) {
      typing.weight = wavePhase.current === "idle" && mix < 0.05 ? 1 : Math.max(0, 1 - mix * 1.4);
    }
    mixer?.update(delta);
    if (!ready.current) return;

    const now = performance.now() / 1000;
    const elapsed = now - waveStart.current;
    let targetMix = 0;

    if (wavePhase.current !== "idle") {
      if (wavePhase.current === "in") {
        targetMix = Math.min(1, elapsed / WAVE_BLEND_S);
        if (targetMix >= 1) {
          wavePhase.current = "hold";
          waveStart.current = now;
        }
      } else if (wavePhase.current === "hold") {
        targetMix = 1;
        if (elapsed >= WAVE_HOLD_S) {
          wavePhase.current = "out";
          waveStart.current = now;
        }
      } else if (wavePhase.current === "out") {
        targetMix = 1 - Math.min(1, elapsed / WAVE_BLEND_S);
        if (targetMix <= 0) {
          targetMix = 0;
          wavePhase.current = "idle";
          setIsWaving(false);
          if (typing) {
            typing.reset().setLoop(THREE.LoopRepeat, Infinity).fadeIn(0.3).play();
          }
        }
      }
    }

    waveMix.current = THREE.MathUtils.lerp(waveMix.current, targetMix, delta * 6);
    const blended = waveMix.current;
    const dMix = blended - prevWaveMix.current;
    prevWaveMix.current = blended;

    if (Math.abs(dMix) < 0.00001) return;

    const { head, neck, leftArm, leftForeArm } = bones.current;
    if (head) {
      head.rotation.x += dMix * WAVE_POSE.head.x;
      head.rotation.y += dMix * WAVE_POSE.head.y;
      head.rotation.z += dMix * WAVE_POSE.head.z;
    }
    if (neck) {
      neck.rotation.x += dMix * WAVE_POSE.neck.x;
      neck.rotation.y += dMix * WAVE_POSE.neck.y;
      neck.rotation.z += dMix * WAVE_POSE.neck.z;
    }
    if (leftArm) {
      leftArm.rotation.x += dMix * WAVE_POSE.leftArm.x;
      leftArm.rotation.y += dMix * WAVE_POSE.leftArm.y;
      leftArm.rotation.z += dMix * WAVE_POSE.leftArm.z;
    }
    if (leftForeArm) {
      leftForeArm.rotation.x += dMix * WAVE_POSE.leftForeArm.x;
      leftForeArm.rotation.y += dMix * WAVE_POSE.leftForeArm.y;
      leftForeArm.rotation.z += dMix * WAVE_POSE.leftForeArm.z;
    }
  });

  return (
    <group position={[0, -1.2, 0]} scale={1.8} rotation={[0, -Math.PI / 2, 0]}>
      <group ref={rigRef}>
        <primitive object={model} />
      </group>
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
        <meshStandardMaterial color="#050508" transparent opacity={0.35} />
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
