import { useEffect, useRef, useState } from "react";

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

/**
 * Mascot — wolf badge with cursor-tracking eyes and a subtle head tilt.
 */
export default function Mascot({ size = 64 }) {
  const ref = useRef(null);
  const [gaze, setGaze] = useState({ x: 0, y: 0, tilt: 0 });
  const [blink, setBlink] = useState(false);
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
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const angle = Math.atan2(dy, dx);
      const dist = clamp(Math.hypot(dx, dy) / 140, 0, 1);
      const maxGaze = 2.4;

      setGaze({
        x: Math.cos(angle) * maxGaze * dist,
        y: Math.sin(angle) * maxGaze * dist,
        tilt: clamp((dx / window.innerWidth) * 12, -7, 7),
      });
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [reduceMotion]);

  useEffect(() => {
    if (reduceMotion) return undefined;

    let timeoutId;
    const scheduleBlink = () => {
      timeoutId = setTimeout(() => {
        setBlink(true);
        setTimeout(() => setBlink(false), 120);
        scheduleBlink();
      }, 3200 + Math.random() * 2800);
    };

    scheduleBlink();
    return () => clearTimeout(timeoutId);
  }, [reduceMotion]);

  const Eye = ({ cx, cy, tilt }) => (
    <g transform={`translate(${cx} ${cy}) rotate(${tilt})`}>
      <ellipse
        cx="0"
        cy="0"
        rx="3.8"
        ry={blink ? 0.45 : 3.2}
        fill="#fbbf24"
        stroke="#92400e"
        strokeWidth="0.6"
        className="transition-all duration-100"
      />
      {!blink && (
        <>
          <ellipse cx={gaze.x} cy={gaze.y} rx="1.5" ry="2" fill="#0f172a" className="transition-all duration-150 ease-out" />
          <circle cx={gaze.x + 0.5} cy={gaze.y - 0.7} r="0.55" fill="#fef3c7" opacity="0.85" />
        </>
      )}
    </g>
  );

  return (
    <div
      ref={ref}
      role="img"
      aria-label="Wolf mascot logo — Vrishabh Bhavsar, cybersecurity portfolio"
      className="relative shrink-0 flex items-center justify-center rounded-full bg-zinc-900 border border-cyan-400/40 transition-transform duration-300 ease-out"
      style={{
        width: size,
        height: size,
        transform: `rotate(${gaze.tilt}deg)`,
      }}
    >
      <div className="absolute inset-0 rounded-full bg-cyan-400/15 animate-pulse" />
      <div
        className="absolute -inset-1 rounded-full border border-cyan-400/25 animate-spin-slow"
        style={{ borderTopColor: "rgba(34,211,238,0.7)" }}
      />

      <svg
        aria-hidden="true"
        viewBox="0 0 64 64"
        width={size * 0.66}
        height={size * 0.66}
        className="relative z-[1]"
      >
        {/* tall wolf ears */}
        <path d="M16 26 L11 6 L22 18 Z" fill="#334155" stroke="#22d3ee" strokeWidth="1" strokeLinejoin="round" />
        <path d="M48 26 L53 6 L42 18 Z" fill="#334155" stroke="#22d3ee" strokeWidth="1" strokeLinejoin="round" />
        <path d="M17 22 L14 12 L20 19 Z" fill="#475569" />
        <path d="M47 22 L50 12 L44 19 Z" fill="#475569" />

        {/* head + cheek fur */}
        <path
          d="M32 12 C22 12 14 20 14 30 C14 38 18 44 24 46 L24 42 C20 38 18 34 18 28 C18 22 24 16 32 16 C40 16 46 22 46 28 C46 34 44 38 40 42 L40 46 C46 44 50 38 50 30 C50 20 42 12 32 12 Z"
          fill="#1e293b"
          stroke="#475569"
          strokeWidth="1"
        />

        {/* forehead marking */}
        <path d="M32 18 L28 24 L32 22 L36 24 Z" fill="#475569" opacity="0.7" />

        {/* long wolf muzzle */}
        <path
          d="M32 28 C26 28 22 32 22 38 L22 48 C22 52 26 54 32 54 C38 54 42 52 42 48 L42 38 C42 32 38 28 32 28 Z"
          fill="#334155"
          stroke="#64748b"
          strokeWidth="0.8"
        />
        <path d="M32 32 L28 40 L32 38 L36 40 Z" fill="#475569" opacity="0.55" />

        {/* nose */}
        <path d="M32 50 L29 54 L32 55 L35 54 Z" fill="#0f172a" />
        <ellipse cx="32" cy="50.5" rx="3" ry="2" fill="#1e293b" />

        {/* subtle fang hints */}
        <path d="M28 46 L27 49 M36 46 L37 49" stroke="#cbd5e1" strokeWidth="0.9" strokeLinecap="round" opacity="0.5" />

        {/* almond wolf eyes — angled inward */}
        <Eye cx={25} cy={27} tilt={-8} />
        <Eye cx={39} cy={27} tilt={8} />
      </svg>
    </div>
  );
}
