import { useEffect, useRef, useState } from "react";

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
const asset = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;

/**
 * Mascot — Memoji-style avatar badge with optional subtle tilt toward the cursor.
 */
export default function Mascot({ size = 64 }) {
  const ref = useRef(null);
  const [tilt, setTilt] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    setReduceMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

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

  return (
    <div
      ref={ref}
      role="img"
      aria-label="Profile mascot — Vrishabh Bhavsar"
      className="relative shrink-0 overflow-hidden rounded-full border border-cyan-400/40 bg-zinc-900 transition-transform duration-300 ease-out"
      style={{
        width: size,
        height: size,
        transform: `rotate(${tilt}deg)`,
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
  );
}
