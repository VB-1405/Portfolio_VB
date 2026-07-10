import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Edges } from "@react-three/drei";
import * as THREE from "three";

/* =========================================================================
   CYBERPUNK DESK RIG  —  desk + curved SOC monitor + gaming chair
   Procedural (no external assets). Dark bodies + neon edge glow.
   -------------------------------------------------------------------------
   TUNING: position the whole rig relative to the avatar with these three.
   Use the Leva sliders (added in the wiring step) to dial them in live,
   then bake the final numbers back into these constants.
   ========================================================================= */
export const DESK_RIG_POSITION = [-0.2, 0.0, 0.15]; // [x, y, z] feet-on-floor at y=0
export const DESK_RIG_ROTATION_Y = 0.0; // radians; match avatar facing
export const DESK_RIG_SCALE = 1.05;
export const SHOW_CHAIR = true; // set false while the avatar is STANDING (see notes)

/* ---- Cyberpunk palette (cyan primary matches your SOC theme) ---- */
const NEON_CYAN = "#22d3ee";
const NEON_MAGENTA = "#ff2d95";
const NEON_PURPLE = "#a855f7";
const BODY_DARK = "#0a0e14";

/* Reusable dark metal body material props */
const BODY = { color: BODY_DARK, metalness: 0.85, roughness: 0.35 };

/* Emissive neon strip material (glows under bloom, bright without it) */
function neon(color, intensity = 2.2) {
  return { color, emissive: color, emissiveIntensity: intensity, toneMapped: false };
}

/* -------------------------------------------------------------------------
   Animated monitor screen — scrolling fake SOC terminal drawn to a canvas
   ------------------------------------------------------------------------- */
function useScreenTexture() {
  const { tex, ctx } = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 320;
    c.height = 200;
    const ctx = c.getContext("2d");
    const tex = new THREE.CanvasTexture(c);
    tex.minFilter = THREE.LinearFilter;
    return { tex, ctx };
  }, []);

  // Pre-generate stable lines so the screen scrolls instead of flickering
  const lines = useMemo(() => {
    const hex = () =>
      Array.from({ length: 8 }, () =>
        Math.floor(Math.random() * 256).toString(16).padStart(2, "0")
      ).join(" ");
    const pool = [
      ["root@soc:~# tail -f /var/log/alerts", NEON_CYAN],
      ["[OK]  auth  200  10.0.4.12", "#39d98a"],
      ["[OK]  dns   NOERROR  cdn.edge", "#39d98a"],
      ["[!!]  ALERT  T1550.002  PTH detected", NEON_MAGENTA],
      ["      src=10.0.4.55 dst=DC01", "#7dd3fc"],
      ["[OK]  edr   quarantine  ok", "#39d98a"],
      ["[..]  hunt  kerberoast  T1558.003", NEON_PURPLE],
      [() => hex(), "#3b82f6"],
      ["[OK]  splunk  index=wineventlog", "#39d98a"],
      ["[!!]  ALERT  LSASS access  T1003.001", NEON_MAGENTA],
      [() => hex(), "#3b82f6"],
      ["> correlating events ...", NEON_CYAN],
    ];
    const out = [];
    for (let i = 0; i < 40; i++) {
      const [t, c] = pool[i % pool.length];
      out.push([typeof t === "function" ? t() : t, c]);
    }
    return out;
  }, []);

  const scroll = useRef(0);
  const acc = useRef(0);
  useFrame((_, dt) => {
    acc.current += dt;
    if (acc.current < 1 / 20) return; // throttle to ~20fps, plenty for a screen
    acc.current = 0;
    scroll.current += 1;

    ctx.fillStyle = "#02121a";
    ctx.fillRect(0, 0, 320, 200);
    // faint scanline vibe
    ctx.fillStyle = "rgba(34,211,238,0.04)";
    for (let y = 0; y < 200; y += 4) ctx.fillRect(0, y, 320, 1);

    ctx.font = "12px monospace";
    const lineH = 15;
    const total = lines.length * lineH;
    const offset = (scroll.current * 3) % total;
    for (let i = 0; i < lines.length; i++) {
      let y = i * lineH - offset;
      if (y < -lineH) y += total;
      const [text, color] = lines[i];
      ctx.fillStyle = color;
      ctx.fillText(text, 10, y + 14);
    }
    // blinking cursor
    if (Math.floor(scroll.current / 6) % 2 === 0) {
      ctx.fillStyle = NEON_CYAN;
      ctx.fillRect(10, 186, 8, 12);
    }
    tex.needsUpdate = true;
  });

  return tex;
}

/* -------------------------------------------------------------------------
   Curved SOC monitor
   ------------------------------------------------------------------------- */
function Monitor({ position = [0, 0, 0] }) {
  const screen = useScreenTexture();
  const R = 1.15; // curve radius
  const arc = 0.55; // radians of arc
  const h = 0.46; // screen height
  const start = Math.PI / 2 - arc / 2;

  return (
    <group position={position}>
      {/* dark bezel shell, slightly larger arc behind the screen */}
      <mesh>
        <cylinderGeometry args={[R + 0.02, R + 0.02, h + 0.05, 48, 1, true, start - 0.03, arc + 0.06]} />
        <meshStandardMaterial {...BODY} side={THREE.BackSide} />
      </mesh>
      {/* emissive SOC screen */}
      <mesh>
        <cylinderGeometry args={[R, R, h, 48, 1, true, start, arc]} />
        <meshBasicMaterial map={screen} side={THREE.BackSide} toneMapped={false} />
      </mesh>
      {/* neon underbar */}
      <mesh position={[0, -h / 2 - 0.03, R - 0.08]}>
        <boxGeometry args={[0.5, 0.02, 0.03]} />
        <meshStandardMaterial {...neon(NEON_CYAN, 3)} />
      </mesh>
      {/* stand neck + base */}
      <mesh position={[0, -h / 2 - 0.16, R - 0.05]}>
        <boxGeometry args={[0.05, 0.28, 0.05]} />
        <meshStandardMaterial {...BODY} />
      </mesh>
      <mesh position={[0, -h / 2 - 0.3, R - 0.05]}>
        <boxGeometry args={[0.32, 0.03, 0.22]} />
        <meshStandardMaterial {...BODY} />
        <Edges scale={1.02} threshold={15} color={NEON_MAGENTA} />
      </mesh>
    </group>
  );
}

/* -------------------------------------------------------------------------
   Desk — standing-desk height so it lines up with the standing avatar's hands
   ------------------------------------------------------------------------- */
function Desk() {
  const topY = 1.02;
  const w = 1.7;
  const d = 0.72;
  return (
    <group>
      {/* desktop */}
      <mesh position={[0, topY, 0]} castShadow>
        <boxGeometry args={[w, 0.05, d]} />
        <meshStandardMaterial {...BODY} />
        <Edges scale={1.001} threshold={15} color={NEON_CYAN} />
      </mesh>
      {/* neon underglow strip beneath the front edge */}
      <mesh position={[0, topY - 0.04, d / 2 - 0.02]}>
        <boxGeometry args={[w - 0.1, 0.015, 0.02]} />
        <meshStandardMaterial {...neon(NEON_MAGENTA, 3)} />
      </mesh>
      {/* angled side panels as legs */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (w / 2 - 0.08), topY / 2, 0]}>
          <boxGeometry args={[0.06, topY, d - 0.08]} />
          <meshStandardMaterial {...BODY} />
          <Edges scale={1.02} threshold={15} color={NEON_CYAN} />
        </mesh>
      ))}
      {/* rear cable-management crossbar with purple glow */}
      <mesh position={[0, 0.12, -d / 2 + 0.06]}>
        <boxGeometry args={[w - 0.2, 0.04, 0.04]} />
        <meshStandardMaterial {...neon(NEON_PURPLE, 1.6)} />
      </mesh>
    </group>
  );
}

/* -------------------------------------------------------------------------
   Gaming chair (stylized). NOTE: meant for a SEATED avatar.
   ------------------------------------------------------------------------- */
function Chair() {
  const seatY = 0.5;
  return (
    <group position={[0, 0, -0.55]}>
      {/* seat */}
      <mesh position={[0, seatY, 0]}>
        <boxGeometry args={[0.5, 0.1, 0.5]} />
        <meshStandardMaterial {...BODY} />
        <Edges scale={1.02} threshold={15} color={NEON_CYAN} />
      </mesh>
      {/* backrest, tilted */}
      <mesh position={[0, seatY + 0.45, -0.24]} rotation={[-0.18, 0, 0]}>
        <boxGeometry args={[0.5, 0.85, 0.1]} />
        <meshStandardMaterial {...BODY} />
        <Edges scale={1.02} threshold={15} color={NEON_MAGENTA} />
      </mesh>
      {/* neon spine strips on the backrest */}
      {[-0.18, 0.18].map((x) => (
        <mesh key={x} position={[x, seatY + 0.45, -0.185]} rotation={[-0.18, 0, 0]}>
          <boxGeometry args={[0.03, 0.8, 0.015]} />
          <meshStandardMaterial {...neon(NEON_CYAN, 2.6)} />
        </mesh>
      ))}
      {/* armrests */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.3, seatY + 0.18, 0]}>
          <boxGeometry args={[0.08, 0.06, 0.34]} />
          <meshStandardMaterial {...BODY} />
        </mesh>
      ))}
      {/* gas cylinder */}
      <mesh position={[0, seatY - 0.22, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.34, 12]} />
        <meshStandardMaterial {...BODY} />
      </mesh>
      {/* 5-star base with caster spheres */}
      {Array.from({ length: 5 }).map((_, i) => {
        const a = (i / 5) * Math.PI * 2;
        const x = Math.cos(a) * 0.28;
        const z = Math.sin(a) * 0.28;
        return (
          <group key={i}>
            <mesh position={[x / 2, 0.06, z / 2]} rotation={[0, -a, 0]}>
              <boxGeometry args={[0.3, 0.04, 0.05]} />
              <meshStandardMaterial {...BODY} />
            </mesh>
            <mesh position={[x, 0.03, z]}>
              <sphereGeometry args={[0.035, 12, 12]} />
              <meshStandardMaterial {...neon(NEON_MAGENTA, 1.4)} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/* -------------------------------------------------------------------------
   Grounding neon ring under the whole rig
   ------------------------------------------------------------------------- */
function GroundRing() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, -0.2]}>
      <ringGeometry args={[0.95, 1.0, 64]} />
      <meshStandardMaterial {...neon(NEON_CYAN, 1.6)} side={THREE.DoubleSide} />
    </mesh>
  );
}

/* =========================================================================
   MAIN EXPORT
   ========================================================================= */
export default function CyberDesk({
  position = DESK_RIG_POSITION,
  rotationY = DESK_RIG_ROTATION_Y,
  scale = DESK_RIG_SCALE,
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={scale}>
      <Desk />
      <Monitor position={[0, 1.28, -0.12]} />
      {SHOW_CHAIR && <Chair />}
      <GroundRing />

      {/* colored light spill onto the avatar — the core cyberpunk effect */}
      <pointLight position={[0, 1.35, 0.3]} color={NEON_CYAN} intensity={6} distance={3} decay={2} />
      <pointLight position={[0, 0.3, 0.2]} color={NEON_MAGENTA} intensity={4} distance={2.5} decay={2} />
    </group>
  );
}
