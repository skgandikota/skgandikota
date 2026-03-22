import React from 'react';
import Layout from '@theme/Layout';
import styles from './index.module.css';

/* ─── DATA ─── */
const STATS = [
  { value: '10+', label: 'Years Experience' },
  { value: '90+', label: 'Teams Enabled' },
  { value: '400+', label: 'Apps Deployed' },
  { value: '1,800', label: 'Engineers Served' },
];

const EXPERIENCE = [
  {
    current: true,
    role: 'Senior Platform Engineer',
    subtitle: 'Cloud Security & Platform Enablement',
    company: 'Tata Consultancy Services',
    dates: 'Dec 2023 – Present',
    location: '📍 London, UK',
    type: '💼 Hybrid',
    bullets: [
      'Leading cloud security enablement — Private Endpoints, Managed Identity, and policy-driven governance across Azure services',
      'Enabled onboarding of 90+ engineering teams and 400+ applications onto shared AKS-based enterprise platforms',
      'Implemented Backstage-based Internal Developer Portal serving 1,800 engineers',
      'Built reusable Terraform modules and GitHub Actions templates for self-service infrastructure',
      'Bridge between Security, Cloud, and Application teams — translating governance into adoptable workflows',
    ],
    tags: ['AKS', 'Terraform', 'Backstage', 'Private Endpoints', 'GitHub Actions', 'Azure Policy', 'Managed Identity'],
  },
  {
    role: 'Platform Engineer',
    subtitle: 'Kubernetes & Infrastructure Enablement',
    company: 'Tata Consultancy Services',
    dates: 'Apr 2021 – Dec 2023',
    location: '📍 Chennai, India',
    type: '🌐 Remote',
    bullets: [
      'Supported multi-tenant AKS environments — 30+ clusters across 18 business portfolios',
      'Built reusable Terraform modules for Azure services with VNet integration and Managed Identity',
      'Migrated application teams to AKS and Azure PaaS services',
      'Integrated New Relic observability at pod, node, and namespace level across enterprise clusters',
      'Managed Azure AD (Service Principals, Enterprise Apps, AD Groups) and SSO integrations',
    ],
    tags: ['AKS', 'Terraform', 'New Relic', 'Azure AD', 'SSO', 'Cost Optimisation'],
  },
  {
    role: 'DevSecOps & Backend Engineer',
    subtitle: 'Full Stack · API Development · Delivery Lead',
    company: 'Tata Consultancy Services',
    dates: 'Nov 2017 – Mar 2021',
    location: '📍 UK & India',
    type: '💼 Hybrid',
    bullets: [
      'Developed 15+ Java Spring Boot APIs for enterprise payment, loyalty, and voucher systems',
      'Gift card processing (1M+ monthly txns), staff discount (~65K employees), voucher automation (50–90K/week)',
      'Led 2 scrum teams (16 engineers) coordinating multi-project delivery',
      'Implemented ISO 8583 payment integration and CI/CD pipelines with Jenkins & Azure DevOps',
    ],
    tags: ['Java', 'Spring Boot', 'REST APIs', 'MongoDB', 'Jenkins', 'Azure DevOps', 'Microservices'],
  },
  {
    role: 'QA Automation Engineer',
    subtitle: 'Career Foundation',
    company: 'Tata Consultancy Services',
    dates: 'Jan 2016 – Nov 2017',
    location: '📍 Chennai, India',
    type: '🏢 On-site',
    bullets: [
      'Built test automation frameworks — Selenium, REST Assured, JMeter — covering 200+ test cases',
      'Reduced regression cycle from 3 days to 1 day',
      'Transitioned from manual testing to full automation engineering',
    ],
    tags: ['Selenium', 'Java', 'JMeter', 'SQL', 'Test Automation'],
  },
];

const SKILL_CATEGORIES = [
  {
    icon: '☁️',
    title: 'Cloud & Platform',
    skills: ['Microsoft Azure', 'AKS', 'Azure App Services', 'Azure Functions', 'Azure Key Vault', 'Azure Networking', 'Private Endpoints', 'Azure Policy', 'Managed Identity'],
  },
  {
    icon: '☸️',
    title: 'Kubernetes & Containers',
    skills: ['Kubernetes', 'AKS', 'Docker', 'Helm', 'Namespace Management', 'HPA/VPA', 'Container Registry'],
  },
  {
    icon: '🔧',
    title: 'IaC & Automation',
    skills: ['Terraform', 'Terraform Modules', 'GitHub Actions', 'Azure DevOps', 'Jenkins', 'GitOps', 'CI/CD Pipelines'],
  },
  {
    icon: '🔒',
    title: 'Security & Governance',
    skills: ['Private Endpoints', 'Zero Trust', 'Azure AD/Entra ID', 'Service Principals', 'RBAC', 'Network Policies', 'SSO Integration'],
  },
  {
    icon: '💻',
    title: 'Development',
    skills: ['Java', 'Spring Boot', 'Python', 'Node.js', 'TypeScript', 'REST APIs', 'Microservices', 'React'],
  },
  {
    icon: '📊',
    title: 'Observability & DevEx',
    skills: ['New Relic', 'Backstage (Spotify)', 'Internal Developer Portals', 'Platform-as-a-Product', 'Golden Paths'],
  },
];

const CERTS = [
  { icon: '🏅', name: 'GitHub Actions', issuer: 'Microsoft · 2025' },
  { icon: '🤖', name: 'Azure AI Fundamentals (AI-900)', issuer: 'Microsoft · 2025' },
  { icon: '🏅', name: 'GitHub Foundations', issuer: 'Microsoft · 2025' },
  { icon: '☁️', name: 'Azure Fundamentals (AZ-900)', issuer: 'Microsoft · 2023' },
  { icon: '🚀', name: 'OpenHack: DevOps', issuer: 'Microsoft · 2021' },
];

/* ─── COMPONENTS ─── */

function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.heroBg} />
      <div className={styles.heroBg2} />
      <div className={styles.heroContent}>
        {/* <div className={styles.heroProfile}>
          <img src="/img/profile.jpg" alt="Saikoushik Gandikota" className={styles.heroAvatar} />
        </div> */}
        <span className={styles.eyebrow}>☁️ Open to Contract & Permanent Roles</span>
        <h1 className={styles.heroName}>
          Hi, I'm <span className={styles.gradientText}>Saikoushik</span>
        </h1>
        <p className={styles.heroTagline}>
          Senior Platform Engineer enabling enterprise teams to ship securely at scale. 
          10+ years of Azure, Kubernetes, and Infrastructure-as-Code — from API development 
          to platform engineering leadership.
        </p>
        <div className={styles.heroStats}>
          {STATS.map((s, i) => (
            <div key={i} className={styles.stat}>
              <div className={styles.statValue}>{s.value}</div>
              <div className={styles.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>
        <div className={styles.heroCta}>
          <a href="https://linkedin.com/in/saikoushikg" className={styles.btnPrimary}>
            Connect on LinkedIn →
          </a>
          <a href="mailto:saikoushikg@gmail.com" className={styles.btnSecondary}>
            saikoushikg@gmail.com
          </a>
        </div>
      </div>
    </section>
  );
}

function About() {
  return (
    <section id="about" className={styles.section}>
      <div className="container">
        <span className={styles.badge}>About Me</span>
        <h2 className={styles.sectionTitle}>Engineer who enables engineers</h2>
        <div className={styles.aboutGrid}>
          <div className={styles.aboutText}>
            <p>
              Over the past decade, I've moved from QA automation → API development → 
              platform engineering — driven by one consistent pattern: <strong>seeing what 
              slows teams down and building the tooling to fix it.</strong>
            </p>
            <p>
              Currently, I lead Platform Enablement and Cloud Security at a major UK enterprise, 
              where I help engineering teams adopt Azure cloud platforms securely and at scale. 
              I believe infrastructure should be a service, not a ticket queue.
            </p>
            <p>
              I specialise in Internal Developer Platforms, Kubernetes (AKS), Terraform, 
              and secure-by-default cloud networking — enabling organisations to go from 
              bespoke deployments to standardised, self-service patterns.
            </p>
          </div>
          <div className={styles.aboutHighlights}>
            {[
              { icon: '☸️', value: '90+ Teams', label: 'Onboarded to shared platform' },
              { icon: '🚀', value: '400+ Apps', label: 'Deployed on AKS' },
              { icon: '👥', value: '1,800', label: 'Engineers using our portal' },
              { icon: '🔒', value: 'Secure by Default', label: 'Private Endpoints & Zero Trust' },
            ].map((h, i) => (
              <div key={i} className={styles.highlightCard}>
                <div className={styles.highlightIcon}>{h.icon}</div>
                <div className={styles.highlightValue}>{h.value}</div>
                <div className={styles.highlightLabel}>{h.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Experience() {
  return (
    <section id="experience" className={`${styles.section} ${styles.sectionAlt}`}>
      <div className="container">
        <span className={styles.badge}>Career Journey</span>
        <h2 className={styles.sectionTitle}>Professional Experience</h2>
        <p className={styles.sectionSub}>10+ years of progressive growth from QA → Backend → Platform Engineering</p>
        <div className={styles.timeline}>
          {EXPERIENCE.map((exp, i) => (
            <div key={i} className={`${styles.timelineItem} ${exp.current ? styles.timelineCurrent : ''}`}>
              <div className={styles.timelineDot} />
              <div className={styles.timelineCard}>
                <div className={styles.timelineHeader}>
                  <div>
                    <div className={styles.timelineRole}>{exp.role}</div>
                    <div className={styles.timelineSubtitle}>{exp.subtitle}</div>
                    <div className={styles.timelineCompany}>{exp.company}</div>
                  </div>
                  {exp.current && <span className={styles.currentBadge}>● Current</span>}
                </div>
                <div className={styles.timelineMeta}>
                  <span>📅 {exp.dates}</span>
                  <span>{exp.location}</span>
                  <span>{exp.type}</span>
                </div>
                <ul className={styles.timelineBullets}>
                  {exp.bullets.map((b, j) => <li key={j}>{b}</li>)}
                </ul>
                <div className={styles.timelineTags}>
                  {exp.tags.map((t, j) => <span key={j} className={styles.tag}>{t}</span>)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Skills() {
  return (
    <section id="skills" className={styles.section}>
      <div className="container">
        <span className={styles.badge}>Tech Stack</span>
        <h2 className={styles.sectionTitle}>Skills & Expertise</h2>
        <div className={styles.skillsGrid}>
          {SKILL_CATEGORIES.map((cat, i) => (
            <div key={i} className={styles.skillCategory}>
              <div className={styles.skillCatIcon}>{cat.icon}</div>
              <div className={styles.skillCatTitle}>{cat.title}</div>
              <div className={styles.skillList}>
                {cat.skills.map((s, j) => (
                  <span key={j} className={styles.skillPill}>{s}</span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className={styles.certsSection}>
          <h3 className={styles.certsTitle}>📜 Certifications</h3>
          <div className={styles.certsGrid}>
            {CERTS.map((c, i) => (
              <div key={i} className={styles.certCard}>
                <span className={styles.certIcon}>{c.icon}</span>
                <div>
                  <div className={styles.certName}>{c.name}</div>
                  <div className={styles.certIssuer}>{c.issuer}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Contact() {
  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.contactBox}>
          <h2 className={styles.contactTitle}>Let's work together</h2>
          <p className={styles.contactText}>
            I'm open to Senior Platform Engineer, Cloud Security Engineer, 
            and DevOps contract roles in the UK market.
          </p>
          <div className={styles.contactLinks}>
            <a href="mailto:saikoushikg@gmail.com" className={styles.btnPrimary}>
              📧 Get in Touch
            </a>
            <a href="https://linkedin.com/in/saikoushikg" className={styles.btnSecondary}>
              🔗 LinkedIn Profile
            </a>
            <a href="https://github.com/skgandikota" className={styles.btnSecondary}>
              💻 GitHub
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── MAIN ─── */
export default function Home(): JSX.Element {
  return (
    <Layout
      title="Saikoushik Gandikota — Senior Platform Engineer"
      description="Senior Platform Engineer specialising in Azure, Kubernetes (AKS), Terraform, and Cloud Security. 10+ years enabling enterprise teams to ship securely at scale.">
      <Hero />
      <About />
      <Experience />
      <Skills />
      <Contact />
    </Layout>
  );
}