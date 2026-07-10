import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, useAnimations, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import { AVATAR_MODEL_URL } from "../data";

const INTERACT_INTERVAL_MS = 8000;
const INTERACT_DURATION_MS = 2500;
const INTERACT_LERP_SPEED = 4.5;
const MONITOR_Y_ROT = THREE.MathUtils.degToRad(-25);

const BONES = {
  head: ["mixamorig9:Head", "Head"],
  neck: ["mixamorig9:Neck", "Neck"],
};

/** Smooth head/neck turn from left profile toward the viewport. */
const LOOK_OFFSETS = {
  head: { x: -0.08, y: -0.75, z: 0.05 },
  neck: { x: 0, y: -0.4, z: 0 },
};

const CAMERA = { position: [0.35, 1.28, 3.35], lookAt: [0.05, 0.92, 0] };

useGLTF.preload(AVATAR_MODEL_URL);

function getBone(root, names) {
  const list = Array.isArray(names) ? names : [names];
  let bone = null;
  root.traverse((obj) => {
    if (!bone && obj.isBone && list.includes(obj.name)) bone = obj;
  });
  return bone;
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

function GamingChair() {
  const glow = "#00f3ff";
  return (
    <group position={[-0.08, 0.42, -0.12]}>
      <mesh position={[0, 0.18, 0]} castShadow>
        <boxGeometry args={[0.52, 0.08, 0.48]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.55} metalness={0.35} />
      </mesh>
      <mesh position={[0, 0.55, -0.18]} castShadow>
        <boxGeometry args={[0.48, 0.62, 0.08]} />
        <meshStandardMaterial color="#0c0c0c" roughness={0.5} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0.22, -0.02]}>
        <boxGeometry args={[0.54, 0.03, 0.5]} />
        <meshStandardMaterial color={glow} emissive={glow} emissiveIntensity={1.8} />
      </mesh>
      <mesh position={[0, 0.62, -0.18]}>
        <boxGeometry args={[0.5, 0.58, 0.02]} />
        <meshStandardMaterial color={glow} emissive={glow} emissiveIntensity={1.2} transparent opacity={0.85} />
      </mesh>
      <mesh position={[-0.28, 0.38, 0]} castShadow>
        <boxGeometry args={[0.06, 0.28, 0.38]} />
        <meshStandardMaterial color="#111" roughness={0.6} />
      </mesh>
      <mesh position={[0.28, 0.38, 0]} castShadow>
        <boxGeometry args={[0.06, 0.28, 0.38]} />
        <meshStandardMaterial color="#111" roughness={0.6} />
      </mesh>
    </group>
  );
}

function CyberDesk({ codeTexture }) {
  const cyan = "#00f3ff";
  const magenta = "#ff00f3";

  return (
    <group position={[0.22, 0.48, 0.28]} rotation={[0, -Math.PI / 2, 0]}>
      <mesh position={[0, 0.36, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.15, 0.045, 0.42]} />
        <meshStandardMaterial
          color="#061820"
          emissive={cyan}
          emissiveIntensity={0.22}
          roughness={0.35}
          metalness={0.55}
        />
      </mesh>
      <mesh position={[0, 0.335, 0.19]}>
        <boxGeometry args={[1.12, 0.012, 0.02]} />
        <meshStandardMaterial color={cyan} emissive={cyan} emissiveIntensity={2.2} />
      </mesh>

      <group position={[0, 0.72, -0.1]} rotation={[0, MONITOR_Y_ROT, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.95, 0.34, 0.05]} />
          <meshStandardMaterial color="#010408" roughness={0.2} metalness={0.4} />
        </mesh>
        <mesh position={[0, 0, -0.004]}>
          <boxGeometry args={[0.9, 0.3, 0.05]} />
          <meshStandardMaterial
            map={codeTexture}
            emissive={magenta}
            emissiveIntensity={15}
            toneMapped={false}
          />
        </mesh>
      </group>

      <mesh position={[0, 0.52, -0.04]} castShadow>
        <boxGeometry args={[0.05, 0.2, 0.04]} />
        <meshStandardMaterial color="#0f1419" metalness={0.5} roughness={0.4} />
      </mesh>

      <group position={[0, 0.38, 0.05]}>
        <mesh castShadow>
          <boxGeometry args={[0.44, 0.018, 0.14]} />
          <meshStandardMaterial color="#141c28" roughness={0.45} metalness={0.35} />
        </mesh>
        <mesh position={[0.3, 0.005, 0]} castShadow>
          <boxGeometry args={[0.09, 0.022, 0.12]} />
          <meshStandardMaterial color="#141c28" roughness={0.45} metalness={0.35} />
        </mesh>
      </group>

      <pointLight position={[0, 0.75, 0.05]} intensity={2.4} color={magenta} distance={2.4} />
      <pointLight position={[0, 0.4, 0.15]} intensity={0.9} color={cyan} distance={1.6} />
    </group>
  );
}

function AvatarRig({ isInteracting }) {
  const group = useRef();
  const boneRefs = useRef({});
  const interactInfluence = useRef(0);
  const prevInfluence = useRef(0);

  const { scene, animations } = useGLTF(AVATAR_MODEL_URL);
  const model = useMemo(() => cloneSkinned(scene), [scene]);
  const { actions, names, mixer } = useAnimations(animations, group);

  useLayoutEffect(() => {
    model.traverse((obj) => {
      if (!obj.isMesh) return;
      obj.castShadow = true;
      obj.receiveShadow = true;
      if (obj.material) {
        obj.material.roughness = Math.min(obj.material.roughness ?? 0.8, 0.85);
      }
    });

    boneRefs.current = {
      head: getBone(model, BONES.head),
      neck: getBone(model, BONES.neck),
    };
  }, [model]);

  useEffect(() => {
    if (!actions) return undefined;
    const clipKey =
      names?.find((n) => /action|typing|layer/i.test(n)) ??
      names?.[0] ??
      Object.keys(actions)[0];
    const typing = clipKey ? actions[clipKey] : null;
    if (!typing) return undefined;

    typing.reset().setLoop(THREE.LoopRepeat, Infinity).fadeIn(0.2).play();
    return () => typing.fadeOut(0.2);
  }, [actions, names]);

  useFrame((_, delta) => {
    const targetInfluence = isInteracting ? 1 : 0;

    interactInfluence.current = THREE.MathUtils.lerp(
      interactInfluence.current,
      targetInfluence,
      delta * INTERACT_LERP_SPEED,
    );

    const influence = interactInfluence.current;
    const dInfluence = influence - prevInfluence.current;
    prevInfluence.current = influence;

    mixer?.update(delta);

    if (Math.abs(dInfluence) < 0.00001) return;

    const { head, neck } = boneRefs.current;
    if (head) {
      head.rotation.x += dInfluence * LOOK_OFFSETS.head.x;
      head.rotation.y += dInfluence * LOOK_OFFSETS.head.y;
      head.rotation.z += dInfluence * LOOK_OFFSETS.head.z;
    }
    if (neck) {
      neck.rotation.x += dInfluence * LOOK_OFFSETS.neck.x;
      neck.rotation.y += dInfluence * LOOK_OFFSETS.neck.y;
      neck.rotation.z += dInfluence * LOOK_OFFSETS.neck.z;
    }
  });

  return (
    <group ref={group} position={[0, 0.48, -0.08]} scale={1.65} rotation={[0, -Math.PI / 2, 0]}>
      <primitive object={model} />
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

function ConsoleOverlay({ isInteracting, secondsToNext }) {
  return (
    <Html position={[0.55, 0.05, 0]} style={{ pointerEvents: "none" }}>
      <div className="w-[148px] rounded border border-cyan-400/30 bg-black/85 p-2 font-mono text-[7px] leading-relaxed text-cyan-300/90 shadow-[0_0_14px_rgba(255,0,243,0.2)]">
        <div className="mb-1 border-b border-white/10 pb-1 text-[8px] uppercase tracking-widest text-cyan-400">
          Console
        </div>
        <div>
          {isInteracting
            ? "WAVE: engaging viewer"
            : `Sequence active | Time to wave in ${secondsToNext}s`}
        </div>
        <div className="text-fuchsia-400/90">
          {isInteracting ? "Resuming task…" : "Animated Sequence: 8s intervals"}
        </div>
      </div>
    </Html>
  );
}

function Scene() {
  const [isInteracting, setIsInteracting] = useState(false);
  const [secondsToNext, setSecondsToNext] = useState(8);
  const codeTexture = useMemo(() => createCodeTexture(), []);

  useEffect(() => {
    let interactTimeout;
    const tick = setInterval(() => {
      setSecondsToNext((prev) => (prev <= 1 ? INTERACT_INTERVAL_MS / 1000 : prev - 1));
    }, 1000);

    const interval = setInterval(() => {
      setIsInteracting(true);
      setSecondsToNext(INTERACT_INTERVAL_MS / 1000);
      interactTimeout = setTimeout(() => setIsInteracting(false), INTERACT_DURATION_MS);
    }, INTERACT_INTERVAL_MS);

    return () => {
      clearInterval(interval);
      clearInterval(tick);
      clearTimeout(interactTimeout);
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
        <GamingChair />
        <CyberDesk codeTexture={codeTexture} />
        <AvatarRig isInteracting={isInteracting} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
          <circleGeometry args={[1.6, 48]} />
          <meshStandardMaterial color="#030308" transparent opacity={0.5} />
        </mesh>
      </group>

      <ConsoleOverlay isInteracting={isInteracting} secondsToNext={secondsToNext} />
    </>
  );
}

/** Left hero panel — desktop hacker workstation scene (lg+). */
export default function HackerCanvas() {
  return (
    <Canvas
      className="h-full w-full"
      shadows
      dpr={[1, 1.75]}
      camera={{ position: CAMERA.position, fov: 42, near: 0.1, far: 50 }}
      gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping }}
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
