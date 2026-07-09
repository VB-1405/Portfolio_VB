import { useCallback, useEffect, useRef, useState } from "react";

const asset = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
const WAVE_MS = 1200;

function useMascotWave() {
  const waveTimer = useRef(null);
  const [waving, setWaving] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  const wave = useCallback(() => {
    if (reduceMotion) return;
    setWaving(true);
    clearTimeout(waveTimer.current);
    waveTimer.current = setTimeout(() => setWaving(false), WAVE_MS);
  }, [reduceMotion]);

  useEffect(() => {
    setReduceMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    if (reduceMotion) return undefined;
    const greet = setTimeout(wave, 1600);
    return () => clearTimeout(greet);
  }, [reduceMotion, wave]);

  useEffect(() => () => clearTimeout(waveTimer.current), []);

  return { waving, wave, reduceMotion };
}

/**
 * Full-body 3D Memoji figurine fixed to the left edge — swaps to a wave pose, no body sway.
 */
function MascotCompanion() {
  const { waving, wave } = useMascotWave();

  return (
    <div className="hidden xl:block fixed left-0 bottom-0 z-30 pointer-events-none">
      <button
        type="button"
        onMouseEnter={wave}
        onFocus={wave}
        onClick={wave}
        aria-label="Profile mascot — Vrishabh Bhavsar, wave hello"
        className="pointer-events-auto relative cursor-pointer border-0 bg-transparent p-0 pl-4 pb-0 outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded-lg"
        style={{ perspective: "900px" }}
      >
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 w-32 h-10 bg-cyan-400/25 blur-2xl rounded-full"
          aria-hidden="true"
        />
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-3 rounded-[100%] bg-black/50 blur-sm"
          aria-hidden="true"
        />

        <div
          className="relative h-[min(62vh,460px)] w-[min(28vw,240px)]"
          style={{ transform: "rotateY(-14deg)", transformStyle: "preserve-3d" }}
        >
          <img
            src={asset("memoji-figurine.png")}
            alt=""
            aria-hidden="true"
            draggable={false}
            className={`absolute inset-0 h-full w-full object-contain object-bottom transition-opacity duration-300 ease-out ${
              waving ? "opacity-0" : "opacity-100"
            }`}
            style={{
              filter:
                "drop-shadow(0 18px 28px rgba(0,0,0,0.55)) drop-shadow(0 0 22px rgba(34,211,238,0.12))",
            }}
          />
          <img
            src={asset("memoji-figurine-wave.png")}
            alt=""
            aria-hidden="true"
            draggable={false}
            className={`absolute inset-0 h-full w-full object-contain object-bottom transition-opacity duration-300 ease-out ${
              waving ? "opacity-100" : "opacity-0"
            }`}
            style={{
              filter:
                "drop-shadow(0 18px 28px rgba(0,0,0,0.55)) drop-shadow(0 0 22px rgba(34,211,238,0.12))",
            }}
          />
        </div>
      </button>
    </div>
  );
}

/**
 * Mascot — 3D Memoji figurine companion on large screens (left side).
 */
export default function Mascot({ variant = "companion" }) {
  if (variant === "companion") return <MascotCompanion />;
  return null;
}
