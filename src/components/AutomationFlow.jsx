import { useEffect, useState } from "react";

/**
 * AutomationFlow — animated visualization of the alert-automation pipeline.
 * Abstracted system overview: intake, severity routing, and time-aware escalation.
 */
export default function AutomationFlow({ embedded = false }) {
  const [pulseKey, setPulseKey] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setPulseKey((k) => k + 1), 4200);
    return () => clearInterval(id);
  }, []);

  return (
    <div className={`af-wrap${embedded ? " af-wrap--embedded" : ""}`}>
      <style>{`
        .af-wrap {
          position: relative;
          width: 100%;
          max-width: 880px;
          margin: 0 auto;
          background: radial-gradient(1200px 400px at 50% 0%, rgba(34,211,238,0.06), transparent 60%),
                      #0a0e14;
          border: 1px solid rgba(148,163,184,0.12);
          border-radius: 16px;
          padding: 48px 32px 40px;
          overflow: hidden;
          font-family: ui-monospace, "JetBrains Mono", Menlo, monospace;
        }

        .af-wrap--embedded {
          max-width: none;
          margin: 0;
          border: none;
          border-radius: 0;
          padding: 28px 20px 24px;
        }

        .af-eyebrow {
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #22d3ee;
          opacity: 0.75;
          margin-bottom: 6px;
        }

        .af-title {
          font-family: "Inter", ui-sans-serif, system-ui, sans-serif;
          font-size: 20px;
          font-weight: 600;
          color: #e6edf3;
          margin-bottom: 28px;
        }

        .af-wrap--embedded .af-title {
          font-size: 16px;
          margin-bottom: 20px;
        }

        .af-svg { display: block; width: 100%; height: auto; }

        .af-node-box {
          fill: #0f1720;
          stroke: rgba(148,163,184,0.25);
          stroke-width: 1;
        }

        .af-node-label {
          fill: #cbd5e1;
          font-size: 11px;
          font-family: "Inter", ui-sans-serif, system-ui, sans-serif;
        }

        .af-node-sub {
          fill: #64748b;
          font-size: 9px;
          font-family: ui-monospace, "JetBrains Mono", Menlo, monospace;
        }

        .af-path {
          fill: none;
          stroke: rgba(148,163,184,0.18);
          stroke-width: 1.5;
        }

        .af-hub circle {
          fill: #0f1720;
          stroke: #22d3ee;
          stroke-width: 1.4;
        }

        .af-hub-ring {
          fill: none;
          stroke: #22d3ee;
          opacity: 0.35;
          stroke-width: 1;
          animation: af-ring 3.2s ease-out infinite;
        }

        @keyframes af-ring {
          0%   { r: 20; opacity: 0.5; }
          100% { r: 42; opacity: 0; }
        }

        .af-pulse {
          fill: #22d3ee;
          filter: drop-shadow(0 0 4px rgba(34,211,238,0.9));
        }

        .af-pulse-amber { fill: #f59e0b; filter: drop-shadow(0 0 4px rgba(245,158,11,0.9)); }
        .af-pulse-red   { fill: #f43f5e; filter: drop-shadow(0 0 4px rgba(244,63,94,0.9)); }

        .af-tier-dot {
          transition: fill 0.4s ease, filter 0.4s ease;
        }

        .af-legend {
          display: flex;
          gap: 22px;
          margin-top: 28px;
          flex-wrap: wrap;
        }

        .af-wrap--embedded .af-legend {
          gap: 14px;
          margin-top: 20px;
        }

        .af-legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          color: #94a3b8;
          font-family: "Inter", ui-sans-serif, system-ui, sans-serif;
        }

        .af-dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          flex-shrink: 0;
        }

        @media (prefers-reduced-motion: reduce) {
          .af-hub-ring { animation: none; }
        }
      `}</style>

      <div className="af-eyebrow">System overview</div>
      <div className="af-title">Alert intake, severity routing, and time-aware escalation</div>

      <svg className="af-svg" viewBox="0 0 820 300" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path className="af-path" d="M 90 60 H 220" />
        <path className="af-path" d="M 300 60 H 380" />
        <path className="af-path" d="M 460 60 H 560" />
        <path className="af-path" d="M 90 230 H 220" />
        <path className="af-path" d="M 300 230 H 380" />
        <path className="af-path" d="M 460 230 H 560" />
        <path className="af-path" d="M 460 60 Q 500 145 460 230" />

        <circle key={`t-${pulseKey}-a`} r="3.5" className="af-pulse">
          <animateMotion dur="2.6s" begin={`${pulseKey * 4.2}s`} path="M 90 60 H 380" fill="freeze" />
          <animate attributeName="opacity" values="0;1;1;0" dur="2.6s" begin={`${pulseKey * 4.2}s`} />
        </circle>
        <circle key={`t-${pulseKey}-b`} r="3.5" className="af-pulse">
          <animateMotion dur="1.6s" begin={`${pulseKey * 4.2 + 2.6}s`} path="M 380 60 H 560" fill="freeze" />
          <animate attributeName="opacity" values="0;1;1;0" dur="1.6s" begin={`${pulseKey * 4.2 + 2.6}s`} />
        </circle>

        <circle key={`b-${pulseKey}-a`} r="3.5" className="af-pulse-amber">
          <animateMotion dur="2.6s" begin={`${pulseKey * 4.2 + 0.6}s`} path="M 90 230 H 380" fill="freeze" />
          <animate attributeName="opacity" values="0;1;1;0" dur="2.6s" begin={`${pulseKey * 4.2 + 0.6}s`} />
        </circle>
        <circle key={`b-${pulseKey}-b`} r="3.5" className="af-pulse-red">
          <animateMotion dur="1.6s" begin={`${pulseKey * 4.2 + 3.2}s`} path="M 380 230 H 560" fill="freeze" />
          <animate attributeName="opacity" values="0;1;1;0" dur="1.6s" begin={`${pulseKey * 4.2 + 3.2}s`} />
        </circle>

        <rect className="af-node-box" x="20" y="38" width="70" height="44" rx="8" />
        <text className="af-node-label" x="55" y="56" textAnchor="middle">Source</text>
        <text className="af-node-sub" x="55" y="70" textAnchor="middle">alert feed</text>

        <rect className="af-node-box" x="20" y="208" width="70" height="44" rx="8" />
        <text className="af-node-label" x="55" y="226" textAnchor="middle">Source</text>
        <text className="af-node-sub" x="55" y="240" textAnchor="middle">alert feed</text>

        <rect className="af-node-box" x="220" y="38" width="80" height="44" rx="8" />
        <text className="af-node-label" x="260" y="56" textAnchor="middle">Parse</text>
        <text className="af-node-sub" x="260" y="70" textAnchor="middle">extract fields</text>

        <rect className="af-node-box" x="220" y="208" width="80" height="44" rx="8" />
        <text className="af-node-label" x="260" y="226" textAnchor="middle">Watch</text>
        <text className="af-node-sub" x="260" y="240" textAnchor="middle">elapsed time</text>

        <rect className="af-node-box" x="380" y="38" width="80" height="44" rx="8" />
        <text className="af-node-label" x="420" y="56" textAnchor="middle">Route</text>
        <text className="af-node-sub" x="420" y="70" textAnchor="middle">by severity</text>

        <rect className="af-node-box" x="380" y="208" width="80" height="44" rx="8" />
        <text className="af-node-label" x="420" y="222" textAnchor="middle">Escalate</text>
        <circle className="af-tier-dot" cx="405" cy="238" r="4" fill="#f59e0b" opacity="0.9" />
        <circle className="af-tier-dot" cx="420" cy="238" r="4" fill="#f97316" opacity="0.9" />
        <circle className="af-tier-dot" cx="435" cy="238" r="4" fill="#f43f5e" opacity="0.9" />

        <g className="af-hub" transform="translate(510, 145)">
          <circle className="af-hub-ring" r="20" />
          <circle r="20" />
          <text className="af-node-label" x="0" y="-2" textAnchor="middle" fontSize="10">shared</text>
          <text className="af-node-label" x="0" y="10" textAnchor="middle" fontSize="10">state</text>
        </g>

        <rect className="af-node-box" x="560" y="38" width="90" height="44" rx="8" />
        <text className="af-node-label" x="605" y="56" textAnchor="middle">Notify</text>
        <text className="af-node-sub" x="605" y="70" textAnchor="middle">team, by tier</text>

        <rect className="af-node-box" x="560" y="208" width="90" height="44" rx="8" />
        <text className="af-node-label" x="605" y="226" textAnchor="middle">Notify</text>
        <text className="af-node-sub" x="605" y="240" textAnchor="middle">on breach</text>

        <text x="55" y="20" fill="#475569" fontSize="10" fontFamily="Inter, ui-sans-serif, system-ui">INGESTION</text>
        <text x="55" y="190" fill="#475569" fontSize="10" fontFamily="Inter, ui-sans-serif, system-ui">ESCALATION</text>
      </svg>

      <div className="af-legend">
        <div className="af-legend-item">
          <span className="af-dot" style={{ background: "#22d3ee" }} />
          new alert processed
        </div>
        <div className="af-legend-item">
          <span className="af-dot" style={{ background: "#f59e0b" }} />
          reminder tier
        </div>
        <div className="af-legend-item">
          <span className="af-dot" style={{ background: "#f97316" }} />
          escalation tier
        </div>
        <div className="af-legend-item">
          <span className="af-dot" style={{ background: "#f43f5e" }} />
          critical escalation
        </div>
      </div>
    </div>
  );
}
