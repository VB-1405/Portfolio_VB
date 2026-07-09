import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, OrthographicCamera, useTexture } from "@react-three/drei";
import * as THREE from "three";

const asset = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
const WAVE_MS = 1400;

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
    const start = setTimeout(wave, 1800);
    return () => clearTimeout(start);
  }, [reduceMotion, wave]);

  const waving = !reduceMotion && (hovering || greeting);

  return { hovering, setHovering, waving, wave, reduceMotion };
}

/** Static figurine body — never rotates or sways. */
function FigurineBody() {
  const texture = useTexture(asset("memoji-figurine-idle.png"));
  texture.colorSpace = THREE.SRGBColorSpace;

  return (
    <mesh position={[0, 0.95, 0]} renderOrder={1}>
      <planeGeometry args={[1.35, 2.05]} />
      <meshBasicMaterial map={texture} transparent alphaTest={0.02} toneMapped={false} />
    </mesh>
  );
}

/** Right arm — pivots at shoulder only (Rohan-style wave, body stays planted). */
function FigurineArm({ waving }) {
  const pivot = useRef();
  const arm = useRef();
  const phase = useRef(0);
  const texture = useTexture(asset("memoji-arm-idle.png"));
  texture.colorSpace = THREE.SRGBColorSpace;

  useFrame((_, delta) => {
    if (!pivot.current) return;

    if (!waving) {
      pivot.current.rotation.z = THREE.MathUtils.lerp(pivot.current.rotation.z, 0.22, delta * 6);
      return;
    }

    phase.current += delta * 7.5;
    const swing = Math.sin(phase.current) * 0.55 + Math.sin(phase.current * 1.7) * 0.2;
    pivot.current.rotation.z = 0.22 + swing;
  });

  return (
    <group ref={pivot} position={[0.38, 1.38, 0.02]} renderOrder={2}>
      <mesh ref={arm} position={[0, -0.22, 0]}>
        <planeGeometry args={[0.34, 0.48]} />
        <meshBasicMaterial map={texture} transparent alphaTest={0.02} toneMapped={false} />
      </mesh>
    </group>
  );
}

function SceneLights() {
  return (
    <>
      <ambientLight intensity={0.85} />
      <directionalLight position={[2, 4, 3]} intensity={1.1} />
      <directionalLight position={[-2, 2, 1]} intensity={0.35} color="#67e8f9" />
    </>
  );
}

function FigurineStage({ waving }) {
  const scale = 1;

  return (
    <group scale={scale} rotation={[0, -0.18, 0]}>
      <FigurineBody />
      <FigurineArm waving={waving} />
      <mesh position={[0, 0.02, -0.05]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={0}>
        <circleGeometry args={[0.42, 48]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.14} />
      </mesh>
      <ContactShadows
        position={[0, 0.01, 0]}
        opacity={0.45}
        scale={1.4}
        blur={2.2}
        far={1.2}
        color="#000000"
      />
    </group>
  );
}

function FigurineCanvas({ waving }) {
  return (
    <Canvas
      className="w-full h-full"
      gl={{ alpha: true, antialias: true }}
      dpr={[1, 2]}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
      }}
    >
      <OrthographicCamera makeDefault position={[0, 1.1, 6]} zoom={95} />
      <Suspense fallback={null}>
        <SceneLights />
        <FigurineStage waving={waving} />
      </Suspense>
    </Canvas>
  );
}

/**
 * 3D Memoji figurine — Rohan-style: WebGL stage on the left, body planted, arm waves.
 */
function MascotCompanion() {
  const { hovering, setHovering, waving, wave } = useFigurineWave();

  return (
    <div className="hidden xl:block fixed left-0 bottom-0 z-30 pointer-events-none w-[min(30vw,280px)] h-[min(68vh,520px)]">
      <button
        type="button"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        onFocus={() => setHovering(true)}
        onBlur={() => setHovering(false)}
        onClick={wave}
        aria-label="Profile mascot — Vrishabh Bhavsar, wave hello"
        className="pointer-events-auto relative h-full w-full cursor-pointer border-0 bg-transparent p-0 pl-2 outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded-lg"
      >
        <FigurineCanvas waving={waving} />
      </button>
    </div>
  );
}

export default function Mascot({ variant = "companion" }) {
  if (variant === "companion") return <MascotCompanion />;
  return null;
}
