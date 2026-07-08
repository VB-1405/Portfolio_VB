/**
 * Mascot — wolf badge logo with a pulsing glow ring and a slow rotating
 * accent border. Purely decorative/branding, so it's exposed to assistive
 * tech as a single labeled image rather than as a raw emoji glyph.
 */
export default function Mascot({ size = 64 }) {
  return (
    <div
      role="img"
      aria-label="Wolf mascot logo — Vrishabh Bhavsar, cybersecurity portfolio"
      className="relative shrink-0 flex items-center justify-center rounded-full bg-zinc-900 border border-cyan-400/40"
      style={{ width: size, height: size }}
    >
      <div className="absolute inset-0 rounded-full bg-cyan-400/15 animate-pulse" />
      <div
        className="absolute -inset-1 rounded-full border border-cyan-400/25 animate-spin-slow"
        style={{ borderTopColor: "rgba(34,211,238,0.7)" }}
      />
      <span aria-hidden="true" className="relative select-none" style={{ fontSize: size * 0.5, lineHeight: 1 }}>
        🐺
      </span>
    </div>
  );
}
