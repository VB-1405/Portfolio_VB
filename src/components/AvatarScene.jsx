import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, useAnimations, useGLTF } from "@react-three/drei";
import * as THREE from "three";

const MODEL_URL = `${import.meta.env.BASE_URL}avatar/avatar_typing.glb`;
const BASE_ROTATION_Y = -0.6; // three-quarter toward implied monitor — flip sign if facing wrong way
const VIEWER_ROTATION_Y = 0.2;
const MODEL_POSITION = [0, -1.05, 0];
const CAMERA_POSITION = [0, 1.35, 3.4];
const WAVE_INTERVAL = 6;

const CROSSFADE_DURATION = 0.4;

useGLTF.preload(MODEL_URL);

function findClip(animations, substr) {
  return animations.find((clip) => clip.name.toLowerCase().includes(substr.toLowerCase()));
}

function AvatarModel({ paused }) {
  const groupRef = useRef();
  const { scene, animations } = useGLTF(MODEL_URL);
  const { actions, mixer } = useAnimations(animations, groupRef);

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
    from: BASE_ROTATION_Y,
    to: BASE_ROTATION_Y,
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
    tweenRotation(BASE_ROTATION_Y);
  }, [actions, clips, tweenRotation]);

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
      groupRef.current.rotation.y = BASE_ROTATION_Y;
    }
  }, [actions, clips.typing]);

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
    <group ref={groupRef} position={MODEL_POSITION}>
      <primitive object={scene} />
    </group>
  );
}

function Scene({ paused }) {
  return (
    <>
      <ambientLight intensity={0.22} />
      <directionalLight position={[-2.5, 3, 2.5]} intensity={0.9} color="#22d3ee" />
      <directionalLight position={[0.5, 2.5, -3]} intensity={0.28} color="#a5f3fc" />
      <pointLight position={[-1.5, 1.2, 1.8]} intensity={0.12} color="#22d3ee" />

      <AvatarModel paused={paused} />

      <ContactShadows
        position={[MODEL_POSITION[0], MODEL_POSITION[1] + 0.02, MODEL_POSITION[2]]}
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
      <Canvas
        className="h-full w-full"
        dpr={[1, 2]}
        frameloop={inView ? "always" : "never"}
        gl={{ alpha: true, antialias: true }}
        camera={{ position: CAMERA_POSITION, fov: 35 }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
        }}
      >
        <Suspense fallback={null}>
          <Scene paused={!inView} />
        </Suspense>
      </Canvas>
    </div>
  );
}
