import { useReveal } from "./Reveal";
import { CONTENT_SHELL } from "../layout";

/**
 * Section — standard page section shell: scroll-reveals as a whole,
 * renders a title + small mono label (e.g. "WORK HISTORY"), and an
 * anchor id for the nav's jump-links.
 */
export default function Section({ id, label, title, children }) {
  const [ref, visible] = useReveal();
  return (
    <section
      id={id}
      ref={ref}
       className={`${CONTENT_SHELL} scroll-mt-20 py-14 border-t border-white/5 first:border-t-0 transition-all duration-500 ease-out ${ 
       visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
      }`}
    >
      <div className="flex items-baseline justify-between mb-6">
        <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
        <span className="text-[11px] font-mono uppercase tracking-widest text-slate-600">{label}</span>
      </div>
      {children}
    </section>
  );
}
