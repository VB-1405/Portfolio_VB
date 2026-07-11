import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Edges, RoundedBox } from "@react-three/drei";
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
function neon(color, intensity = 1.1) {
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
function Monitor({ position = [0, 0, 0], scale = 1, turnDeg = -15 }) {
  const screen = useScreenTexture();
  const R = 1.15; // curve radius
  const arc = 0.55; // radians of arc
  const h = 0.46; // screen height
  const start = Math.PI / 2 - arc / 2;

  return (
    // Flip 180° so the emissive screen faces the avatar (who's "using" the
    // computer), and the dark bezel/back faces the camera/viewer — like a
    // real desk setup. Position is untouched; this is rotation only.
    // turnDeg is a separate, easy-to-tweak knob on top of that (now wired
    // to the "Peripherals" Leva panel as monTurnDeg).
    <group
      position={position}
      scale={scale}
      rotation={[0, Math.PI + (turnDeg * Math.PI) / 180, 0]}
    >
      {/* dark bezel shell, slightly larger arc behind the screen */}
      <mesh>
        <cylinderGeometry args={[R + 0.02, R + 0.02, h + 0.05, 48, 1, true, start - 0.03, arc + 0.06]} />
        <meshStandardMaterial {...BODY} side={THREE.BackSide} />
      </mesh>
      {/* emissive SOC screen */}
      <mesh>
        <cylinderGeometry args={[R, R, h, 48, 1, true, start, arc]} />
        <meshBasicMaterial map={screen} side={THREE.FrontSide} toneMapped={false} />
      </mesh>
      {/* neon underbar */}
      <mesh position={[0, -h / 2 - 0.03, R - 0.08]}>
        <boxGeometry args={[0.5, 0.02, 0.03]} />
        <meshStandardMaterial {...neon(NEON_CYAN, 1.5)} />
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
  const topY = 0.74; // seated-hand height (was 1.02, tuned for the old standing pose)
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
        <meshStandardMaterial {...neon(NEON_MAGENTA, 0.7)} />
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
        <meshStandardMaterial {...neon(NEON_PURPLE, 0.8)} />
      </mesh>
    </group>
  );
}

/* -------------------------------------------------------------------------
   Gaming chair — rounded bucket seat, headrest pillow, side bolsters,
   racing-stripe accent. Built for a SEATED avatar (seat height 0.5m).
   ------------------------------------------------------------------------- */
function Chair() {
  const seatY = 0.5;
  return (
    <group position={[0, 0, -0.55]}>
      {/* seat cushion — rounded bucket */}
      <RoundedBox args={[0.48, 0.09, 0.46]} radius={0.05} smoothness={4} position={[0, seatY, 0]}>
        <meshStandardMaterial {...BODY} />
      </RoundedBox>
      <Edges scale={1.01} threshold={15} color={NEON_CYAN} />

      {/* seat side bolsters (the raised edges that make it read as "gaming chair") */}
      {[-1, 1].map((s) => (
        <RoundedBox key={s} args={[0.07, 0.13, 0.46]} radius={0.04} smoothness={4}
          position={[s * 0.21, seatY + 0.05, 0]}>
          <meshStandardMaterial {...BODY} />
        </RoundedBox>
      ))}

      {/* backrest — tall rounded shell, slightly tilted */}
      <group position={[0, seatY + 0.48, -0.22]} rotation={[-0.16, 0, 0]}>
        <RoundedBox args={[0.46, 0.85, 0.11]} radius={0.07} smoothness={4}>
          <meshStandardMaterial {...BODY} />
        </RoundedBox>
        <Edges scale={1.01} threshold={15} color={NEON_MAGENTA} />
        {/* backrest side bolsters */}
        {[-1, 1].map((s) => (
          <RoundedBox key={s} args={[0.08, 0.8, 0.13]} radius={0.04} smoothness={4}
            position={[s * 0.21, 0, 0.01]}>
            <meshStandardMaterial {...BODY} />
          </RoundedBox>
        ))}
        {/* racing-stripe accent down the spine */}
        <mesh position={[0, 0, 0.058]}>
          <boxGeometry args={[0.05, 0.78, 0.008]} />
          <meshStandardMaterial {...neon(NEON_CYAN, 1.1)} />
        </mesh>
        {/* headrest pillow */}
        <RoundedBox args={[0.24, 0.22, 0.09]} radius={0.06} smoothness={4} position={[0, 0.52, 0.03]}>
          <meshStandardMaterial {...BODY} />
        </RoundedBox>
        <mesh position={[0, 0.52, 0.075]}>
          <boxGeometry args={[0.16, 0.03, 0.006]} />
          <meshStandardMaterial {...neon(NEON_MAGENTA, 0.8)} />
        </mesh>
      </group>

      {/* armrests — angled pads on slim risers */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.31, seatY + 0.16, 0.02]}>
          <mesh position={[0, -0.06, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.12, 10]} />
            <meshStandardMaterial {...BODY} />
          </mesh>
          <RoundedBox args={[0.09, 0.03, 0.28]} radius={0.015} smoothness={3}>
            <meshStandardMaterial {...BODY} />
          </RoundedBox>
        </group>
      ))}

      {/* gas cylinder */}
      <mesh position={[0, seatY - 0.22, 0]}>
        <cylinderGeometry args={[0.035, 0.04, 0.34, 14]} />
        <meshStandardMaterial {...BODY} />
      </mesh>

      {/* 5-star base with caster wheels */}
      {Array.from({ length: 5 }).map((_, i) => {
        const a = (i / 5) * Math.PI * 2;
        const x = Math.cos(a) * 0.28;
        const z = Math.sin(a) * 0.28;
        return (
          <group key={i}>
            <mesh position={[x / 2, 0.055, z / 2]} rotation={[0, -a, 0]}>
              <boxGeometry args={[0.3, 0.03, 0.045]} />
              <meshStandardMaterial {...BODY} />
            </mesh>
            <mesh position={[x, 0.03, z]}>
              <sphereGeometry args={[0.032, 12, 12]} />
              <meshStandardMaterial {...neon(NEON_MAGENTA, 0.7)} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/* -------------------------------------------------------------------------
   Keyboard — backlit RGB gaming keyboard (static canvas texture, cheap)
   ------------------------------------------------------------------------- */
function useKeyboardTexture() {
  return useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 340; c.height = 120;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#050709"; ctx.fillRect(0, 0, 340, 120);
    const cols = 16, rows = 5;
    const gap = 3;
    const kw = (340 - gap * (cols + 1)) / cols;
    const kh = (120 - gap * (rows + 1)) / rows;
    const hues = [190, 320, 270, 195]; // cyan, magenta, purple, cyan-ish cycle
    let hi = 0;
    for (let r = 0; r < rows; r++) {
      for (let col = 0; col < cols; col++) {
        const x = gap + col * (kw + gap);
        const y = gap + r * (kh + gap);
        const hue = hues[hi % hues.length]; hi++;
        ctx.fillStyle = `hsl(${hue}, 90%, 55%)`;
        ctx.globalAlpha = 0.85;
        ctx.fillRect(x, y, kw, kh * 0.55);
        ctx.globalAlpha = 1;
        ctx.fillStyle = "#0a0e14";
        ctx.fillRect(x, y + kh * 0.55, kw, kh * 0.45);
      }
    }
    const tex = new THREE.CanvasTexture(c);
    tex.minFilter = THREE.LinearFilter;
    return tex;
  }, []);
}

function Keyboard({ position = [0, 0, 0] }) {
  const tex = useKeyboardTexture();
  return (
    <group position={position}>
      <RoundedBox args={[0.34, 0.018, 0.13]} radius={0.008} smoothness={3}>
        <meshStandardMaterial color={BODY_DARK} metalness={0.6} roughness={0.4} />
      </RoundedBox>
      <mesh position={[0, 0.0105, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.32, 0.11]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
    </group>
  );
}

/* -------------------------------------------------------------------------
   Mouse — simple rounded body + scroll-wheel glow
   ------------------------------------------------------------------------- */
function Mouse({ position = [0, 0, 0] }) {
  return (
    <group position={position}>
      <RoundedBox args={[0.055, 0.03, 0.09]} radius={0.02} smoothness={4}>
        <meshStandardMaterial {...BODY} />
      </RoundedBox>
      <mesh position={[0, 0.016, 0.01]}>
        <boxGeometry args={[0.008, 0.006, 0.02]} />
        <meshStandardMaterial {...neon(NEON_CYAN, 1.2)} />
      </mesh>
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
  peripherals = {},
}) {
  // NOTE: this component previously ignored props entirely and always used
  // the raw exported constants — that's why the Leva "Desk Rig" sliders
  // appeared to do nothing. Now it actually reads position/rotationY/scale.
  //
  // peripherals is optional — pass the "Peripherals" Leva group straight
  // through from framing to live-tune monitor/keyboard/mouse without
  // touching desk/avatar coordinates at all.
  const {
    monX = 0, monY = 1.05, monZ = -0.12, monScale = 1, monTurnDeg = -15,
    kbX = 0, kbY = 0.75, kbZ = 0.08,
    mouseX = 0.22, mouseY = 0.756, mouseZ = 0.08,
  } = peripherals;

  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={scale}>
      <Desk />
      <Monitor position={[monX, monY, monZ]} scale={monScale} turnDeg={monTurnDeg} />
      <Keyboard position={[kbX, kbY, kbZ]} />
      <Mouse position={[mouseX, mouseY, mouseZ]} />
      {SHOW_CHAIR && <Chair />}
      <GroundRing />

      {/* colored light spill onto the avatar — the core cyberpunk effect */}
      <pointLight position={[0, 1.35, 0.3]} color={NEON_CYAN} intensity={3} distance={3} decay={2} />
      <pointLight position={[0, 0.3, 0.2]} color={NEON_MAGENTA} intensity={2} distance={2.5} decay={2} />
    </group>
  );
}
