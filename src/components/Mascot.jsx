import { useCallback, useEffect, useState } from "react";
import {
  MEMOJI_FIGURINE_IDLE_URL,
  MEMOJI_FIGURINE_WAVE_URL,
} from "../data";

const WAVE_HOLD_MS = 2800;

const figurineShadow =
  "drop-shadow(0 16px 28px rgba(0,0,0,0.55)) drop-shadow(0 0 24px rgba(34,211,238,0.15))";

function useFigurineWave() {
  const [hovering, setHovering] = useState(false);
  const [greeting, setGreeting] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  const wave = useCallback(() => {
    if (reduceMotion) return;
    setGreeting(true);
    setTimeout(() => setGreeting(false), WAVE_HOLD_MS);
  }, [reduceMotion]);

  useEffect(() => {
    setReduceMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    if (reduceMotion) return undefined;
    const start = setTimeout(wave, 2500);
    return () => clearTimeout(start);
  }, [reduceMotion, wave]);

  const waving = !reduceMotion && (hovering || greeting);

  return { setHovering, waving, wave, reduceMotion };
}

function TechPedestal({ reduceMotion }) {
  return (
    <div className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 w-[88%]" aria-hidden="true">
      <div
        className={`mx-auto h-[3px] w-[92%] rounded-full bg-cyan-400/50 shadow-[0_0_12px_rgba(34,211,238,0.45)] ${
          reduceMotion ? "" : "animate-pedestal-pulse"
        }`}
      />
      <div className="mx-auto mt-1 h-2 w-[70%] rounded-full bg-cyan-400/20 blur-md" />
    </div>
  );
}

function AnimatedFigurine({ waving, reduceMotion }) {
  const imgClass =
    "absolute inset-0 h-full w-full object-contain object-bottom pointer-events-none select-none";

  const idleMotion = reduceMotion ? "" : "animate-mascot-float animate-mascot-sway";
  const waveMotion = reduceMotion ? "" : "animate-mascot-float animate-wave-arm-loop";

  return (
    <div className="relative h-full w-full" style={{ filter: figurineShadow }}>
      <div
        className={`absolute inset-0 transition-opacity duration-[450ms] ease-out ${
          waving ? "opacity-0" : "opacity-100"
        } ${idleMotion}`}
        style={{ transformOrigin: "50% 92%" }}
        aria-hidden={waving}
      >
        <img src={MEMOJI_FIGURINE_IDLE_URL} alt="" draggable={false} className={imgClass} />
      </div>

      <div
        className={`absolute inset-0 transition-opacity duration-[450ms] ease-out ${
          waving ? "opacity-100" : "opacity-0"
        } ${waveMotion}`}
        style={{ transformOrigin: "42% 38%" }}
        aria-hidden={!waving}
      >
        <img src={MEMOJI_FIGURINE_WAVE_URL} alt="" draggable={false} className={imgClass} />
      </div>
    </div>
  );
}

export default function Mascot() {
  const { setHovering, waving, wave, reduceMotion } = useFigurineWave();
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const onPointerMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTilt({
      x: ((e.clientX - rect.left) / rect.width - 0.5) * 10,
      y: ((e.clientY - rect.top) / rect.height - 0.5) * -4,
    });
  };

  const onPointerLeave = () => {
    setTilt({ x: 0, y: 0 });
    setHovering(false);
  };

  return (
    <div className="hidden lg:block fixed left-0 bottom-0 z-30 pointer-events-none w-[min(34vw,320px)] h-[min(72vh,560px)]">
      <button
        type="button"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={onPointerLeave}
        onPointerMove={onPointerMove}
        onFocus={() => setHovering(true)}
        onBlur={() => setHovering(false)}
        onClick={wave}
        aria-label="Profile mascot — Vrishabh Bhavsar, wave hello"
        className="pointer-events-auto relative h-full w-full cursor-pointer border-0 bg-transparent p-0 pl-2 pb-0 outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 rounded-lg"
        style={{ perspective: "1000px" }}
      >
        <TechPedestal reduceMotion={reduceMotion} />
        <div
          className="relative h-full w-full transition-transform duration-200 ease-out"
          style={{
            transform: `rotateY(${-14 + tilt.x}deg) rotateX(${tilt.y}deg)`,
            transformStyle: "preserve-3d",
          }}
        >
          <AnimatedFigurine waving={waving} reduceMotion={reduceMotion} />
        </div>
      </button>
    </div>
  );
}
