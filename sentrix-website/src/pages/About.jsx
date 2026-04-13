import { motion } from 'framer-motion';
import { Shield, Target, Eye, Heart, Users, Globe, Award, Rocket } from 'lucide-react';

const fadeUp = { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6 } };

const VALUES = [
  { icon: Shield, title: 'Security First', desc: 'Every decision we make starts with security. We build tools that we trust to protect our own infrastructure.' },
  { icon: Eye, title: 'Transparency', desc: 'No hidden fees, no black boxes. Our security scoring and compliance checks are fully transparent and auditable.' },
  { icon: Rocket, title: 'Innovation', desc: 'We leverage AI and machine learning to stay ahead of threats and give our customers predictive intelligence.' },
  { icon: Heart, title: 'Customer Focus', desc: 'Built by cloud engineers for cloud engineers. Every feature comes from real-world pain points we experienced.' },
];

const TEAM = [
  { name: 'CloudTrio Team', role: 'Founders & Engineering', avatar: 'CT', desc: 'A team of cloud architects, security engineers, and full-stack developers based in Ahmedabad, India.' },
  { name: 'Security Research', role: 'Threat Intelligence', avatar: 'SR', desc: 'Dedicated team tracking emerging cloud threats, misconfigurations, and compliance changes.' },
  { name: 'Customer Success', role: 'Support & Onboarding', avatar: 'CS', desc: 'Helping customers get the most out of CloudSentrix with hands-on onboarding and 24/7 support.' },
];

const MILESTONES = [
  { year: '2024', event: 'CloudSentrix founded by CloudTrio', desc: 'Started as an internal tool for managing multi-cloud security.' },
  { year: '2025', event: 'v2.0 — Multi-Cloud Support', desc: 'Added Azure and GCP support alongside AWS. Launched compliance frameworks.' },
  { year: '2025', event: 'v3.0 — Enterprise Platform', desc: 'Threat detection, auto-remediation, AI dashboard, and white-label branding.' },
  { year: '2026', event: 'v3.3 — App Monitoring + Security', desc: 'Full observability stack, AI analysis, security hardening, and Security Center.' },
];

export default function About() {
  return (
    <div className="pt-24">
      {/* Hero */}
      <section className="py-20 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(rgba(99,102,241,0.05)_1px,transparent_1px)] [background-size:32px_32px]" />
        <motion.div {...fadeUp} className="relative max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-black text-text mb-6">
            Built by Cloud Engineers,{' '}
            <span className="bg-gradient-to-r from-primary-light to-accent-light bg-clip-text text-transparent">For Cloud Engineers</span>
          </h1>
          <p className="text-lg text-text-muted max-w-2xl mx-auto">
            CloudSentrix was born from the frustration of managing security across multiple cloud providers with disconnected tools. We built the unified platform we wished existed.
          </p>
        </motion.div>
      </section>

      {/* Mission */}
      <section className="py-20 px-6 bg-surface-light/30 border-y border-border">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <motion.div {...fadeUp}>
            <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center mb-4">
              <Target className="w-6 h-6 text-primary-light" />
            </div>
            <h2 className="text-3xl font-bold text-text mb-4">Our Mission</h2>
            <p className="text-text-muted leading-relaxed mb-4">
              To make enterprise-grade cloud security accessible to every organization, regardless of size. We believe that security shouldn't be a luxury — it should be a standard.
            </p>
            <p className="text-text-muted leading-relaxed">
              By unifying security, compliance, monitoring, and AI-powered intelligence in a single platform, we help teams move faster without compromising on security posture.
            </p>
          </motion.div>
          <motion.div {...fadeUp} transition={{ delay: 0.2 }} className="grid grid-cols-2 gap-4">
            {[
              { value: '3', label: 'Cloud Providers' },
              { value: '10+', label: 'Compliance Frameworks' },
              { value: '72+', label: 'API Endpoints' },
              { value: '24/7', label: 'Monitoring' },
            ].map(s => (
              <div key={s.label} className="p-5 rounded-xl bg-surface-card border border-border text-center">
                <p className="text-3xl font-black bg-gradient-to-r from-primary-light to-accent-light bg-clip-text text-transparent">{s.value}</p>
                <p className="text-xs text-text-muted mt-1">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="text-3xl font-bold text-text mb-4">Our Values</h2>
            <p className="text-text-muted">The principles that guide everything we build.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {VALUES.map((v, i) => (
              <motion.div key={v.title} {...fadeUp} transition={{ delay: i * 0.1 }} className="flex gap-4 p-6 rounded-xl bg-surface-card border border-border">
                <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
                  <v.icon className="w-5 h-5 text-primary-light" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-text mb-1">{v.title}</h3>
                  <p className="text-sm text-text-muted leading-relaxed">{v.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 px-6 bg-surface-light/30 border-y border-border">
        <div className="max-w-5xl mx-auto">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="text-3xl font-bold text-text mb-4">Our Team</h2>
            <p className="text-text-muted">The people behind CloudSentrix.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TEAM.map((t, i) => (
              <motion.div key={t.name} {...fadeUp} transition={{ delay: i * 0.1 }} className="p-6 rounded-xl bg-surface-card border border-border text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xl font-bold mx-auto mb-4">{t.avatar}</div>
                <h3 className="text-base font-semibold text-text">{t.name}</h3>
                <p className="text-xs text-primary-light font-medium mt-1">{t.role}</p>
                <p className="text-sm text-text-muted mt-3 leading-relaxed">{t.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="text-3xl font-bold text-text mb-4">Our Journey</h2>
          </motion.div>
          <div className="space-y-0">
            {MILESTONES.map((m, i) => (
              <motion.div key={i} {...fadeUp} transition={{ delay: i * 0.1 }} className="flex gap-6 pb-8 relative">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-primary-light flex-shrink-0 mt-1.5" />
                  {i < MILESTONES.length - 1 && <div className="w-px flex-1 bg-border mt-2" />}
                </div>
                <div className="pb-2">
                  <span className="text-xs font-semibold text-primary-light">{m.year}</span>
                  <h4 className="text-base font-semibold text-text mt-1">{m.event}</h4>
                  <p className="text-sm text-text-muted mt-1">{m.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
