import { useEffect, useState } from "react";

const asset = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;

function useArmWave() {
  const [hovering, setHovering] = useState(false);
  const [greeting, setGreeting] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    setReduceMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    if (reduceMotion) return undefined;
    const start = setTimeout(() => setGreeting(true), 1600);
    const stop = setTimeout(() => setGreeting(false), 2550);
    return () => {
      clearTimeout(start);
      clearTimeout(stop);
    };
  }, [reduceMotion]);

  const animating = !reduceMotion && (hovering || greeting);

  return {
    hovering,
    setHovering,
    animating,
    loop: hovering,
    waveOnce: () => {
      if (reduceMotion) return;
      setGreeting(true);
      setTimeout(() => setGreeting(false), 900);
    },
  };
}

/**
 * 3D Memoji figurine — body stays planted; only the right arm swings to wave.
 */
function MascotCompanion() {
  const { setHovering, animating, loop, waveOnce } = useArmWave();

  return (
    <div className="hidden xl:block fixed left-0 bottom-0 z-30 pointer-events-none">
      <button
        type="button"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        onFocus={() => setHovering(true)}
        onBlur={() => setHovering(false)}
        onClick={waveOnce}
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
          style={{ transform: "rotateY(-12deg)", transformStyle: "preserve-3d" }}
        >
          <img
            src={asset("memoji-figurine-idle.png")}
            alt=""
            aria-hidden="true"
            draggable={false}
            className="relative block h-full w-full object-contain object-bottom"
            style={{
              filter:
                "drop-shadow(0 18px 28px rgba(0,0,0,0.55)) drop-shadow(0 0 22px rgba(34,211,238,0.12))",
            }}
          />

          {/* Right arm — pivots at shoulder; body/base never moves */}
          <img
            src={asset("memoji-arm-idle.png")}
            alt=""
            aria-hidden="true"
            draggable={false}
            className={`absolute z-10 object-contain pointer-events-none ${
              animating ? (loop ? "animate-wave-arm-loop" : "animate-wave-arm") : ""
            }`}
            style={{
              top: "27.5%",
              left: "56.5%",
              width: "13.5%",
              transform: animating ? undefined : "rotate(14deg)",
              transformOrigin: "top center",
              filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.35))",
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
