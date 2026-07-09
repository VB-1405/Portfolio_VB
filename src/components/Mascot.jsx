import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Html, useTexture } from "@react-three/drei";
import * as THREE from "three";
import {
  MEMOJI_FIGURINE_IDLE_URL,
  MEMOJI_FIGURINE_WAVE_URL,
} from "../data";
import { createFigurineMaterial } from "./avatar/figurineMaterial";

const WAVE_HOLD_MS = 2800;
const FIGURINE_HEIGHT = 2.45;

useTexture.preload(MEMOJI_FIGURINE_IDLE_URL);
useTexture.preload(MEMOJI_FIGURINE_WAVE_URL);

function useFigurineWave() {
  const [hovering, setHovering] = useState(false);
  const [greeting, setGreeting] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  const wave = useCallback(() => {
    if (reduceMotion) return;
    setGreeting(true);
    setTimeout(() => setGreeting(false), WAVE_HOLD_MS);
  }, [reduceMotion]);

  useEffect(() => {
    setReduceMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    if (reduceMotion) return undefined;
    const start = setTimeout(wave, 2500);
    return () => clearTimeout(start);
  }, [reduceMotion, wave]);

  return {
    setHovering,
    waving: !reduceMotion && (hovering || greeting),
    wave,
    reduceMotion,
  };
}

function configureTexture(texture) {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
}

function MemojiFigurine3D({ waving, pointer, reduceMotion }) {
  const groupRef = useRef();
  const mix = useRef(0);
  const wavePhase = useRef(0);

  const idleTex = useTexture(MEMOJI_FIGURINE_IDLE_URL);
  const waveTex = useTexture(MEMOJI_FIGURINE_WAVE_URL);

  const material = useMemo(() => {
    configureTexture(idleTex);
    configureTexture(waveTex);
    return createFigurineMaterial(idleTex, waveTex);
  }, [idleTex, waveTex]);

  const aspect = idleTex.image ? idleTex.image.width / idleTex.image.height : 0.667;
  const width = FIGURINE_HEIGHT * aspect;

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    mix.current = THREE.MathUtils.lerp(mix.current, waving ? 1 : 0, delta * 4.5);
    material.uniforms.uMix.value = mix.current;

    if (!groupRef.current) return;

    const g = groupRef.current;

    if (!reduceMotion) {
      g.position.y = 0.06 + Math.sin(t * 1.15) * 0.035;
      g.rotation.z = Math.sin(t * 0.75) * 0.018;

      if (waving) {
        wavePhase.current += delta * 5.5;
        g.rotation.z += Math.sin(wavePhase.current) * 0.055;
        g.rotation.y += Math.sin(wavePhase.current * 0.5) * 0.02;
      } else {
        wavePhase.current = 0;
      }
    }

    g.rotation.y = THREE.MathUtils.lerp(
      g.rotation.y,
      -0.22 + pointer.current.x * 0.14,
      delta * 3,
    );
    g.rotation.x = THREE.MathUtils.lerp(
      g.rotation.x,
      pointer.current.y * 0.045,
      delta * 3,
    );
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <mesh position={[0, FIGURINE_HEIGHT / 2 + 0.06, 0]} renderOrder={10}>
        <planeGeometry args={[width, FIGURINE_HEIGHT]} />
        <primitive object={material} attach="material" />
      </mesh>
    </group>
  );
}

function TechPedestal3D() {
  const ringRef = useRef();
  const ring2Ref = useRef();

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ringRef.current) ringRef.current.rotation.y = t * 0.45;
    if (ring2Ref.current) ring2Ref.current.rotation.y = -t * 0.3;
  });

  return (
    <group position={[0, 0, 0]}>
      <mesh position={[0, 0.025, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[0.5, 0.56, 0.05, 48]} />
        <meshStandardMaterial
          color="#0a1628"
          roughness={0.35}
          metalness={0.65}
          emissive="#0c2840"
          emissiveIntensity={0.4}
        />
      </mesh>
      <mesh position={[0, 0.055, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.42, 0.48, 48]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.5} />
      </mesh>
      <group ref={ringRef} position={[0, 0.062, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.34, 0.36, 64]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.55} depthWrite={false} />
        </mesh>
      </group>
      <group ref={ring2Ref} position={[0, 0.068, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.26, 0.28, 48]} />
          <meshBasicMaterial color="#67e8f9" transparent opacity={0.35} depthWrite={false} />
        </mesh>
      </group>
      <mesh position={[0, 0.07, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.24, 32]} />
        <meshBasicMaterial color="#0ea5e9" transparent opacity={0.15} />
      </mesh>
    </group>
  );
}

function Scene3D({ waving, pointer, reduceMotion }) {
  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 5, 4]} intensity={1.2} color="#fff8f0" castShadow />
      <directionalLight position={[-2.5, 3, 2]} intensity={0.5} color="#7dd3fc" />
      <pointLight position={[0, 1.8, 2.5]} intensity={0.4} color="#a5f3fc" />
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.68, 48]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.1} />
      </mesh>
      <ContactShadows
        position={[0, 0.05, 0]}
        opacity={0.5}
        scale={2.6}
        blur={2.4}
        far={1.5}
        color="#0ea5e9"
      />
      <TechPedestal3D />
      <MemojiFigurine3D waving={waving} pointer={pointer} reduceMotion={reduceMotion} />
    </>
  );
}

function FigurineCanvas({ waving, pointer, reduceMotion }) {
  return (
    <Canvas
      className="w-full h-full"
      dpr={[1, 1.75]}
      gl={{ alpha: true, antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
      camera={{ fov: 32, near: 0.1, far: 50, position: [0, 1.2, 3.5] }}
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
            <span className="text-[10px] uppercase tracking-widest text-cyan-400/70">Loading…</span>
          </Html>
        }
      >
        <Scene3D waving={waving} pointer={pointer} reduceMotion={reduceMotion} />
      </Suspense>
    </Canvas>
  );
}

export default function Mascot() {
  const pointer = useRef({ x: 0, y: 0 });
  const { setHovering, waving, wave, reduceMotion } = useFigurineWave();

  return (
    <div className="hidden lg:block fixed left-0 bottom-0 z-30 pointer-events-none w-[min(34vw,320px)] h-[min(72vh,560px)]">
      <button
        type="button"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => {
          setHovering(false);
          pointer.current = { x: 0, y: 0 };
        }}
        onFocus={() => setHovering(true)}
        onBlur={() => setHovering(false)}
        onClick={wave}
        aria-label="Profile mascot — Vrishabh Bhavsar, wave hello"
        className="pointer-events-auto relative h-full w-full cursor-pointer border-0 bg-transparent p-0 pl-2 pb-0 outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded-lg"
      >
        <FigurineCanvas waving={waving} pointer={pointer} reduceMotion={reduceMotion} />
      </button>
    </div>
  );
}
