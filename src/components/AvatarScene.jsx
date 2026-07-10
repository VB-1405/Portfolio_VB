import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, useAnimations, useGLTF } from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import * as THREE from "three";
import { SkeletonUtils } from "three-stdlib";
import CyberDesk, {
  DESK_RIG_POSITION,
  DESK_RIG_ROTATION_Y,
  DESK_RIG_SCALE,
} from "./CyberDesk";

const MODEL_URL = `${import.meta.env.BASE_URL}avatar/avatar_typing.glb`;
const BASE_ROTATION_Y = -1.4; // three-quarter toward implied monitor — flip sign if facing wrong way
const VIEWER_ROTATION_Y = 0.2;
const MODEL_POSITION = [0, 0, 0];
const MODEL_SCALE = 1;
const CAMERA_POSITION = [0, 1.35, 3.2];
const CAMERA_FOV = 30;
const CAMERA_LOOK_AT = [0, 1.1, 0];
const WAVE_INTERVAL = 6;

const CROSSFADE_DURATION = 0.4;

const PROD_FRAMING = {
  positionX: MODEL_POSITION[0],
  positionY: MODEL_POSITION[1],
  positionZ: MODEL_POSITION[2],
  rotationY: BASE_ROTATION_Y,
  scale: MODEL_SCALE,
  cameraX: CAMERA_POSITION[0],
  cameraY: CAMERA_POSITION[1],
  cameraZ: CAMERA_POSITION[2],
  fov: CAMERA_FOV,
  deskX: DESK_RIG_POSITION[0],
  deskY: DESK_RIG_POSITION[1],
  deskZ: DESK_RIG_POSITION[2],
  deskRotationY: DESK_RIG_ROTATION_Y,
  deskScale: DESK_RIG_SCALE,
};

useGLTF.preload(MODEL_URL);

const AvatarDevControls = import.meta.env.DEV
  ? lazy(() => import("./AvatarDevControls"))
  : null;

function findClip(animations, substr) {
  return animations.find((clip) => clip.name.toLowerCase().includes(substr.toLowerCase()));
}

function CameraRig({ framing }) {
  const camera = useThree((state) => state.camera);
  const lookAt = useMemo(() => new THREE.Vector3(...CAMERA_LOOK_AT), []);

  useEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;

    camera.position.set(framing.cameraX, framing.cameraY, framing.cameraZ);
    camera.fov = framing.fov;
    camera.updateProjectionMatrix();
    camera.lookAt(lookAt);
  }, [camera, framing.cameraX, framing.cameraY, framing.cameraZ, framing.fov, lookAt]);

  useFrame(() => {
    camera.lookAt(lookAt);
  });

  return null;
}

function AvatarModel({ paused, framing }) {
  const groupRef = useRef();
  const { scene, animations } = useGLTF(MODEL_URL);
  // useGLTF returns a SHARED, cached scene. For an animated SKINNED mesh that
  // lazy-loads / re-mounts, the shared skeleton binding breaks and the mesh
  // collapses. Cloning gives this instance its own skeleton so animations bind.
  const clonedScene = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { actions, mixer } = useAnimations(animations, clonedScene);
  const baseRotationY = framing.rotationY;

  const clips = useMemo(
    () => ({
      typing: findClip(animations, "typ"),
      waving: findClip(animations, "wav"),
    }),
    [animations],
  );

  const loggedRef = useRef(false);
  useEffect(() => {
    if (loggedRef.current) return;
    loggedRef.current = true;
    console.log(
      "[AvatarScene] GLB animation clips:",
      animations.map((clip) => clip.name),
    );
  }, [animations]);

  const stateRef = useRef("typing");
  const waveTimerRef = useRef(0);
  const rotationAnimRef = useRef({
    from: baseRotationY,
    to: baseRotationY,
    t: 1,
  });

  const tweenRotation = useCallback((to) => {
    if (!groupRef.current) return;
    rotationAnimRef.current = {
      from: groupRef.current.rotation.y,
      to,
      t: 0,
    };
  }, []);

  const playTyping = useCallback(() => {
    const typingClip = clips.typing;
    if (!typingClip) return;

    const typingAction = actions[typingClip.name];
    if (!typingAction) return;

    const wavingClip = clips.waving;
    const waveAction = wavingClip ? actions[wavingClip.name] : null;
    if (waveAction?.isRunning()) {
      waveAction.fadeOut(CROSSFADE_DURATION);
    }

    typingAction.reset().setLoop(THREE.LoopRepeat, Infinity).fadeIn(CROSSFADE_DURATION).play();
    stateRef.current = "typing";
    tweenRotation(baseRotationY);
  }, [actions, baseRotationY, clips, tweenRotation]);

  const startWave = useCallback(() => {
    const waveClip = clips.waving;
    const typingClip = clips.typing;
    if (!waveClip || !typingClip) return;

    const waveAction = actions[waveClip.name];
    const typingAction = actions[typingClip.name];
    if (!waveAction || !typingAction) return;

    typingAction.fadeOut(CROSSFADE_DURATION);
    waveAction
      .reset()
      .setLoop(THREE.LoopOnce, 1)
      .fadeIn(CROSSFADE_DURATION)
      .play();
    waveAction.clampWhenFinished = true;

    stateRef.current = "waving";
    tweenRotation(VIEWER_ROTATION_Y);
  }, [actions, clips, tweenRotation]);

  useEffect(() => {
    if (!clips.typing) return;

    const typingAction = actions[clips.typing.name];
    if (!typingAction) return;

    typingAction.reset().setLoop(THREE.LoopRepeat, Infinity).fadeIn(CROSSFADE_DURATION).play();
    if (groupRef.current) {
      groupRef.current.rotation.y = baseRotationY;
      rotationAnimRef.current = { from: baseRotationY, to: baseRotationY, t: 1 };
    }
  }, [actions, baseRotationY, clips.typing]);

  useEffect(() => {
    if (!mixer || !clips.waving) return;

    const waveClip = clips.waving;
    const onFinished = (event) => {
      if (event.action?.getClip()?.name !== waveClip.name) return;
      playTyping();
      waveTimerRef.current = 0;
    };

    mixer.addEventListener("finished", onFinished);
    return () => mixer.removeEventListener("finished", onFinished);
  }, [mixer, clips.waving, playTyping]);

  useEffect(() => {
    if (stateRef.current !== "typing" || rotationAnimRef.current.t < 1 || !groupRef.current) return;
    groupRef.current.rotation.y = baseRotationY;
    rotationAnimRef.current = { from: baseRotationY, to: baseRotationY, t: 1 };
  }, [baseRotationY]);

  useFrame((_, delta) => {
    if (paused) return;

    const rot = rotationAnimRef.current;
    if (rot.t < 1) {
      rot.t = Math.min(1, rot.t + delta / CROSSFADE_DURATION);
      const eased = rot.t * rot.t * (3 - 2 * rot.t);
      if (groupRef.current) {
        groupRef.current.rotation.y = THREE.MathUtils.lerp(rot.from, rot.to, eased);
      }
    }

    if (!clips.waving || stateRef.current !== "typing") return;

    waveTimerRef.current += delta;
    if (waveTimerRef.current >= WAVE_INTERVAL) {
      waveTimerRef.current = 0;
      startWave();
    }
  });

  return (
    <group
      ref={groupRef}
      position={[framing.positionX, framing.positionY, framing.positionZ]}
      scale={framing.scale}
    >
      <primitive object={clonedScene} />
    </group>
  );
}

function Scene({ paused, framing }) {
  return (
    <>
      <CameraRig framing={framing} />

      <ambientLight intensity={0.22} />
      <directionalLight position={[-2.5, 3, 2.5]} intensity={0.9} color="#22d3ee" />
      <directionalLight position={[0.5, 2.5, -3]} intensity={0.28} color="#a5f3fc" />
      <pointLight position={[-1.5, 1.2, 1.8]} intensity={0.12} color="#22d3ee" />

      {/* Desk rotation is locked to the avatar's rotationY so they can never
          drift out of sync again (this was the "chair turned around" bug). */}
      <CyberDesk
        position={[framing.deskX, framing.deskY, framing.deskZ]}
        rotationY={framing.rotationY}
        scale={framing.deskScale}
      />

      <AvatarModel paused={paused} framing={framing} />

      <ContactShadows
        position={[framing.positionX, framing.positionY + 0.02, framing.positionZ]}
        opacity={0.42}
        scale={7}
        blur={2.4}
        far={3.5}
        resolution={256}
        color="#000000"
      />
    </>
  );
}

export default function AvatarScene() {
  const containerRef = useRef(null);
  const [inView, setInView] = useState(true);
  const [framing, setFraming] = useState(PROD_FRAMING);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.08 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="h-full w-full overflow-hidden">
      {import.meta.env.DEV && AvatarDevControls && (
        <Suspense fallback={null}>
          <AvatarDevControls onChange={setFraming} />
        </Suspense>
      )}

      <Canvas
        className="h-full w-full"
        dpr={[1, 2]}
        frameloop={inView ? "always" : "never"}
        gl={{ alpha: true, antialias: true }}
        camera={{
          position: CAMERA_POSITION,
          fov: CAMERA_FOV,
          near: 0.1,
          far: 50,
        }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
        }}
      >
        <Suspense fallback={null}>
          <Scene paused={!inView} framing={framing} />
        </Suspense>

        <EffectComposer disableNormalPass>
          <Bloom
            mipmapBlur
            intensity={0.8}
            luminanceThreshold={0.6}
            luminanceSmoothing={0.2}
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
