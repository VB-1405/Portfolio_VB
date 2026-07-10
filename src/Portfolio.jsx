import { lazy, Suspense, useEffect, useState } from "react";
import {
  Award, Github, Linkedin, Mail, Skull, Download, MapPin,
  Lock, GraduationCap, ExternalLink, MessageCircle, ArrowUpRight,
  Server, Shield, Menu, X,
} from "lucide-react";

import Reveal from "./components/Reveal";
import Mascot from "./components/Mascot";
const HackerCanvas = lazy(() => import("./components/HackerCanvas"));
import Section from "./components/Section";
import TypingText from "./components/TypingText";

import {
  NAV_ITEMS, CREDIBILITY, SOCIAL_LINKS, ABOUT, EXPERIENCE, PROJECTS,
  CTF_WINS, PLATFORMS, HOMELAB, CERTS, EDUCATION, STUDY_GUIDES, WRITEUPS,
  PROFILE, CREDLY_URL,
} from "./data";

// Public-folder assets must respect Vite base path (GitHub Pages: /Portfolio_VB/).
const asset = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;

const ICONS = { Linkedin, Github, Skull, Award };
const EXTERNAL_REL = "noopener noreferrer";
const SECTION_IDS = ["about", "experience", "projects", "ctf", "homelab", "credentials", "writing", "contact"];

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return isDesktop;
}

export default function Portfolio() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("about");
  const isDesktop = useIsDesktop();

  useEffect(() => {
    const sections = SECTION_IDS
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    const onScroll = () => {
      let current = SECTION_IDS[0];
      for (const section of sections) {
        if (window.scrollY >= section.offsetTop - 96) current = section.id;
      }
      setActiveSection(current);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinkClass = (id) =>
    `hover:text-cyan-400 transition-colors ${activeSection === id ? "text-cyan-400" : ""}`;

  const closeMobileNav = () => setMobileNavOpen(false);

  return (
    <div className="min-h-screen bg-zinc-950 text-slate-300 relative">
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[500px] h-[500px] rounded-full bg-cyan-500/[0.07] blur-3xl -top-[10%] -left-[5%] animate-drift-a" />
        <div className="absolute w-[440px] h-[440px] rounded-full bg-emerald-400/[0.05] blur-3xl top-[35%] -right-[8%] animate-drift-b" />
        <div className="absolute w-[420px] h-[420px] rounded-full bg-cyan-400/[0.05] blur-3xl -bottom-[10%] left-[20%] animate-drift-a-reverse" />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,0.6) 0px, transparent 1px, transparent 3px)",
          }}
        />
      </div>

      <div className="relative z-10">
        <nav className="sticky top-0 z-50 backdrop-blur bg-zinc-950/80 border-b border-white/5">
          <div className="max-w-4xl mx-auto px-6 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mascot size={44} />
              <span className="text-sm font-bold text-white">
                VB<span className="text-slate-600 mx-1">/</span>
                <span className="text-slate-400 font-normal">SOC Analyst / Security Engineer</span>
              </span>
            </div>
            <div className="hidden md:flex gap-4 lg:gap-5 text-[11px] font-mono uppercase tracking-wide text-slate-500">
              {NAV_ITEMS.map(({ label, id }) => (
                <a key={id} href={`#${id}`} className={navLinkClass(id)}>
                  {label}
                </a>
              ))}
            </div>
            <button
              type="button"
              className="md:hidden text-slate-300 hover:text-cyan-400 transition-colors p-1"
              aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileNavOpen}
              onClick={() => setMobileNavOpen((open) => !open)}
            >
              {mobileNavOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
          {mobileNavOpen && (
            <div className="md:hidden border-t border-white/5 bg-zinc-950/95 px-6 py-4 flex flex-col gap-3 text-[11px] font-mono uppercase tracking-wide text-slate-500">
              {NAV_ITEMS.map(({ label, id }) => (
                <a
                  key={id}
                  href={`#${id}`}
                  className={navLinkClass(id)}
                  onClick={closeMobileNav}
                >
                  {label}
                </a>
              ))}
            </div>
          )}
        </nav>

        <div className="lg:flex lg:items-start">
          {isDesktop && (
            <div
              className="hidden lg:block sticky top-14 z-10 w-[40%] max-w-[480px] h-[calc(100vh-3.5rem)] shrink-0 overflow-hidden self-start"
              aria-hidden="true"
            >
              <Suspense fallback={null}>
                <HackerCanvas />
              </Suspense>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="relative overflow-hidden">
              <div
                className="absolute -top-24 left-1/2 -translate-x-1/2 w-[560px] h-[560px] rounded-full bg-cyan-400/[0.07] blur-3xl animate-pulse pointer-events-none"
                style={{ animationDuration: "4s" }}
              />

              <header className="relative max-w-4xl mx-auto px-6 pt-14 pb-10 flex flex-col sm:flex-row gap-6 sm:items-center justify-between lg:max-w-3xl">
            <div className="flex items-center gap-5 lg:items-start lg:gap-7">
              <div className="relative shrink-0">
                <div
                  className="absolute -inset-2 rounded-2xl bg-cyan-400/15 blur-lg pointer-events-none hidden lg:block"
                  aria-hidden="true"
                />
                <img
                  src={asset("profile.jpg")}
                  alt={`${PROFILE.name} — professional headshot`}
                  className="w-20 h-20 rounded-xl object-cover border border-white/10 lg:w-44 lg:h-44 lg:rounded-2xl lg:object-top lg:border-2 lg:border-cyan-400/30 lg:shadow-[0_0_32px_rgba(34,211,238,0.18)]"
                />
              </div>
              <div>
                <p className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-cyan-400/90 border border-cyan-400/20 bg-cyan-400/[0.06] rounded-full px-2.5 py-1 mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" aria-hidden="true" />
                  {PROFILE.availability}
                </p>
                <h1 className="text-2xl font-bold text-white leading-tight">{PROFILE.name}</h1>
                <p className="text-cyan-400 text-sm font-medium font-mono">
                  <TypingText text={PROFILE.title} />
                </p>
                <p className="text-slate-500 text-xs font-mono mt-0.5">{PROFILE.subtitle}</p>
                <p className="text-slate-500 text-xs mt-1 flex items-center gap-1">
                  <MapPin size={11} aria-hidden="true" /> {PROFILE.location}
                </p>
                <p className="text-slate-500 text-xs mt-1 leading-relaxed max-w-sm">
                  {PROFILE.workAuthorization}
                </p>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <a
                href={`mailto:${PROFILE.email}`}
                className="inline-flex items-center gap-2 bg-cyan-400 text-black font-semibold text-sm px-4 py-2 rounded-md hover:bg-cyan-300 hover:-translate-y-0.5 hover:shadow-[0_0_18px_rgba(34,211,238,0.45)] transition-all"
              >
                <Mail size={14} aria-hidden="true" /> Contact
              </a>
              <a
                href={asset("Resume.pdf")}
                download
                className="inline-flex items-center gap-2 border border-white/15 text-slate-200 text-sm px-4 py-2 rounded-md hover:border-cyan-400/40 hover:-translate-y-0.5 hover:shadow-[0_0_18px_rgba(34,211,238,0.25)] transition-all"
              >
                <Download size={14} aria-hidden="true" /> Resume
              </a>
            </div>
              </header>
            </div>

            <div className="max-w-4xl mx-auto px-6 pb-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {CREDIBILITY.map(({ big, small }) => (
              <div key={small} className="border border-white/10 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-cyan-400 font-mono">{big}</div>
                <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">{small}</div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 mt-4">
            {SOCIAL_LINKS.map(({ icon, label, href }) => {
              const Icon = ICONS[icon];
              return (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel={EXTERNAL_REL}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-cyan-400 transition-colors"
                >
                  <Icon size={13} aria-hidden="true" /> {label}
                </a>
              );
            })}
          </div>
        </div>

        <Section id="about" label="Summary" title="About">
          <div className="space-y-4">
            {ABOUT.map((paragraph) => (
              <p key={paragraph.slice(0, 32)} className="text-sm text-slate-400 leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        </Section>

        <Section id="experience" label="Work History" title="Experience">
          <div className="space-y-7">
            {EXPERIENCE.map((job, idx) => (
              <Reveal key={job.role} delay={idx * 80}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <span className="font-semibold text-white text-sm">{job.role}</span>
                  <span className="text-xs font-mono text-slate-500">{job.period}</span>
                </div>
                <div className="text-xs text-slate-500 mb-2">{job.company}</div>
                <ul className="space-y-1.5">
                  {job.bullets.map((b, i) => (
                    <li
                      key={i}
                      className="text-[13px] text-slate-400 leading-relaxed pl-3.5 relative before:content-['—'] before:absolute before:left-0 before:text-slate-600"
                    >
                      {b}
                    </li>
                  ))}
                </ul>
              </Reveal>
            ))}
          </div>
        </Section>

        <Section id="projects" label="Portfolio" title="Projects">
          <div className="grid sm:grid-cols-2 gap-4">
            {PROJECTS.map((p, idx) => (
              <Reveal
                key={p.name}
                delay={idx * 70}
                className="border border-white/10 rounded-lg p-4 flex flex-col hover:border-cyan-400/25 hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(34,211,238,0.12)] transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="font-semibold text-white text-sm">{p.name}</span>
                  {p.private ? (
                    <Lock
                      size={13}
                      role="img"
                      aria-label="Private project"
                      className="text-amber-400 shrink-0 mt-0.5"
                    />
                  ) : (
                    <a
                      href={p.link}
                      target="_blank"
                      rel={EXTERNAL_REL}
                      aria-label={`View ${p.name} source on GitHub`}
                      className="text-slate-500 hover:text-cyan-400 shrink-0"
                    >
                      <ArrowUpRight size={14} aria-hidden="true" />
                    </a>
                  )}
                </div>
                <p className="text-[13px] text-slate-400 leading-relaxed mb-3 flex-1">{p.desc}</p>
                {p.private && (
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2">
                    <a
                      href={`mailto:${PROFILE.email}`}
                      className="inline-flex items-center gap-1.5 text-[11px] text-amber-400"
                    >
                      <MessageCircle size={11} aria-hidden="true" /> Private — email for a walkthrough
                    </a>
                    {p.writeup && (
                      <a
                        href={p.writeup}
                        target="_blank"
                        rel={EXTERNAL_REL}
                        className="inline-flex items-center gap-1.5 text-[11px] text-cyan-400 hover:text-cyan-300"
                      >
                        <ExternalLink size={11} aria-hidden="true" /> Read the write-up
                      </a>
                    )}
                  </div>
                )}
                <div className="flex flex-wrap gap-1.5">
                  {p.tags.map((t) => (
                    <span
                      key={t}
                      className="text-[10px] font-mono text-slate-500 border border-white/10 rounded px-1.5 py-0.5"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </Reveal>
            ))}
          </div>
        </Section>

        <Section id="ctf" label="Competitions" title="CTF & Platform Ranks">
          <div className="space-y-3 mb-4">
            {CTF_WINS.map((win, idx) => (
              <Reveal key={win.name} delay={idx * 60}>
                <div className="flex items-start gap-3 border border-white/10 rounded-md px-4 py-3 hover:border-cyan-400/25 transition-all">
                  <span className="text-xl leading-none mt-0.5" aria-hidden="true">{win.medal}</span>
                  <div>
                    <div className="text-[13px] text-white font-medium">{win.name}</div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">{win.org}</div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {PLATFORMS.map((platform, idx) => (
              <Reveal key={platform.name} delay={idx * 60}>
                <a
                  href={platform.href}
                  target="_blank"
                  rel={EXTERNAL_REL}
                  className="block border border-white/10 rounded-md px-4 py-3 hover:border-cyan-400/30 hover:-translate-y-0.5 hover:shadow-[0_0_16px_rgba(34,211,238,0.12)] transition-all"
                >
                  <div className="text-lg font-bold text-cyan-400 font-mono">{platform.rank}</div>
                  <div className="text-[13px] text-white font-medium mt-1">{platform.name}</div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">{platform.desc}</div>
                </a>
              </Reveal>
            ))}
          </div>
        </Section>

        <Section id="homelab" label="Hands-On" title="SOC Home Lab">
          <p className="text-sm text-slate-400 leading-relaxed mb-5">{HOMELAB.intro}</p>
          <div className="grid sm:grid-cols-2 gap-2.5 mb-5">
            {HOMELAB.stack.map((item, idx) => (
              <Reveal key={item.name} delay={idx * 40}>
                <div className="flex items-center gap-2.5 border border-white/10 rounded-md px-3.5 py-2.5">
                  <Server size={14} aria-hidden="true" className="text-cyan-400 shrink-0" />
                  <div>
                    <div className="text-[13px] text-white font-medium leading-tight">{item.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{item.desc}</div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
          <div className="space-y-2.5">
            {HOMELAB.scenarios.map((scenario, idx) => (
              <Reveal key={scenario.title} delay={idx * 50}>
                <div className="flex items-start gap-2.5 border border-white/10 rounded-md px-3.5 py-3">
                  <Shield size={14} aria-hidden="true" className="text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[13px] text-white font-medium">{scenario.title}</div>
                    <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">{scenario.desc}</div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </Section>

        <Section id="credentials" label="Verified" title="Certifications & Education">
          <a
            href={CREDLY_URL}
            target="_blank"
            rel={EXTERNAL_REL}
            className="flex items-center justify-between gap-3 border border-white/10 rounded-md px-3.5 py-2.5 mb-4 hover:border-cyan-400/30 transition-all"
          >
            <div className="flex items-center gap-2.5">
              <Award size={14} aria-hidden="true" className="text-cyan-400 shrink-0" />
              <div>
                <div className="text-[13px] text-white font-medium">View verified badges on Credly</div>
                <div className="text-[10px] text-slate-500 font-mono">credly.com/users/vrishabh-bhavsar</div>
              </div>
            </div>
            <ExternalLink size={13} aria-hidden="true" className="text-cyan-400 shrink-0" />
          </a>

          <div className="grid sm:grid-cols-2 gap-2.5 mb-6">
            {CERTS.map((c, idx) => {
              const inner = (
                <>
                  <Award size={14} aria-hidden="true" className="text-cyan-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] text-white font-medium leading-tight">{c.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{c.meta}</div>
                  </div>
                  {c.verifyUrl && (
                    <ExternalLink size={12} aria-hidden="true" className="text-slate-600 shrink-0" />
                  )}
                </>
              );

              return (
                <Reveal key={c.name} delay={idx * 50}>
                  {c.verifyUrl ? (
                    <a
                      href={c.verifyUrl}
                      target="_blank"
                      rel={EXTERNAL_REL}
                      aria-label={`Verify ${c.name} on Credly`}
                      className="flex items-center gap-2.5 border border-white/10 rounded-md px-3.5 py-2.5 hover:border-cyan-400/25 hover:-translate-y-0.5 transition-all"
                    >
                      {inner}
                    </a>
                  ) : (
                    <div className="flex items-center gap-2.5 border border-white/10 rounded-md px-3.5 py-2.5">
                      {inner}
                    </div>
                  )}
                </Reveal>
              );
            })}
          </div>

          <div className="flex items-start gap-2.5 border border-white/10 rounded-md px-3.5 py-3 mb-3">
            <GraduationCap size={15} aria-hidden="true" className="text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-[13px] text-white font-medium">{EDUCATION.degree}</div>
              <div className="text-[11px] text-slate-400 font-mono">{EDUCATION.meta}</div>
            </div>
          </div>

          <a
            href={STUDY_GUIDES.href}
            target="_blank"
            rel={EXTERNAL_REL}
            className="flex items-center justify-between gap-3 border border-cyan-400/20 bg-cyan-400/[0.03] rounded-md px-3.5 py-3 hover:border-cyan-400/40 hover:shadow-[0_0_16px_rgba(34,211,238,0.15)] transition-all"
          >
            <div>
              <div className="text-[13px] text-white font-medium">{STUDY_GUIDES.title}</div>
              <div className="text-[11px] text-slate-500">{STUDY_GUIDES.desc}</div>
            </div>
            <ExternalLink size={13} aria-hidden="true" className="text-cyan-400 shrink-0" />
          </a>
        </Section>

        <Section id="writing" label="Writing" title="Write-ups">
          <div className="space-y-3">
            {WRITEUPS.map((w, idx) => (
              <Reveal key={w.title} delay={idx * 60}>
                <a
                  href={w.link}
                  target="_blank"
                  rel={EXTERNAL_REL}
                  className="flex items-start justify-between gap-4 border border-white/10 rounded-md px-4 py-3 hover:border-cyan-400/30 hover:-translate-y-0.5 hover:shadow-[0_0_16px_rgba(34,211,238,0.12)] transition-all"
                >
                  <div>
                    <div className="text-[13px] text-white font-medium">{w.title}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{w.desc}</div>
                  </div>
                  <ExternalLink size={13} aria-hidden="true" className="text-slate-600 shrink-0 mt-1" />
                </a>
              </Reveal>
            ))}
          </div>
        </Section>

        <Section id="contact" label="Reach Out" title="Contact">
          <p className="text-sm text-slate-500 mb-4 leading-relaxed">
            {PROFILE.workAuthorization} · Based in {PROFILE.location.split(" · ")[0]}
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href={`mailto:${PROFILE.email}`}
              className="inline-flex items-center gap-2 bg-cyan-400 text-black font-semibold text-sm px-4 py-2.5 rounded-md hover:bg-cyan-300 hover:shadow-[0_0_18px_rgba(34,211,238,0.45)] transition-all"
            >
              <Mail size={14} aria-hidden="true" /> {PROFILE.email}
            </a>
            <a
              href="https://www.linkedin.com/in/cyberrookie/"
              target="_blank"
              rel={EXTERNAL_REL}
              className="inline-flex items-center gap-2 border border-white/15 text-slate-200 text-sm px-4 py-2.5 rounded-md hover:border-cyan-400/40 transition-all"
            >
              <Linkedin size={14} aria-hidden="true" /> LinkedIn
            </a>
            <a
              href={CREDLY_URL}
              target="_blank"
              rel={EXTERNAL_REL}
              className="inline-flex items-center gap-2 border border-white/15 text-slate-200 text-sm px-4 py-2.5 rounded-md hover:border-cyan-400/40 transition-all"
            >
              <Award size={14} aria-hidden="true" /> Credly
            </a>
            <a
              href={asset("Resume.pdf")}
              download
              className="inline-flex items-center gap-2 border border-white/15 text-slate-200 text-sm px-4 py-2.5 rounded-md hover:border-cyan-400/40 transition-all"
            >
              <Download size={14} aria-hidden="true" /> Download Resume
            </a>
          </div>
        </Section>

            <footer className="max-w-4xl mx-auto px-6 py-8 text-center text-xs text-slate-600 font-mono border-t border-white/5">
              {PROFILE.name} · Long Beach, CA · github.com/VB-1405
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}
