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
      const maxGaze = 2.8;

      setGaze({
        x: Math.cos(angle) * maxGaze * dist,
        y: Math.sin(angle) * maxGaze * dist,
        tilt: clamp((dx / window.innerWidth) * 14, -8, 8),
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
        setTimeout(() => setBlink(false), 130);
        scheduleBlink();
      }, 3200 + Math.random() * 2800);
    };

    scheduleBlink();
    return () => clearTimeout(timeoutId);
  }, [reduceMotion]);

  const Eye = ({ cx }) => (
    <g transform={`translate(${cx} 30)`}>
      <ellipse
        cx="0"
        cy="0"
        rx="4.2"
        ry={blink ? 0.5 : 4.8}
        fill="#e2e8f0"
        className="transition-all duration-100"
      />
      {!blink && (
        <>
          <circle cx={gaze.x} cy={gaze.y} r="2.1" fill="#0f172a" className="transition-transform duration-150 ease-out" />
          <circle cx={gaze.x + 0.8} cy={gaze.y - 0.8} r="0.65" fill="#f8fafc" opacity="0.9" />
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
        width={size * 0.62}
        height={size * 0.62}
        className="relative z-[1]"
      >
        <path d="M18 24 L14 10 L26 20 Z" fill="#1e293b" stroke="#22d3ee" strokeWidth="1.2" strokeLinejoin="round" />
        <path d="M46 24 L50 10 L38 20 Z" fill="#1e293b" stroke="#22d3ee" strokeWidth="1.2" strokeLinejoin="round" />
        <circle cx="32" cy="34" r="18" fill="#0f172a" stroke="#334155" strokeWidth="1.2" />
        <ellipse cx="32" cy="40" rx="9" ry="7" fill="#1e293b" />
        <ellipse cx="32" cy="37" rx="5" ry="3.5" fill="#334155" />
        <path d="M32 40 L29 43 M32 40 L35 43" stroke="#64748b" strokeWidth="1.2" strokeLinecap="round" />
        <Eye cx={24} />
        <Eye cx={40} />
      </svg>
    </div>
  );
}
