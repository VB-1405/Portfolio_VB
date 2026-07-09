import { useCallback, useEffect, useRef, useState } from "react";

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
const asset = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
const WAVE_MS = 900;

function useMascotMotion() {
  const ref = useRef(null);
  const waveTimer = useRef(null);
  const [tilt, setTilt] = useState(0);
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
    const greet = setTimeout(wave, 1400);
    return () => clearTimeout(greet);
  }, [reduceMotion, wave]);

  useEffect(() => {
    if (reduceMotion) return undefined;

    const onMove = (e) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const dx = e.clientX - cx;
      setTilt(clamp((dx / window.innerWidth) * 12, -6, 6));
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [reduceMotion]);

  useEffect(() => () => clearTimeout(waveTimer.current), []);

  return { ref, tilt, waving, wave, reduceMotion };
}

/**
 * Full-body Memoji companion fixed to the left edge of the viewport.
 */
function MascotCompanion() {
  const { ref, tilt, waving, wave } = useMascotMotion();

  return (
    <div className="hidden xl:block fixed left-0 bottom-0 z-30 pointer-events-none">
      <button
        ref={ref}
        type="button"
        onMouseEnter={wave}
        onFocus={wave}
        onClick={wave}
        aria-label="Profile mascot — Vrishabh Bhavsar, wave hello"
        className="pointer-events-auto relative cursor-pointer border-0 bg-transparent p-0 pl-3 pb-0 outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded-lg"
      >
        <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 w-28 h-8 bg-cyan-400/20 blur-2xl rounded-full"
          aria-hidden="true"
        />
        <img
          src={asset("memoji-full.png")}
          alt=""
          aria-hidden="true"
          draggable={false}
          className={`relative block h-[min(62vh,460px)] w-auto max-w-[min(28vw,240px)] object-contain object-bottom drop-shadow-[0_0_28px_rgba(34,211,238,0.15)] transition-transform duration-300 ease-out ${waving ? "animate-wave" : ""}`}
          style={{
            transform: waving ? undefined : `rotate(${tilt * 0.6}deg)`,
            transformOrigin: "bottom center",
          }}
        />
      </button>
    </div>
  );
}

/**
 * Mascot — Memoji companion on large screens (left side, full body).
 */
export default function Mascot({ variant = "companion" }) {
  if (variant === "companion") return <MascotCompanion />;
  return null;
}
