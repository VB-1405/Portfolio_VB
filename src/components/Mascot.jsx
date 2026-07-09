import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, useAnimations, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { AVATAR_MODEL_URL } from "../data";

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

function styleMemojiLook(root) {
  root.traverse((obj) => {
    if (!obj.isMesh) return;
    obj.castShadow = true;
    obj.receiveShadow = true;

    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    mats.forEach((mat) => {
      const styled = mat.clone();
      styled.metalness = 0.04;
      styled.roughness = 0.86;
      if (obj.name.includes("visor")) {
        styled.color = new THREE.Color("#0a0a0c");
        styled.emissive = new THREE.Color("#111111");
        styled.emissiveIntensity = 0.15;
      } else {
        styled.map = null;
        styled.normalMap = null;
        styled.roughnessMap = null;
        styled.metalnessMap = null;
        styled.aoMap = null;
        styled.color = new THREE.Color("#141418");
      }
      if (Array.isArray(obj.material)) {
        const idx = obj.material.indexOf(mat);
        obj.material[idx] = styled;
      } else {
        obj.material = styled;
      }
    });
  });
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

function RiggedFigurine({ waving, pointer }) {
  const pivot = useRef();
  const model = useRef();
  const wavePhase = useRef(0);
  const bones = useRef({});
  const rest = useRef({});
  const { scene, animations } = useGLTF(AVATAR_MODEL_URL);
  const { actions } = useAnimations(animations, model);

  useEffect(() => {
    if (!model.current) return;
    const clone = scene.clone(true);
    styleMemojiLook(clone);
    model.current.clear();
    model.current.add(clone);
    fitModel(clone, pivot.current);

    bones.current = {
      head: clone.getObjectByName("mixamorig:Head"),
      neck: clone.getObjectByName("mixamorig:Neck"),
      rightArm: clone.getObjectByName("mixamorig:RightArm"),
      rightForeArm: clone.getObjectByName("mixamorig:RightForeArm"),
      rightHand: clone.getObjectByName("mixamorig:RightHand"),
    };

    for (const [key, bone] of Object.entries(bones.current)) {
      if (bone) rest.current[key] = bone.rotation.clone();
    }

    const idle = actions.idle || actions.Idle || actions.stand;
    idle?.reset().fadeIn(0.2).play();
  }, [scene, actions]);

  useFrame((_, delta) => {
    const { head, neck, rightArm, rightForeArm, rightHand } = bones.current;
    if (head) {
      head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, rest.current.head.y + pointer.current.x * 0.32, delta * 4);
      head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, rest.current.head.x + pointer.current.y * 0.1, delta * 4);
    }
    if (neck) {
      neck.rotation.y = THREE.MathUtils.lerp(neck.rotation.y, rest.current.neck.y + pointer.current.x * 0.12, delta * 3);
    }

    if (!rightArm || !rightForeArm) return;

    if (waving) {
      wavePhase.current += delta * 7;
      const swing = Math.sin(wavePhase.current) * 0.75 + Math.sin(wavePhase.current * 1.6) * 0.22;
      rightArm.rotation.z = rest.current.rightArm.z - 0.55 - swing;
      rightForeArm.rotation.z = rest.current.rightForeArm.z - 0.35 - swing * 0.45;
      if (rightHand) rightHand.rotation.z = rest.current.rightHand.z - swing * 0.15;
      return;
    }

    wavePhase.current = 0;
    rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, rest.current.rightArm.z, delta * 8);
    rightForeArm.rotation.z = THREE.MathUtils.lerp(rightForeArm.rotation.z, rest.current.rightForeArm.z, delta * 8);
    if (rightHand) {
      rightHand.rotation.z = THREE.MathUtils.lerp(rightHand.rotation.z, rest.current.rightHand.z, delta * 8);
    }
  });

  return (
    <group ref={pivot} position={[LAYOUT.stageOffsetX, LAYOUT.floorY, LAYOUT.forwardZ]} rotation={[0, -0.3, 0]}>
      <group ref={model} />
      <mesh position={[0, 0.03, 0]} receiveShadow>
        <cylinderGeometry args={[0.42, 0.44, 0.07, 48]} />
        <meshStandardMaterial color="#0a0a0c" roughness={0.92} metalness={0.12} />
      </mesh>
    </group>
  );
}

function FigurineScene({ waving, pointer }) {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[2.5, 4, 3]} intensity={1.3} castShadow />
      <directionalLight position={[-2, 2.5, 1.5]} intensity={0.4} color="#67e8f9" />
      <Environment preset="city" />
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.58, 48]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.11} />
      </mesh>
      <ContactShadows position={[0, 0.05, 0]} opacity={0.48} scale={2.4} blur={2.3} far={1.5} />
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
      gl={{ alpha: true, antialias: true }}
      camera={{ fov: 34, near: 0.1, far: 50, position: [0, 1.05, 3.2] }}
      onCreated={({ gl, camera }) => {
        gl.setClearColor(0x000000, 0);
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
      <Suspense fallback={null}>
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
