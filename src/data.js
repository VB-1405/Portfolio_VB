export const NAV_ITEMS = ["Experience", "Projects", "Credentials", "Contact"];

export const CREDIBILITY = [
  { big: "Top 1%", small: "TryHackMe Global" },
  { big: "6+", small: "Active Certifications" },
  { big: "2nd", small: "Place, ToroHack 10.0" },
  { big: "Dec 2026", small: "M.S. Cybersecurity, CSUDH" },
];

// icon is referenced by name string here; the consuming component maps
// these to actual lucide-react components (see ICONS map in Portfolio.jsx)
export const SOCIAL_LINKS = [
  { icon: "Linkedin", label: "linkedin.com/in/cyberrookie", href: "https://www.linkedin.com/in/cyberrookie/" },
  { icon: "Github", label: "github.com/VB-1405", href: "https://github.com/VB-1405/" },
  { icon: "Skull", label: "TryHackMe", href: "https://tryhackme.com/p/vrishabhbhavsar" },
];

export const EXPERIENCE = [
  {
    period: "March 2025 — Present",
    role: "Freelance Cybersecurity Consultant",
    company: "Remote · Self-Employed",
    bullets: [
      "Conduct simulated web application attacks (XSS, SQLi, file/command injection) to validate client security controls.",
      "Perform OS-level attack simulations — privilege escalation, credential-based lateral movement (T1078, T1550.002) — mapped to MITRE ATT&CK for client reporting.",
      "Validate XDR/EDR detection coverage and tune alert logic based on identified gaps.",
    ],
  },
  {
    period: "Dec 2023 — Jun 2024",
    role: "Security Operations Intern",
    company: "TechDefence · Ahmedabad, India",
    bullets: [
      "Monitored and triaged security logs across enterprise SIEM platforms; classified true/false positives and documented findings for escalation.",
      "Investigated ransomware pre-staging and data exfiltration incidents end-to-end, executing account lockouts and host isolation under approved playbooks.",
      "Built custom PowerShell log connectors and tuned detection rules to reduce alert fatigue across client environments.",
    ],
  },
  {
    period: "May 2025 — Present",
    role: "Math Tutor, RISE Program",
    company: "Toro Auxiliary Partners · CSUDH",
    bullets: [
  "1:1 and small-group tutoring — built the ability to break down complex technical concepts for non-technical audiences, directly applicable to communicating security incidents and risk to non-technical stakeholders and leadership.",
],
   },
];

export const PROJECTS = [
  {
    name: "SOC Alert Automation Pipeline",
    private: true,
    desc: "Production-oriented pipeline built in n8n integrating SIEM/SOAR alert ingestion with severity-based routing, SLA tracking, and tiered escalation. Includes real-time HTML alert emails and a live state tracker.",
    tags: ["n8n", "Seceon OTM API", "Automation", "SLA Tracking"],
  },
  {
    name: "CTI-Hub",
    link: "https://github.com/VB-1405/CTI-Hub",
    desc: "Self-hosted, Docker-ready multi-engine threat intelligence platform. Aggregates data from multiple TI engines into one interface for fast IOC lookup and enrichment.",
    tags: ["Python", "Docker", "Threat Intel"],
  },
  {
    name: "DevSecOps CI/CD Pipeline",
    link: "https://github.com/VB-1405/CYB-535-Mid-Term",
    desc: "8-stage automated pipeline using Jenkins, Docker, Kubernetes, SonarQube, and Trivy — covering build/test, static analysis, container scanning, and zero-downtime deployment.",
    tags: ["Jenkins", "Kubernetes", "SonarQube", "Trivy"],
  },
  {
    name: "Healthcare IDS",
    link: "https://github.com/VB-1405/healthcare-ids",
    desc: "ML-powered Intrusion Detection System for medical IoT devices, using anomaly detection and supervised classification to flag malicious traffic.",
    tags: ["Python", "Machine Learning", "IoT Security"],
  },
];

export const CERTS = [
  { name: "CompTIA Security+", meta: "SY0-701 · Active" },
  { name: "AWS Certified Cloud Practitioner", meta: "Active · Exp. 2029" },
  { name: "FortiSOAR Analyst & Responder", meta: "Fortinet NSE · Active" },
  { name: "Microsoft Defender for Identity", meta: "Microsoft Learn · Active" },
  { name: "Seceon OTM Specialist", meta: "Active" },
  { name: "CompTIA CySA+", meta: "In Progress" },
];

export const EDUCATION = {
  degree: "M.S. Cybersecurity — California State University, Dominguez Hills",
  meta: "Expected Dec 2026 · B.E. Computer Science, Parul Institute (2020–2024)",
};

export const STUDY_GUIDES = {
  title: "Free public study guides — AWS CCP & Security+",
  desc: "Self-published exam guides with practice questions, written while studying for each cert",
  href: "https://vb-1405.github.io/cert-guides/",
};

export const WRITEUPS = [
  {
    title: "The Part of Alert Automation Nobody Talks About",
    desc: "What breaks when you build a SOC alert pipeline — state drift, re-run bugs, and designing for failure.",
    link: "https://medium.com/@vrishabhbhavsar/the-part-of-alert-automation-nobody-talks-about-making-it-behave-when-things-go-wrong-788650070669",
  },
  {
    title: "Brute-Forcing WiFi Password",
    desc: "A step-by-step guide to brute-forcing WiFi passwords — tools, methodology, and defensive implications.",
    link: "https://medium.com/@vrishabhbhavsar/brute-forcing-wifi-password-651ef1f10835",
  },
  {
    title: "How to Install Wazuh in Your Linux Environment",
    desc: "Setting up the open-source XDR/SIEM solution — installation, agents, configuration.",
    link: "https://medium.com/@vrishabhbhavsar/how-to-install-wazuh-in-your-linux-environment-e154c63fd3a2",
  },
];

export const PROFILE = {
  name: "Vrishabh Bhavsar",
  title: "SOC Analyst · Threat Hunter · DevSecOps",
  location: "Long Beach, CA · Open to internships & full-time roles",
  email: "vrishabhbhavsar@gmail.com",
};
