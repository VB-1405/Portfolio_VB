import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Html, useTexture } from "@react-three/drei";
import * as THREE from "three";
import {
  MEMOJI_FIGURINE_IDLE_URL,
  MEMOJI_FIGURINE_WAVE_URL,
} from "../data";
import { createFigurineMaterial } from "./avatar/figurineMaterial";

const WAVE_MS = 1200;
const FIGURINE_HEIGHT = 2.35;

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

function configureTexture(texture) {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
}

function MemojiFigurine({ waving, pointer }) {
  const groupRef = useRef();
  const mix = useRef(0);
  const idleTex = useTexture(MEMOJI_FIGURINE_IDLE_URL);
  const waveTex = useTexture(MEMOJI_FIGURINE_WAVE_URL);

  const material = useMemo(() => {
    configureTexture(idleTex);
    configureTexture(waveTex);
    const mat = createFigurineMaterial();
    mat.uniforms.uIdleMap.value = idleTex;
    mat.uniforms.uWaveMap.value = waveTex;
    return mat;
  }, [idleTex, waveTex]);

  const aspect = idleTex.image ? idleTex.image.width / idleTex.image.height : 0.55;
  const width = FIGURINE_HEIGHT * aspect;

  useFrame((state, delta) => {
    const target = waving ? 1 : 0;
    mix.current = THREE.MathUtils.lerp(mix.current, target, delta * 5);
    if (material) {
      material.uniforms.uMix.value = mix.current;
      material.uniforms.uTime.value = state.clock.elapsedTime;
    }

    if (groupRef.current) {
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        -0.22 + pointer.current.x * 0.12,
        delta * 3,
      );
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        pointer.current.y * 0.04,
        delta * 3,
      );
      groupRef.current.position.y = 0.02 + Math.sin(state.clock.elapsedTime * 1.2) * 0.012;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0.08, 0]}>
      <mesh position={[0, FIGURINE_HEIGHT / 2, 0]} renderOrder={10}>
        <planeGeometry args={[width, FIGURINE_HEIGHT]} />
        <primitive object={material} attach="material" />
      </mesh>
    </group>
  );
}

function TechPedestal() {
  const ringRef = useRef();
  const innerRef = useRef();

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ringRef.current) ringRef.current.rotation.z = t * 0.4;
    if (innerRef.current) innerRef.current.rotation.z = -t * 0.25;
  });

  return (
    <group position={[0, 0, 0]}>
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <cylinderGeometry args={[0.52, 0.58, 0.06, 48]} />
        <meshStandardMaterial color="#0a1a2e" roughness={0.4} metalness={0.55} emissive="#0c2840" emissiveIntensity={0.35} />
      </mesh>
      <mesh position={[0, 0.055, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.44, 0.5, 48]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.45} />
      </mesh>
      <mesh ref={ringRef} position={[0, 0.062, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.36, 0.38, 64]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.55} depthWrite={false} />
      </mesh>
      <mesh ref={innerRef} position={[0, 0.068, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.28, 0.29, 48]} />
        <meshBasicMaterial color="#67e8f9" transparent opacity={0.35} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0.07, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.26, 32]} />
        <meshBasicMaterial color="#0ea5e9" transparent opacity={0.18} />
      </mesh>
      <mesh position={[0, 0.09, 0]}>
        <boxGeometry args={[0.14, 0.05, 0.02]} />
        <meshStandardMaterial color="#041018" emissive="#22d3ee" emissiveIntensity={0.6} roughness={0.3} metalness={0.8} />
      </mesh>
    </group>
  );
}

function HologramBeams() {
  const beamsRef = useRef();

  useFrame((state) => {
    if (!beamsRef.current) return;
    beamsRef.current.children.forEach((beam, i) => {
      beam.material.opacity = 0.08 + Math.sin(state.clock.elapsedTime * 2 + i) * 0.04;
    });
  });

  return (
    <group ref={beamsRef} position={[0, 0.5, 0]}>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} rotation={[0, (Math.PI / 2) * i, 0]}>
          <planeGeometry args={[0.02, 1.2]} />
          <meshBasicMaterial color="#22d3ee" transparent opacity={0.1} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

function FigurineScene({ waving, pointer }) {
  return (
    <>
      <ambientLight intensity={0.65} />
      <directionalLight position={[2, 4, 3]} intensity={1.1} color="#fff5eb" />
      <directionalLight position={[-2, 2.5, 2]} intensity={0.45} color="#7dd3fc" />
      <pointLight position={[0, 1.5, 2]} intensity={0.35} color="#a5f3fc" />
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.72, 48]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.08} />
      </mesh>
      <ContactShadows position={[0, 0.05, 0]} opacity={0.45} scale={2.8} blur={2.5} far={1.6} color="#0ea5e9" />
      <TechPedestal />
      <HologramBeams />
      <MemojiFigurine waving={waving} pointer={pointer} />
    </>
  );
}

function FigurineCanvas({ waving, pointer }) {
  return (
    <Canvas
      className="w-full h-full"
      dpr={[1, 1.75]}
      gl={{ alpha: true, antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.08 }}
      camera={{ fov: 32, near: 0.1, far: 50, position: [0, 1.15, 3.4] }}
      onCreated={({ gl, camera }) => {
        gl.setClearColor(0x000000, 0);
        gl.outputColorSpace = THREE.SRGBColorSpace;
        camera.lookAt(0, 1.05, 0);
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
