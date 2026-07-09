import { useCallback, useEffect, useRef, useState } from "react";

const asset = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
const WAVE_MS = 1200;

const FIGURINE_IDLE = asset("memoji-figurine-idle.png");
const FIGURINE_WAVE = asset("memoji-figurine-wave.png");

const figurineShadow =
  "drop-shadow(0 18px 28px rgba(0,0,0,0.55)) drop-shadow(0 0 22px rgba(34,211,238,0.12))";

function useMascotWave() {
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
  const imgClass = "absolute inset-0 h-full w-full object-contain object-bottom transition-opacity duration-300 ease-out";

  return (
    <>
      <img
        src={FIGURINE_IDLE}
        alt=""
        aria-hidden="true"
        draggable={false}
        className={`${imgClass} ${waving ? "opacity-0" : "opacity-100"}`}
        style={{ filter: figurineShadow }}
      />
      <img
        src={FIGURINE_WAVE}
        alt=""
        aria-hidden="true"
        draggable={false}
        className={`${imgClass} ${waving ? "opacity-100" : "opacity-0"}`}
        style={{ filter: figurineShadow }}
      />

      {/* Hood pulled up over the head */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[7%] z-10 h-[19%] w-[52%] -translate-x-1/2 rounded-t-[999px] rounded-b-[38%] bg-[#0c0c10]"
        style={{
          boxShadow: "inset 0 -6px 12px rgba(255,255,255,0.04), 0 4px 10px rgba(0,0,0,0.35)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[22%] z-10 h-[3.5%] w-[46%] -translate-x-1/2 rounded-full bg-[#08080c]"
      />

      {/* Surgical mask */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[34%] z-20 h-[9%] w-[34%] -translate-x-1/2 rounded-md bg-[#c5dce8]/95"
        style={{ boxShadow: "0 2px 6px rgba(0,0,0,0.2)" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-[30%] top-[36%] z-20 h-[1.2%] w-[10%] rotate-[24deg] rounded-full bg-[#e8eef2]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[30%] top-[36%] z-20 h-[1.2%] w-[10%] -rotate-[24deg] rounded-full bg-[#e8eef2]"
      />
    </>
  );
}

function MascotCompanion() {
  const { setHovering, waving, wave } = useMascotWave();

  return (
    <div className="hidden xl:block fixed left-0 bottom-0 z-30 pointer-events-none">
      <button
        type="button"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        onFocus={() => setHovering(true)}
        onBlur={() => setHovering(false)}
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
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-3 rounded-[100%] bg-black/55 blur-sm"
          aria-hidden="true"
        />
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[88%] h-[3px] rounded-full bg-cyan-400/35"
          aria-hidden="true"
        />

        <div
          className="relative h-[min(68vh,500px)] w-[min(30vw,260px)]"
          style={{ transform: "rotateY(-12deg)", transformStyle: "preserve-3d" }}
        >
          <FigurineLayers waving={waving} />
        </div>
      </button>
    </div>
  );
}

export default function Mascot({ variant = "companion" }) {
  if (variant === "companion") return <MascotCompanion />;
  return null;
}
