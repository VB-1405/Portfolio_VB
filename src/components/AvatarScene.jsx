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
const MODEL_POSITION = [0.45, 0.15, -0.1];
const MODEL_SCALE = 1;
const CAMERA_POSITION = [-0.6, 1.2, 4.9];
const CAMERA_FOV = 32;
const CAMERA_LOOK_AT = [0, 1.1, 0];
const WAVE_INTERVAL = 6;
// Wave disabled for now — the retargeted GLB still has the Waving clip in
// it (harmless either way), this just stops the timer from ever triggering
// it. Flip back to true whenever you want the wave back.
const ENABLE_WAVE = false;

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
  // Peripheral defaults — must match the Leva "Peripherals" panel defaults
  // in AvatarDevControls.jsx so prod and dev look the same before any
  // slider is touched.
  monX: -1.0,
  monY: 1.12,
  monZ: 0.31,
  monScale: 2.15,
  monTurnDeg: -4,
  kbX: 0.1,
  kbY: 0.77,
  kbZ: -0.0,
  mouseX: -0.3,
  mouseY: 0.76,
  mouseZ: -0.0,
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
  // This group's own rotation is now a RELATIVE DELTA on top of whatever
  // the shared outer Rig group (position + rotationY + drag) is doing —
  // NOT an absolute angle. Currently always 0 (typing and waving both
  // settle here), but the tween scaffolding stays in place in case a
  // future wave-turn effect wants to add a small local turn again.
  const REST_DELTA_Y = 0;

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
  const waveElapsedRef = useRef(0);
  const rotationAnimRef = useRef({
    from: REST_DELTA_Y,
    to: REST_DELTA_Y,
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
    tweenRotation(REST_DELTA_Y);
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
    waveElapsedRef.current = 0;
    // Body doesn't turn during the wave — the retargeted arm/hand animation
    // does all the work. This also matters more now: the outer Rig group
    // owns the real rotationY, so this inner group must never drift from
    // its rest delta or it'll fight with the shared pivot.
    tweenRotation(REST_DELTA_Y);
  }, [actions, clips, tweenRotation]);

  useEffect(() => {
    if (!clips.typing) return;

    const typingAction = actions[clips.typing.name];
    if (!typingAction) return;

    typingAction.reset().setLoop(THREE.LoopRepeat, Infinity).fadeIn(CROSSFADE_DURATION).play();
    if (groupRef.current) {
      groupRef.current.rotation.y = REST_DELTA_Y;
      rotationAnimRef.current = { from: REST_DELTA_Y, to: REST_DELTA_Y, t: 1 };
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
    }
    const eased = rot.t * rot.t * (3 - 2 * rot.t);
    if (groupRef.current) {
      groupRef.current.rotation.y = THREE.MathUtils.lerp(rot.from, rot.to, eased);
    }

    if (stateRef.current === "waving") {
      // Fallback for returning to typing: the mixer's 'finished' event can
      // be unreliable with crossfading actions (fade-out/fade-in timing
      // can cause it to never fire, leaving the avatar stuck mid-wave
      // forever). This tracks elapsed time directly against the wave
      // clip's own duration and forces playTyping() regardless, so the
      // avatar always recovers even if the event never arrives.
      waveElapsedRef.current += delta;
      const waveClip = clips.waving;
      const waveAction = waveClip ? actions[waveClip.name] : null;
      const duration = waveAction?.getClip()?.duration ?? 5;
      if (waveElapsedRef.current >= duration + 0.1) {
        playTyping();
        waveTimerRef.current = 0;
      }
      return;
    }

    if (!ENABLE_WAVE || !clips.waving || stateRef.current !== "typing") return;

    waveTimerRef.current += delta;
    if (waveTimerRef.current >= WAVE_INTERVAL) {
      waveTimerRef.current = 0;
      startWave();
    }
  });

  return (
    <group ref={groupRef} scale={framing.scale}>
      <primitive object={clonedScene} />
    </group>
  );
}

// The single shared pivot for the whole rig — avatar + desk + chair +
// monitor all live inside this ONE group, so a single rotation.y always
// spins everything together around the same point. This is the actual
// fix for the "avatar swings away from the chair" bug: previously the
// avatar and the desk were separate groups, each rotating around its OWN
// anchor, which only ever looked right at exactly one tuned angle.
function Rig({ framing, dragYRef, children }) {
  const ref = useRef();
  useFrame(() => {
    if (!ref.current) return;
    ref.current.rotation.y = framing.rotationY + (dragYRef?.current ?? 0);
  });
  return (
    <group
      ref={ref}
      position={[framing.positionX, framing.positionY, framing.positionZ]}
    >
      {children}
    </group>
  );
}

function Scene({ paused, framing, dragYRef }) {
  return (
    <>
      <CameraRig framing={framing} />

      <ambientLight intensity={0.22} />
      <directionalLight position={[-2.5, 3, 2.5]} intensity={0.9} color="#22d3ee" />
      <directionalLight position={[0.5, 2.5, -3]} intensity={0.28} color="#a5f3fc" />
      <pointLight position={[-1.5, 1.2, 1.8]} intensity={0.12} color="#22d3ee" />

      {/* ONE shared pivot for the whole rig — see the Rig component comment
          for why this replaced the old "two independent groups, same
          angle" setup. The desk's position here is a FIXED OFFSET relative
          to the avatar (not an independent absolute position), computed
          once from the previously-tuned deskX/Y/Z and positionX/Y/Z so the
          default view is pixel-identical to before this refactor. */}
      <Rig framing={framing} dragYRef={dragYRef}>
        <group scale={framing.scale}>
          <AvatarModel paused={paused} framing={framing} />
        </group>

        <group
          position={[
            framing.deskX - framing.positionX,
            framing.deskY - framing.positionY,
            framing.deskZ - framing.positionZ,
          ]}
          scale={framing.deskScale}
        >
          <CyberDesk
            peripherals={{
              monX: framing.monX, monY: framing.monY, monZ: framing.monZ,
              monScale: framing.monScale, monTurnDeg: framing.monTurnDeg,
              kbX: framing.kbX, kbY: framing.kbY, kbZ: framing.kbZ,
              mouseX: framing.mouseX, mouseY: framing.mouseY, mouseZ: framing.mouseZ,
            }}
          />
        </group>

        <ContactShadows
          position={[0, 0.02, 0]}
          opacity={0.42}
          scale={7}
          blur={2.4}
          far={3.5}
          resolution={256}
          color="#000000"
        />
      </Rig>
    </>
  );
}

const DRAG_SENSITIVITY = 0.006; // radians per pixel of horizontal drag

export default function AvatarScene() {
  const containerRef = useRef(null);
  const [inView, setInView] = useState(true);
  const [framing, setFraming] = useState(PROD_FRAMING);
  const dragYRef = useRef(0);
  const isDraggingRef = useRef(false);
  const lastXRef = useRef(0);

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

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const onPointerMove = (e) => {
      if (!isDraggingRef.current) return;
      const deltaX = e.clientX - lastXRef.current;
      lastXRef.current = e.clientX;
      dragYRef.current += deltaX * DRAG_SENSITIVITY;
    };

    const stopDragging = () => {
      isDraggingRef.current = false;
      node.style.cursor = "grab";
    };

    const onPointerDown = (e) => {
      isDraggingRef.current = true;
      lastXRef.current = e.clientX;
      node.style.cursor = "grabbing";
    };

    node.style.cursor = "grab";
    node.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", stopDragging);
    window.addEventListener("pointercancel", stopDragging);

    return () => {
      node.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", stopDragging);
      window.removeEventListener("pointercancel", stopDragging);
    };
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
          <Scene paused={!inView} framing={framing} dragYRef={dragYRef} />
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
