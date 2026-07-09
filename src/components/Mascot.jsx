import { useCallback, useEffect, useRef, useState } from "react";

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
const asset = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
const WAVE_MS = 900;

/**
 * Mascot — Memoji-style avatar badge with cursor tilt and a wave on hover / greeting.
 */
export default function Mascot({ size = 64 }) {
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

  return (
    <button
      ref={ref}
      type="button"
      onMouseEnter={wave}
      onFocus={wave}
      onClick={wave}
      aria-label="Profile mascot — Vrishabh Bhavsar, wave hello"
      className="relative shrink-0 cursor-pointer rounded-full border-0 bg-transparent p-0 outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
      style={{ width: size, height: size }}
    >
      <div
        role="presentation"
        className={`relative h-full w-full overflow-hidden rounded-full border border-cyan-400/40 bg-zinc-900 transition-transform duration-300 ease-out ${waving ? "animate-wave" : ""}`}
        style={{
          transform: waving ? undefined : `rotate(${tilt}deg)`,
        }}
      >
        <div className="absolute inset-0 rounded-full bg-cyan-400/15 animate-pulse" />
        <div
          className="absolute -inset-1 rounded-full border border-cyan-400/25 animate-spin-slow"
          style={{ borderTopColor: "rgba(34,211,238,0.7)" }}
        />
        <img
          src={asset("memoji.png")}
          alt=""
          aria-hidden="true"
          className="relative h-full w-full object-cover object-[center_20%]"
          draggable={false}
        />
      </div>

      <span
        aria-hidden="true"
        className={`pointer-events-none absolute -bottom-0.5 -right-1 select-none leading-none transition-opacity duration-200 ${waving ? "animate-wave opacity-100" : "opacity-0"}`}
        style={{
          fontSize: size * 0.42,
          transformOrigin: "bottom right",
        }}
      >
        👋
      </span>
    </button>
  );
}
