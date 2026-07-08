import { useEffect, useRef, useState } from "react";

const CYAN = "34, 211, 238";

/**
 * CyberBackground — layered ambient motion: node mesh, grid, drifting glows.
 * Lightweight alternative to a full Three.js scene; stays on-brand for SOC.
 */
export default function CyberBackground() {
  const canvasRef = useRef(null);
  const mouse = useRef({ x: 0.5, y: 0.5 });
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    setReduceMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);

    const onMove = (e) => {
      mouse.current = {
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      };
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setParallax({
          x: (e.clientX / window.innerWidth - 0.5) * 24,
          y: (e.clientY / window.innerHeight - 0.5) * 24,
        });
      }
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext("2d");
    let frameId;
    let particles = [];

    const particleCount = () => {
      const area = window.innerWidth * window.innerHeight;
      const mobile = window.innerWidth < 768;
      if (mobile) return Math.min(28, Math.floor(area / 32000));
      return Math.min(52, Math.floor(area / 22000));
    };

    const staticMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const init = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      particles = Array.from({ length: particleCount() }, () => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.4 + 0.6,
        pulse: Math.random() * Math.PI * 2,
      }));
    };

    const draw = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);

      const mx = mouse.current.x * w;
      const my = mouse.current.y * h;
      const linkDist = w < 768 ? 100 : 130;

      // soft mouse spotlight
      const spot = ctx.createRadialGradient(mx, my, 0, mx, my, Math.max(w, h) * 0.45);
      spot.addColorStop(0, `rgba(${CYAN}, 0.045)`);
      spot.addColorStop(1, "transparent");
      ctx.fillStyle = spot;
      ctx.fillRect(0, 0, w, h);

      // node mesh
      for (let i = 0; i < particles.length; i += 1) {
        for (let j = i + 1; j < particles.length; j += 1) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist < linkDist) {
            const alpha = 0.14 * (1 - dist / linkDist);
            ctx.strokeStyle = `rgba(${CYAN}, ${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      particles.forEach((p) => {
        p.pulse += 0.02;
        const glow = 0.25 + Math.sin(p.pulse) * 0.12;
        ctx.fillStyle = `rgba(${CYAN}, ${glow})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();

        if (!staticMotion) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0 || p.x > w) p.vx *= -1;
          if (p.y < 0 || p.y > h) p.vy *= -1;
        }
      });

      frameId = requestAnimationFrame(draw);
    };

    init();
    draw();
    window.addEventListener("resize", init);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", init);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <canvas ref={canvasRef} className="absolute inset-0 opacity-70" />

      {/* perspective floor grid */}
      <div
        className="absolute inset-x-0 bottom-0 h-[55vh] opacity-[0.14]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(${CYAN}, 0.35) 1px, transparent 1px),
            linear-gradient(90deg, rgba(${CYAN}, 0.35) 1px, transparent 1px)
          `,
          backgroundSize: "56px 56px",
          maskImage: "linear-gradient(to top, black 10%, transparent 88%)",
          transform: "perspective(520px) rotateX(58deg) scale(1.35)",
          transformOrigin: "center bottom",
        }}
      />

      {/* fine dot grid */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `radial-gradient(rgba(${CYAN}, 0.9) 0.6px, transparent 0.6px)`,
          backgroundSize: "28px 28px",
        }}
      />

      {/* drifting glow orbs — mouse parallax */}
      <div
        className="absolute w-[520px] h-[520px] rounded-full bg-cyan-500/[0.07] blur-3xl -top-[12%] -left-[6%] animate-drift-a transition-transform duration-700 ease-out"
        style={{ transform: `translate(${parallax.x * 0.6}px, ${parallax.y * 0.6}px)` }}
      />
      <div
        className="absolute w-[460px] h-[460px] rounded-full bg-emerald-400/[0.05] blur-3xl top-[38%] -right-[10%] animate-drift-b transition-transform duration-700 ease-out"
        style={{ transform: `translate(${parallax.x * -0.4}px, ${parallax.y * -0.4}px)` }}
      />
      <div
        className="absolute w-[400px] h-[400px] rounded-full bg-cyan-400/[0.05] blur-3xl -bottom-[12%] left-[18%] animate-drift-a-reverse transition-transform duration-700 ease-out"
        style={{ transform: `translate(${parallax.x * 0.3}px, ${parallax.y * 0.5}px)` }}
      />

      {/* scanlines */}
      <div
        className="absolute inset-0 opacity-[0.022]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.55) 0px, transparent 1px, transparent 3px)",
        }}
      />

      {/* vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(3,7,18,0.55) 100%)",
        }}
      />

      {/* ambient data rain — very subtle */}
      {!reduceMotion && (
        <div className="absolute inset-0 overflow-hidden opacity-[0.04] font-mono text-[10px] text-cyan-300 leading-none select-none">
          {Array.from({ length: 14 }, (_, col) => (
            <span
              key={col}
              className="absolute top-0 whitespace-pre animate-data-fall"
              style={{
                left: `${6 + col * 7}%`,
                animationDuration: `${14 + (col % 5) * 3}s`,
                animationDelay: `${col * 0.7}s`,
              }}
            >
              {"A3F9\n0C2E\nB71D\n9X4K\nF0A1\n".repeat(8)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
