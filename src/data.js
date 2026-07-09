export const SITE_URL = "https://vb-1405.github.io/Portfolio_VB/";
export const CREDLY_URL = "https://www.credly.com/users/vrishabh-bhavsar/badges";

export const MEMOJI_FIGURINE_IDLE_URL = `${import.meta.env.BASE_URL}memoji-figurine-idle.png?v=3`;
export const MEMOJI_FIGURINE_WAVE_URL = `${import.meta.env.BASE_URL}memoji-figurine-wave.png?v=3`;

export const NAV_ITEMS = [
  { label: "About", id: "about" },
  { label: "Experience", id: "experience" },
  { label: "Projects", id: "projects" },
  { label: "Lab", id: "homelab" },
  { label: "Credentials", id: "credentials" },
  { label: "Contact", id: "contact" },
];

export const CREDIBILITY = [
  { big: "7 mo", small: "Enterprise SOC Experience" },
  { big: "Top 1%", small: "TryHackMe Global" },
  { big: "CySA+", small: "In Progress" },
  { big: "2nd", small: "Place, ToroHack 10.0" },
];

// icon is referenced by name string here; the consuming component maps
// these to actual lucide-react components (see ICONS map in Portfolio.jsx)
export const SOCIAL_LINKS = [
  { icon: "Linkedin", label: "linkedin.com/in/cyberrookie", href: "https://www.linkedin.com/in/cyberrookie/" },
  { icon: "Github", label: "github.com/VB-1405", href: "https://github.com/VB-1405/" },
  { icon: "Skull", label: "TryHackMe", href: "https://tryhackme.com/p/vrishabhbhavsar" },
  { icon: "Award", label: "Credly badges", href: CREDLY_URL },
];

export const ABOUT = [
  "I'm a Cybersecurity Master's student at CSUDH (expected Dec 2026) with hands-on SOC experience at TechDefence, where I triaged enterprise alerts, built PowerShell log connectors, and responded to ransomware and exfiltration incidents. I'm targeting SOC Analyst and Security Engineer roles where I can grow from alert triage into detection engineering and automation.",
  "I don't just study security — I build it, break it, and defend it. CTF competitor, DevSecOps practitioner, and builder of security automation tools, backed by a top 1% TryHackMe ranking globally.",
  "When I'm not at a terminal: I read Jeffrey Archer and Colleen Hoover, play badminton and soccer, and hit the gym. Back home in India I used to take my German Shepherd Rambo on long drives in my Willy's jeep — still miss those.",
];

export const EXPERIENCE = [
  {
    period: "Dec 2023 — Jun 2024",
    role: "Security Operations Intern",
    company: "TechDefence · Ahmedabad, India",
    bullets: [
      "Monitored and triaged security logs across enterprise SIEM platforms (FortiSOAR, Seceon OTM, Elastic) daily; classified true vs. false positives and documented findings for escalation.",
      "Investigated ransomware pre-staging and data exfiltration incidents end-to-end — executing account lockouts and host isolation under approved playbooks.",
      "Engineered custom PowerShell log connectors and tuned detection rules to reduce alert fatigue across client environments.",
      "Managed end-to-end nxlog pipelines for log forwarding, parsing, and normalization across 24/7 security monitoring operations.",
    ],
  },
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
    period: "May 2025 — Present",
    role: "Math Tutor, RISE Program",
    company: "Toro Auxiliary Partners · CSUDH",
    bullets: [
      "1:1 and small-group tutoring — built the ability to break down complex technical concepts for non-technical audiences, directly applicable to communicating security incidents and risk to stakeholders.",
    ],
  },
];

export const PROJECTS = [
  {
    name: "SOC Alert Automation Pipeline",
    private: true,
    featured: true,
    flow: true,
    writeup: "https://medium.com/@vrishabhbhavsar/the-part-of-alert-automation-nobody-talks-about-making-it-behave-when-things-go-wrong-788650070669",
    desc: "Production-oriented n8n pipeline integrating SIEM/SOAR alert ingestion with severity-based routing, SLA tracking, and tiered escalation — automating tier-1 triage workflows that analysts typically handle manually.",
    tags: ["n8n", "Seceon OTM API", "Automation", "SLA Tracking"],
  },
  {
    name: "CTI-Hub",
    link: "https://github.com/VB-1405/CTI-Hub",
    image: "projects/cti-hub.png",
    desc: "Self-hosted, Docker-ready multi-engine threat intelligence platform. Aggregates data from multiple TI engines into one interface for fast IOC lookup and enrichment during active investigations.",
    tags: ["Python", "Docker", "Threat Intel"],
  },
  {
    name: "Healthcare IDS",
    link: "https://github.com/VB-1405/healthcare-ids",
    wip: true,
    desc: "ML-powered Intrusion Detection System for medical IoT devices, using anomaly detection and supervised classification to flag malicious traffic targeting healthcare endpoints.",
    tags: ["Python", "Machine Learning", "IoT Security"],
  },
  {
    name: "DevSecOps CI/CD Pipeline",
    link: "https://github.com/VB-1405/CYB-535-Mid-Term",
    desc: "8-stage automated pipeline using Jenkins, Docker, Kubernetes, SonarQube, and Trivy — covering build/test, static analysis, container scanning, and zero-downtime deployment.",
    tags: ["Jenkins", "Kubernetes", "SonarQube", "Trivy"],
  },
];

export const CTF_WINS = [
  { medal: "🥈", name: "2nd Place — ToroHack 10.0 CTF", org: "California State University, Dominguez Hills · 2025" },
  { medal: "🥉", name: "3rd Place — ToroTechDay CTF", org: "California State University, Dominguez Hills · Fall 2024" },
];

export const PLATFORMS = [
  {
    rank: "Top 1%",
    name: "TryHackMe",
    href: "https://tryhackme.com/p/vrishabhbhavsar",
    desc: "SOC · Threat Hunting · Blue Team Paths",
  },
  {
    rank: "HTB",
    name: "Hack The Box",
    href: "https://app.hackthebox.com/users/1764076",
    desc: "Active platform profile",
  },
];

export const HOMELAB = {
  intro: "A virtual environment simulating a small enterprise network — my platform for experimenting with detection rules, attack scenarios, and SIEM tuning in a safe, controlled setting.",
  stack: [
    { name: "Proxmox", desc: "Hypervisor" },
    { name: "Elastic SIEM", desc: "Log collection & threat detection" },
    { name: "pfSense", desc: "Network firewall" },
    { name: "Win + Linux VMs", desc: "Endpoint simulation" },
  ],
  scenarios: [
    {
      title: "Ransomware Pre-Staging Detection",
      desc: "Simulated file encryption and lateral movement; wrote custom Elastic SIEM rules for shadow copy deletion and mass file rename events.",
    },
    {
      title: "Brute-Force & Credential Stuffing",
      desc: "Generated failed login storms against SSH and RDP; tuned alerts to reduce noise while maintaining real attack detection.",
    },
    {
      title: "Phishing & Malware Detonation",
      desc: "Executed phishing payloads in an isolated Windows VM; correlated C2 callbacks in Wireshark with SIEM logs.",
    },
    {
      title: "Privilege Escalation & Lateral Movement",
      desc: "Practiced MITRE ATT&CK techniques (T1078, T1021) and validated detection coverage in Elastic SIEM.",
    },
  ],
};

export const CERTS = [
  { name: "CompTIA Security+", meta: "SY0-701 · Active", verifyUrl: CREDLY_URL },
  { name: "AWS Certified Cloud Practitioner", meta: "Active · Exp. 2029", verifyUrl: CREDLY_URL },
  { name: "FortiSOAR Analyst & Responder", meta: "Fortinet NSE · Active", verifyUrl: CREDLY_URL },
  { name: "Microsoft Defender for Identity", meta: "Microsoft Learn · Active", verifyUrl: CREDLY_URL },
  { name: "Seceon OTM Specialist", meta: "Active" },
  { name: "CompTIA CySA+", meta: "CS0-003 · In Progress" },
];

export const EDUCATION = {
  degree: "M.S. Cybersecurity — California State University, Dominguez Hills",
  meta: "Expected Dec 2026 · B.E. Computer Science, Parul Institute (2020–2024)",
};

export const STUDY_GUIDES = {
  title: "Free public study guides — AWS CCP, Security+ & CySA+",
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
  title: "SOC Analyst / Security Engineer",
  subtitle: "Threat Hunter · DevSecOps",
  availability: "Open to SOC Analyst & Security Engineer roles",
  workAuthorization: "F-1 student · Graduating Dec 2026 · OPT-eligible upon graduation",
  location: "Long Beach, CA · Open to remote & hybrid",
  email: "vrishabhbhavsar@gmail.com",
};
