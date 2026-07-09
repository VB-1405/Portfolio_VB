import { useCallback, useEffect, useRef, useState } from "react";
import {
  MEMOJI_FIGURINE_IDLE_URL,
  MEMOJI_FIGURINE_WAVE_URL,
} from "../data";

const WAVE_MS = 1200;

const figurineShadow =
  "drop-shadow(0 16px 28px rgba(0,0,0,0.55)) drop-shadow(0 0 24px rgba(34,211,238,0.15))";

function useFigurineWave() {
  const [hovering, setHovering] = useState(false);
  const [greeting, setGreeting] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  const wave = useCallback(() => {
    if (reduceMotion) return;
    setGreeting(true);
    setTimeout(() => setGreeting(false), WAVE_MS);
  }, [reduceMotion]);

  useEffect(() => {
    setReduceMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    if (reduceMotion) return undefined;
    const start = setTimeout(wave, 2000);
    return () => clearTimeout(start);
  }, [reduceMotion, wave]);

  return {
    setHovering,
    waving: !reduceMotion && (hovering || greeting),
    wave,
  };
}

function FigurineLayers({ waving }) {
  const imgClass =
    "absolute inset-0 h-full w-full object-contain object-bottom transition-opacity duration-300 ease-out pointer-events-none select-none";

  return (
    <>
      <img
        src={MEMOJI_FIGURINE_IDLE_URL}
        alt=""
        aria-hidden="true"
        draggable={false}
        className={`${imgClass} ${waving ? "opacity-0" : "opacity-100"}`}
        style={{ filter: figurineShadow }}
      />
      <img
        src={MEMOJI_FIGURINE_WAVE_URL}
        alt=""
        aria-hidden="true"
        draggable={false}
        className={`${imgClass} ${waving ? "opacity-100" : "opacity-0"}`}
        style={{ filter: figurineShadow }}
      />
    </>
  );
}

function TechPedestal() {
  return (
    <div className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 w-[88%]" aria-hidden="true">
      <div className="mx-auto h-3 rounded-[100%] bg-gradient-to-b from-cyan-400/30 to-cyan-900/20 blur-[1px]" />
      <div className="mx-auto -mt-1 h-[3px] w-[92%] rounded-full bg-cyan-400/50 shadow-[0_0_12px_rgba(34,211,238,0.45)]" />
      <div className="mx-auto mt-1 h-2 w-[70%] rounded-full bg-cyan-400/20 blur-md" />
    </div>
  );
}

export default function Mascot() {
  const { setHovering, waving, wave } = useFigurineWave();
  const tiltRef = useRef({ x: 0, y: 0 });
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const onPointerMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    tiltRef.current = {
      x: ((e.clientX - rect.left) / rect.width - 0.5) * 10,
      y: ((e.clientY - rect.top) / rect.height - 0.5) * -4,
    };
    setTilt({ ...tiltRef.current });
  };

  const onPointerLeave = () => {
    tiltRef.current = { x: 0, y: 0 };
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
        <TechPedestal />
        <div
          className="relative h-full w-full transition-transform duration-200 ease-out"
          style={{
            transform: `rotateY(${-14 + tilt.x}deg) rotateX(${tilt.y}deg)`,
            transformStyle: "preserve-3d",
          }}
        >
          <FigurineLayers waving={waving} />
        </div>
      </button>
    </div>
  );
}
