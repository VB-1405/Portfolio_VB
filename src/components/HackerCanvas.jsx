import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, useAnimations, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import { AVATAR_MODEL_URL } from "../data";

const WAVE_INTERVAL_MS = 12000;
const WAVE_DURATION_MS = 2500;
const WAVE_LERP_SPEED = 4.5;

const BONES = {
  head: "Head",
  neck: "Neck",
  rightArm: "RightArm",
  rightForeArm: "RightForeArm",
};

/** Wave toward camera — right arm up, head turns out of left-facing profile. */
const WAVE_OFFSETS = {
  head: { x: -0.08, y: -0.75, z: 0.05 },
  neck: { x: 0, y: -0.4, z: 0 },
  rightArm: { x: -0.5, y: 0.1, z: 1.35 },
  rightForeArm: { x: 0, y: 0, z: 1.1 },
};

const CAMERA = { position: [0.35, 1.28, 3.35], lookAt: [0.05, 0.92, 0] };

useGLTF.preload(AVATAR_MODEL_URL);

function getBone(root, name) {
  let bone = null;
  root.traverse((obj) => {
    if (!bone && obj.isBone && obj.name === name) bone = obj;
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
  return (
    <group position={[0.22, 0.48, 0.28]} rotation={[0, -Math.PI / 2, 0]}>
      <mesh position={[0, 0.36, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.15, 0.045, 0.42]} />
        <meshStandardMaterial color="#080c12" roughness={0.35} metalness={0.55} />
      </mesh>
      <mesh position={[0, 0.335, 0.19]}>
        <boxGeometry args={[1.12, 0.012, 0.02]} />
        <meshStandardMaterial color={cyan} emissive={cyan} emissiveIntensity={2.2} />
      </mesh>

      <mesh position={[0, 0.72, -0.1]} rotation={[0, 0.08, 0]}>
        <boxGeometry args={[0.95, 0.34, 0.04]} />
        <meshStandardMaterial color="#010408" roughness={0.2} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0.72, -0.115]} rotation={[0, 0.08, 0]}>
        <boxGeometry args={[0.9, 0.3, 0.006]} />
        <meshStandardMaterial
          map={codeTexture}
          emissive="#00ff88"
          emissiveIntensity={0.85}
          toneMapped={false}
        />
      </mesh>

      <mesh position={[0, 0.52, -0.04]} castShadow>
        <boxGeometry args={[0.05, 0.2, 0.04]} />
        <meshStandardMaterial color="#0f1419" metalness={0.5} roughness={0.4} />
      </mesh>

      <mesh position={[0, 0.38, 0.12]} castShadow>
        <boxGeometry args={[0.44, 0.018, 0.14]} />
        <meshStandardMaterial color="#141c28" roughness={0.45} metalness={0.35} />
      </mesh>
      <mesh position={[0.3, 0.385, 0.12]} castShadow>
        <boxGeometry args={[0.09, 0.022, 0.12]} />
        <meshStandardMaterial color="#141c28" roughness={0.45} metalness={0.35} />
      </mesh>

      <pointLight position={[0, 0.75, 0.05]} intensity={1.8} color="#00ffaa" distance={2.2} />
      <pointLight position={[0, 0.4, 0.15]} intensity={0.9} color={cyan} distance={1.6} />
    </group>
  );
}

function AvatarRig({ onWavingChange }) {
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
      if (obj.material) {
        obj.material.roughness = Math.min(obj.material.roughness ?? 0.8, 0.85);
      }
    });

    boneRefs.current = {
      head: getBone(model, BONES.head),
      neck: getBone(model, BONES.neck),
      rightArm: getBone(model, BONES.rightArm),
      rightForeArm: getBone(model, BONES.rightForeArm),
    };
  }, [model]);

  useEffect(() => {
    if (!actions) return undefined;
    const clipKey =
      names?.find((n) => /action|typing|layer/i.test(n)) ??
      names?.[0] ??
      Object.keys(actions)[0];
    const typing = clipKey ? actions[clipKey] : null;
    typingAction.current = typing;
    if (!typing) return undefined;

    typing.reset().setLoop(THREE.LoopRepeat, Infinity).fadeIn(0.2).play();
    return () => typing.fadeOut(0.2);
  }, [actions, names]);

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

  useEffect(() => {
    onWavingChange?.(isWaving);
  }, [isWaving, onWavingChange]);

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
      typing.weight = THREE.MathUtils.lerp(typing.weight, influence > 0.12 ? 0.35 : 1, delta * 3.5);
    }

    mixer?.update(delta);
    if (Math.abs(dInfluence) < 0.00001) return;

    const { head, neck, rightArm, rightForeArm } = boneRefs.current;
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
    if (rightArm) {
      rightArm.rotation.x += dInfluence * WAVE_OFFSETS.rightArm.x;
      rightArm.rotation.y += dInfluence * WAVE_OFFSETS.rightArm.y;
      rightArm.rotation.z += dInfluence * WAVE_OFFSETS.rightArm.z;
    }
    if (rightForeArm) {
      rightForeArm.rotation.x += dInfluence * WAVE_OFFSETS.rightForeArm.x;
      rightForeArm.rotation.y += dInfluence * WAVE_OFFSETS.rightForeArm.y;
      rightForeArm.rotation.z += dInfluence * WAVE_OFFSETS.rightForeArm.z;
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

function Scene() {
  const [waving, setWaving] = useState(false);
  const codeTexture = useMemo(() => createCodeTexture(), []);

  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[2, 4, 3]} intensity={0.55} color="#e2e8f0" castShadow />
      <directionalLight position={[-1.5, 2, 2]} intensity={0.25} color="#67e8f9" />
      <pointLight position={[-0.5, 1.5, 1]} intensity={0.4} color="#00f3ff" />

      <group position={[0, -1.15, 0]}>
        <CyberBackdrop />
        <GamingChair />
        <CyberDesk codeTexture={codeTexture} />
        <AvatarRig onWavingChange={setWaving} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
          <circleGeometry args={[1.6, 48]} />
          <meshStandardMaterial color="#030308" transparent opacity={0.5} />
        </mesh>
      </group>

      {waving && (
        <Html position={[0.55, 0.15, 0]} center style={{ pointerEvents: "none" }}>
          <div className="rounded border border-cyan-400/40 bg-black/80 px-2 py-1 text-[8px] font-mono uppercase tracking-widest text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.35)]">
            Waving · target: viewport
          </div>
        </Html>
      )}
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
