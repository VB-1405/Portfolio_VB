import { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Html, useAnimations, useGLTF, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import { AVATAR_MODEL_URL, MEMOJI_FACE_URL } from "../data";
import { createHologramMaterial } from "./avatar/hologramMaterial";

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

function styleFigurine(root) {
  root.traverse((obj) => {
    if (!obj.isMesh) return;
    obj.castShadow = true;
    obj.receiveShadow = true;

    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    mats.forEach((mat) => {
      const styled = mat.clone();
      styled.metalness = 0.06;
      styled.roughness = 0.86;
      styled.map = null;
      styled.normalMap = null;
      styled.roughnessMap = null;
      styled.metalnessMap = null;
      styled.aoMap = null;
      styled.emissive = new THREE.Color("#0a1628");
      styled.emissiveIntensity = 0.15;
      if (obj.name.toLowerCase().includes("visor")) {
        styled.color = new THREE.Color("#0a0a0c");
      } else {
        styled.color = new THREE.Color("#101018");
      }
      if (Array.isArray(obj.material)) {
        obj.material[mats.indexOf(mat)] = styled;
      } else {
        obj.material = styled;
      }
    });
  });
}

function attachHologramShell(root, material) {
  const shells = [];
  root.traverse((child) => {
    if (!child.isSkinnedMesh) return;
    const holo = new THREE.SkinnedMesh(child.geometry, material);
    holo.bind(child.skeleton, child.bindMatrix);
    holo.frustumCulled = false;
    holo.renderOrder = 30;
    child.parent?.add(holo);
    shells.push(holo);
  });
  return shells;
}

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

function attachMemojiFace(headBone, texture) {
  if (!headBone) return null;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;

  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      alphaTest: 0.08,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  face.position.set(0, 0.08, 0.11);
  face.scale.setScalar(0.22);
  face.renderOrder = 40;
  headBone.add(face);
  return face;
}

function RiggedFigurine({ waving, pointer }) {
  const pivot = useRef();
  const rigRef = useRef();
  const bones = useRef({});
  const rest = useRef({});
  const holoMat = useRef();
  const holoShells = useRef([]);
  const faceMesh = useRef(null);
  const animReady = useRef(false);
  const wasWaving = useRef(false);

  const { scene, animations } = useGLTF(AVATAR_MODEL_URL);
  const faceTexture = useTexture(MEMOJI_FACE_URL);
  const model = useMemo(() => cloneSkinned(scene), [scene]);
  const { actions, mixer } = useAnimations(animations, rigRef);

  useLayoutEffect(() => {
    if (!rigRef.current || !pivot.current || animReady.current) return;

    styleFigurine(model);
    fitModel(model, pivot.current);

    holoMat.current = createHologramMaterial();
    holoShells.current = attachHologramShell(model, holoMat.current);

    bones.current = {
      head: findBone(model, /head$/i),
      neck: findBone(model, /neck$/i),
    };
    for (const [key, bone] of Object.entries(bones.current)) {
      if (bone) rest.current[key] = bone.rotation.clone();
    }

    faceMesh.current = attachMemojiFace(bones.current.head, faceTexture);

    animReady.current = true;

    return () => {
      if (faceMesh.current && bones.current.head) {
        bones.current.head.remove(faceMesh.current);
        faceMesh.current.geometry.dispose();
        faceMesh.current.material.map?.dispose();
        faceMesh.current.material.dispose();
        faceMesh.current = null;
      }
      holoShells.current.forEach((shell) => shell.parent?.remove(shell));
      holoShells.current = [];
      holoMat.current?.dispose();
      holoMat.current = null;
      animReady.current = false;
    };
  }, [model, faceTexture]);

  useLayoutEffect(() => {
    if (!actions || !animReady.current) return undefined;

    const idle = actions.idle || actions.Idle || actions.stand;
    const waveHello = actions.waveHello;
    const tpose = actions.TPose;

    tpose?.stop().setEffectiveWeight(0);
    waveHello?.reset().setEffectiveWeight(0).play();

    if (!idle) return undefined;

    idle.reset().setLoop(THREE.LoopRepeat, Infinity).setEffectiveWeight(1).fadeIn(0.01).play();
  }, [actions, model]);

  useEffect(() => {
    if (!actions || !animReady.current) return undefined;

    const idle = actions.idle || actions.Idle || actions.stand;
    const waveHello = actions.waveHello;
    if (!idle) return undefined;

    if (waving && waveHello) {
      if (!wasWaving.current) {
        idle.crossFadeTo(waveHello, 0.28, false);
        waveHello.reset().setLoop(THREE.LoopRepeat, Infinity).setEffectiveWeight(1).play();
      }
      wasWaving.current = true;
      return undefined;
    }

    if (wasWaving.current && waveHello) {
      waveHello.crossFadeTo(idle, 0.35, false);
      idle.reset().setLoop(THREE.LoopRepeat, Infinity).setEffectiveWeight(1).play();
    }
    wasWaving.current = false;
  }, [waving, actions]);

  useFrame((state, delta) => {
    mixer?.update(delta);
    if (holoMat.current) {
      holoMat.current.uniforms.uTime.value = state.clock.elapsedTime;
      holoMat.current.uniforms.uIntensity.value = waving ? 0.85 : 0.55;
    }

    if (waving) return;

    const { head, neck } = bones.current;
    if (head && rest.current.head) {
      head.rotation.y = THREE.MathUtils.lerp(
        head.rotation.y,
        rest.current.head.y + pointer.current.x * 0.22,
        delta * 2.5,
      );
      head.rotation.x = THREE.MathUtils.lerp(
        head.rotation.x,
        rest.current.head.x + pointer.current.y * 0.08,
        delta * 2.5,
      );
    }
    if (neck && rest.current.neck) {
      neck.rotation.y = THREE.MathUtils.lerp(
        neck.rotation.y,
        rest.current.neck.y + pointer.current.x * 0.1,
        delta * 2,
      );
    }
  });

  return (
    <group ref={pivot} position={[LAYOUT.stageOffsetX, LAYOUT.floorY, LAYOUT.forwardZ]} rotation={[0, -0.28, 0]}>
      <group ref={rigRef}>
        <primitive object={model} />
      </group>
      <mesh position={[0, 0.03, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[0.42, 0.46, 0.08, 48]} />
        <meshStandardMaterial color="#08080c" roughness={0.88} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.075, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.4, 0.44, 48]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.35} />
      </mesh>
      <HologramRing />
    </group>
  );
}

function HologramRing() {
  const ringRef = useRef();

  useFrame((state) => {
    if (!ringRef.current) return;
    ringRef.current.rotation.z = state.clock.elapsedTime * 0.35;
    ringRef.current.material.opacity = 0.18 + Math.sin(state.clock.elapsedTime * 2) * 0.06;
  });

  return (
    <mesh ref={ringRef} position={[0, 0.09, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.48, 0.5, 64]} />
      <meshBasicMaterial color="#22d3ee" transparent opacity={0.2} depthWrite={false} />
    </mesh>
  );
}

function FigurineScene({ waving, pointer }) {
  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight position={[2.8, 4.5, 3.2]} intensity={1.35} castShadow color="#fff8f0" />
      <directionalLight position={[-2.2, 2.8, 1.8]} intensity={0.55} color="#67e8f9" />
      <pointLight position={[0.5, 1.6, 2.2]} intensity={0.35} color="#a5f3fc" />
      <Environment preset="city" />
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.62, 48]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.1} />
      </mesh>
      <ContactShadows position={[0, 0.05, 0]} opacity={0.5} scale={2.5} blur={2.2} far={1.5} />
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
      gl={{ alpha: true, antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
      camera={{ fov: 34, near: 0.1, far: 50, position: [0, 1.05, 3.2] }}
      onCreated={({ gl, camera }) => {
        gl.setClearColor(0x000000, 0);
        gl.outputColorSpace = THREE.SRGBColorSpace;
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
