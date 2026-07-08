import {
  Award, Github, Linkedin, Mail, Skull, Download, MapPin,
  Lock, GraduationCap, ExternalLink, MessageCircle, ArrowUpRight,
  Server, Shield,
} from "lucide-react";

import Reveal from "./components/Reveal";
import Mascot from "./components/Mascot";
import Section from "./components/Section";
import TypingText from "./components/TypingText";

import {
  NAV_ITEMS, CREDIBILITY, SOCIAL_LINKS, ABOUT, EXPERIENCE, PROJECTS,
  CTF_WINS, PLATFORMS, HOMELAB, CERTS, EDUCATION, STUDY_GUIDES, WRITEUPS, PROFILE,
} from "./data";

// Maps the icon *name* strings stored in data.js to actual components,
// keeping data.js framework-agnostic (no JSX/component imports in data files).
const ICONS = { Linkedin, Github, Skull };

// Every external link should be safe (no window.opener access) and
// non-referrer-leaking. Centralized so it's applied consistently.
const EXTERNAL_REL = "noopener noreferrer";

export default function Portfolio() {
  return (
    <div className="min-h-screen bg-zinc-950 text-slate-300 relative">
      {/* GLOBAL DYNAMIC BACKGROUND — drift keyframes now live in tailwind.config.js */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[500px] h-[500px] rounded-full bg-cyan-500/[0.07] blur-3xl -top-[10%] -left-[5%] animate-drift-a" />
        <div className="absolute w-[440px] h-[440px] rounded-full bg-emerald-400/[0.05] blur-3xl top-[35%] -right-[8%] animate-drift-b" />
        <div className="absolute w-[420px] h-[420px] rounded-full bg-cyan-400/[0.05] blur-3xl -bottom-[10%] left-[20%] animate-drift-a-reverse" />
        {/* Faint CRT-style scanlines — subtle by design; remove this div if it reads as noise on your monitor */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,0.6) 0px, transparent 1px, transparent 3px)",
          }}
        />
      </div>

      <div className="relative z-10">
        {/* TOP NAV WITH MASCOT */}
        <nav className="sticky top-0 z-50 backdrop-blur bg-zinc-950/80 border-b border-white/5">
          <div className="max-w-4xl mx-auto px-6 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mascot size={44} />
              <span className="text-sm font-bold text-white">
                VB<span className="text-slate-600 mx-1">/</span>
                <span className="text-slate-400 font-normal">SOC Analyst / Security Engineer</span>
              </span>
            </div>
            <div className="hidden sm:flex gap-5 text-[11px] font-mono uppercase tracking-wide text-slate-500">
              {NAV_ITEMS.map((n) => (
                <a key={n} href={`#${n.toLowerCase()}`} className="hover:text-cyan-400 transition-colors">
                  {n}
                </a>
              ))}
            </div>
          </div>
        </nav>

        {/* HEADER / HERO */}
        <div className="relative overflow-hidden">
          <div
            className="absolute -top-24 left-1/2 -translate-x-1/2 w-[560px] h-[560px] rounded-full bg-cyan-400/[0.07] blur-3xl animate-pulse pointer-events-none"
            style={{ animationDuration: "4s" }}
          />
          <header className="relative max-w-4xl mx-auto px-6 pt-14 pb-10 flex flex-col sm:flex-row gap-6 sm:items-center justify-between">
            <div className="flex items-center gap-5">
              <img
                src="/profile.jpg"
                alt={`${PROFILE.name} — professional headshot`}
                className="w-20 h-20 rounded-xl object-cover border border-white/10"
              />
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
                href="/Resume.pdf"
                download
                className="inline-flex items-center gap-2 border border-white/15 text-slate-200 text-sm px-4 py-2 rounded-md hover:border-cyan-400/40 hover:-translate-y-0.5 hover:shadow-[0_0_18px_rgba(34,211,238,0.25)] transition-all"
              >
                <Download size={14} aria-hidden="true" /> Resume
              </a>
            </div>
          </header>
        </div>

        {/* CREDIBILITY STRIP */}
        <div className="max-w-4xl mx-auto px-6 pb-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {CREDIBILITY.map(({ big, small }) => (
              <div key={small} className="border border-white/10 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-cyan-400 font-mono">{big}</div>
                <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">{small}</div>
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-4">
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

        {/* SUMMARY */}
        <Section id="about" label="Summary" title="About">
          <div className="space-y-4">
            {ABOUT.map((paragraph) => (
              <p key={paragraph.slice(0, 32)} className="text-sm text-slate-400 leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        </Section>

        {/* EXPERIENCE */}
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

        {/* PROJECTS */}
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

        {/* CTF & PLATFORMS */}
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

        {/* HOME LAB */}
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

        {/* CERTS + EDUCATION */}
        <Section id="credentials" label="Verified" title="Certifications & Education">
          <div className="grid sm:grid-cols-2 gap-2.5 mb-6">
            {CERTS.map((c, idx) => (
              <Reveal
                key={c.name}
                delay={idx * 50}
                className="flex items-center gap-2.5 border border-white/10 rounded-md px-3.5 py-2.5 hover:border-cyan-400/25 hover:-translate-y-0.5 transition-all"
              >
                <Award size={14} aria-hidden="true" className="text-cyan-400 shrink-0" />
                <div>
                  <div className="text-[13px] text-white font-medium leading-tight">{c.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{c.meta}</div>
                </div>
              </Reveal>
            ))}
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

        {/* WRITEUPS */}
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

        {/* CONTACT */}
        <Section id="contact" label="Reach Out" title="Contact">
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
              href="/Resume.pdf"
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
  );
}
