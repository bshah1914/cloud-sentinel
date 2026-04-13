import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Shield, Cloud, Lock, Eye, Zap, ArrowRight, Sparkles,
  ShieldCheck, Activity, Brain, Wrench, ClipboardCheck,
  AlertTriangle, CheckCircle2, TrendingUp, Globe, Cpu,
  Terminal, GitBranch, BellRing, Server, KeyRound
} from 'lucide-react';

import AuroraBackground from '../components/animated/AuroraBackground';
import CursorSpotlight from '../components/animated/CursorSpotlight';
import ShieldConstellation from '../components/animated/ShieldConstellation';
import LiveCounter from '../components/animated/LiveCounter';
import ScanRadar from '../components/animated/ScanRadar';
import ComplianceGauge from '../components/animated/ComplianceGauge';
import AnimatedChecklist from '../components/animated/AnimatedChecklist';
import ComplianceBadges from '../components/animated/ComplianceBadges';
import LiveDashboard from '../components/animated/LiveDashboard';
import MagneticButton from '../components/animated/MagneticButton';

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 },
};

const FEATURES = [
  { icon: Cloud, title: 'Multi-Cloud Coverage', desc: 'AWS, Azure, and GCP unified in a single pane of glass.', color: '#6366f1' },
  { icon: ShieldCheck, title: 'Security Auditing', desc: 'Automated misconfiguration detection across all resources.', color: '#10b981' },
  { icon: ClipboardCheck, title: 'Compliance Engine', desc: 'CIS, NIST, SOC2, ISO 27001, PCI-DSS, HIPAA, GDPR built-in.', color: '#06b6d4' },
  { icon: Eye, title: 'Threat Detection', desc: 'MITRE ATT&CK mapped threats with attack path analysis.', color: '#f59e0b' },
  { icon: Wrench, title: 'Auto-Remediation', desc: 'One-click fixes with owner approval workflow.', color: '#ec4899' },
  { icon: Activity, title: 'App Monitoring', desc: 'Metrics, logs, traces, and intelligent alerts.', color: '#8b5cf6' },
  { icon: Brain, title: 'AI Analysis', desc: 'Anomaly detection, forecasting, root cause analysis.', color: '#ef4444' },
  { icon: Lock, title: 'Security Hardening', desc: 'Rate limiting, headers, sanitization, API keys.', color: '#14b8a6' },
];

const TESTIMONIALS = [
  { name: 'Priya Sharma', role: 'CISO, FinTech Corp', quote: 'CloudSentrix reduced our security audit time from weeks to minutes. The multi-cloud visibility is unmatched.', avatar: 'PS' },
  { name: 'James Chen', role: 'DevOps Lead, SaaS Inc', quote: 'The automated remediation and compliance reporting saved us hundreds of hours. Essential for any cloud-first team.', avatar: 'JC' },
  { name: 'Sarah Miller', role: 'VP Engineering, HealthTech', quote: 'HIPAA compliance checks that actually work. CloudSentrix is now our single source of truth.', avatar: 'SM' },
];

export default function Home() {
  return (
    <div className="relative">
      <CursorSpotlight />

      {/* ═══════════════ HERO ═══════════════ */}
      <section className="relative pt-32 pb-32 px-6 overflow-hidden min-h-screen flex items-center">
        <AuroraBackground />

        <div className="max-w-7xl mx-auto w-full relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary-light text-sm font-medium mb-6 backdrop-blur-md">
                  <Sparkles className="w-4 h-4" />
                  Now with AI Analysis & App Monitoring
                </div>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="text-5xl md:text-6xl lg:text-7xl font-black leading-[1.05] mb-6"
              >
                <span className="text-text">Defend Your</span>
                <br />
                <span className="bg-gradient-to-r from-primary-light via-accent-light to-violet-400 bg-clip-text text-transparent">
                  Multi-Cloud
                </span>
                <br />
                <span className="text-text">In Real-Time</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="text-lg md:text-xl text-text-muted max-w-xl mb-10 leading-relaxed"
              >
                The unified security platform for AWS, Azure, and GCP. Continuous compliance, threat detection, automated remediation, and AI-powered monitoring — all in one dashboard.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <MagneticButton
                  as="a"
                  href="/signup"
                  className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-primary via-primary-light to-accent text-white font-semibold rounded-2xl text-lg shadow-2xl shadow-primary/30 hover:shadow-primary/50 transition-shadow no-underline"
                >
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </MagneticButton>
                <MagneticButton
                  as="a"
                  href="#features"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/5 backdrop-blur-md border border-border text-text font-semibold rounded-2xl text-lg hover:bg-white/10 transition-colors no-underline"
                >
                  Watch Demo
                </MagneticButton>
              </motion.div>

              {/* Trust indicators */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-10 flex items-center gap-6 text-sm text-text-muted"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  No credit card
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  14-day trial
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  SOC 2 certified
                </div>
              </motion.div>
            </div>

            {/* Right: Shield Constellation */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.3 }}
              className="hidden lg:block"
            >
              <ShieldConstellation />
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-text-muted text-xs"
        >
          ↓ Scroll to explore
        </motion.div>
      </section>

      {/* ═══════════════ LIVE STATS ═══════════════ */}
      <section className="relative py-20 px-6 border-y border-border bg-surface-light/30">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.08),transparent_70%)]" />
        <div className="max-w-6xl mx-auto relative">
          <motion.div {...fadeUp} className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE METRICS
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-text">Protecting Cloud Infrastructure 24/7</h2>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: 'Threats Blocked', end: 12847, increment: 5, color: '#ef4444', icon: Shield },
              { label: 'Active Scans', end: 384, increment: 0.5, color: '#06b6d4', icon: Activity },
              { label: 'Compliance Score', end: 97, suffix: '%', color: '#10b981', icon: TrendingUp },
              { label: 'Cloud Resources', end: 1284723, increment: 3, color: '#8b5cf6', icon: Server },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                {...fadeUp}
                transition={{ delay: i * 0.1 }}
                className="relative p-6 rounded-2xl bg-surface-card border border-border overflow-hidden group hover:border-primary/30 transition-colors"
              >
                <div
                  className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity"
                  style={{ background: stat.color }}
                />
                <stat.icon className="w-6 h-6 mb-4" style={{ color: stat.color }} />
                <p className="text-3xl md:text-4xl font-black text-text mb-1">
                  <LiveCounter end={stat.end} suffix={stat.suffix || ''} increment={stat.increment} />
                </p>
                <p className="text-sm text-text-muted">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ LIVE SECURITY SCAN ═══════════════ */}
      <section className="py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(16,185,129,0.05),transparent_70%)]" />
        <div className="max-w-6xl mx-auto relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div {...fadeUp}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-4">
                <Eye className="w-3 h-3" />
                CONTINUOUS SCANNING
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-text mb-6 leading-tight">
                Find Vulnerabilities <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Before Attackers Do</span>
              </h2>
              <p className="text-lg text-text-muted mb-8 leading-relaxed">
                Our continuous scanner sweeps your entire cloud infrastructure 24/7, detecting misconfigurations, exposed services, weak IAM policies, and security gaps in real-time.
              </p>
              <div className="space-y-4">
                {[
                  { icon: AlertTriangle, text: 'Detect critical issues in seconds', color: '#ef4444' },
                  { icon: Cpu, text: 'AI-powered risk scoring', color: '#06b6d4' },
                  { icon: Wrench, text: 'One-click auto-remediation', color: '#10b981' },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.15 }}
                    className="flex items-center gap-3"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${item.color}15` }}
                    >
                      <item.icon className="w-5 h-5" style={{ color: item.color }} />
                    </div>
                    <span className="text-text font-medium">{item.text}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div {...fadeUp} transition={{ delay: 0.2 }}>
              <ScanRadar />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════ COMPLIANCE BADGES MARQUEE ═══════════════ */}
      <section className="py-12 border-y border-border bg-surface-light/20">
        <ComplianceBadges />
      </section>

      {/* ═══════════════ COMPLIANCE GAUGE + CHECKLIST ═══════════════ */}
      <section className="py-32 px-6 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(16,185,129,0.05),transparent_70%)]" />
        <div className="max-w-6xl mx-auto relative">
          <motion.div {...fadeUp} className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium mb-4">
              <ClipboardCheck className="w-3 h-3" />
              AUTOMATED COMPLIANCE
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-text mb-4">
              Stay <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Audit-Ready</span> Always
            </h2>
            <p className="text-lg text-text-muted max-w-2xl mx-auto">
              10+ frameworks built-in. Continuous monitoring. Automated reports. Pass your next audit with confidence.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div {...fadeUp} className="flex flex-col items-center">
              <ComplianceGauge score={97} label="SOC 2 Compliance" size={280} />
              <div className="mt-8 grid grid-cols-3 gap-4 w-full max-w-sm">
                {[
                  { label: 'Frameworks', value: '10+' },
                  { label: 'Checks', value: '500+' },
                  { label: 'Auto-Pass', value: '94%' },
                ].map(s => (
                  <div key={s.label} className="text-center p-3 rounded-xl bg-surface-card border border-border">
                    <p className="text-2xl font-black text-emerald-400">{s.value}</p>
                    <p className="text-[10px] text-text-muted uppercase tracking-wider mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div {...fadeUp} transition={{ delay: 0.2 }}>
              <h3 className="text-xl font-bold text-text mb-4">Real-Time Compliance Checks</h3>
              <p className="text-sm text-text-muted mb-6">Every change to your infrastructure is verified against your compliance policies instantly.</p>
              <AnimatedChecklist />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════ FEATURES GRID ═══════════════ */}
      <section id="features" className="py-32 px-6 relative">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeUp} className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-medium mb-4">
              <Sparkles className="w-3 h-3" />
              EVERYTHING YOU NEED
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-text mb-4">One Platform, Infinite Protection</h2>
            <p className="text-lg text-text-muted max-w-2xl mx-auto">
              From security auditing to AI-powered analysis — CloudSentrix provides end-to-end protection for your multi-cloud infrastructure.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.5 }}
                whileHover={{ y: -6 }}
                className="group relative p-6 rounded-2xl bg-surface-card border border-border hover:border-primary/30 transition-colors overflow-hidden"
              >
                <div
                  className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-30 transition-opacity"
                  style={{ background: f.color }}
                />
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: `${f.color}15` }}>
                    <f.icon className="w-6 h-6" style={{ color: f.color }} />
                  </div>
                  <h3 className="text-base font-semibold text-text mb-2">{f.title}</h3>
                  <p className="text-sm text-text-muted leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ LIVE DASHBOARD PREVIEW ═══════════════ */}
      <section className="py-32 px-6 bg-surface-light/20 border-y border-border relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(99,102,241,0.08),transparent_70%)]" />
        <div className="max-w-6xl mx-auto relative">
          <motion.div {...fadeUp} className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary-light text-xs font-medium mb-4">
              <Activity className="w-3 h-3" />
              LIVE PREVIEW
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-text mb-4">See Your Infrastructure in Real-Time</h2>
            <p className="text-lg text-text-muted max-w-2xl mx-auto">
              A unified dashboard for security, compliance, monitoring, and remediation.
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            <LiveDashboard />
          </div>
        </div>
      </section>

      {/* ═══════════════ TESTIMONIALS ═══════════════ */}
      <section className="py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeUp} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-text mb-4">Trusted by Security Teams</h2>
            <p className="text-lg text-text-muted">From startups to Fortune 500 — CloudSentrix protects them all.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-2xl bg-surface-card border border-border hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-amber-400 text-lg">★</span>
                  ))}
                </div>
                <p className="text-sm text-text-muted leading-relaxed mb-6 italic">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-sm font-bold">{t.avatar}</div>
                  <div>
                    <p className="text-sm font-semibold text-text">{t.name}</p>
                    <p className="text-xs text-text-muted">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ FINAL CTA ═══════════════ */}
      <section className="py-32 px-6">
        <motion.div
          {...fadeUp}
          className="max-w-5xl mx-auto relative p-12 md:p-16 rounded-3xl bg-gradient-to-br from-primary/20 via-accent/10 to-violet-500/15 border border-primary/30 overflow-hidden"
        >
          {/* Animated glow */}
          <motion.div
            className="absolute -top-1/2 -left-1/4 w-[600px] h-[600px] rounded-full blur-[120px]"
            style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.4), transparent 70%)' }}
            animate={{ x: [0, 100, 0], y: [0, 50, 0] }}
            transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute -bottom-1/2 -right-1/4 w-[500px] h-[500px] rounded-full blur-[120px]"
            style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.4), transparent 70%)' }}
            animate={{ x: [0, -80, 0], y: [0, -60, 0] }}
            transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          />

          <div className="relative text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Start Free Today
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-text mb-6 leading-tight">
              Ready to Secure<br />Your Cloud?
            </h2>
            <p className="text-lg md:text-xl text-text-muted mb-10 max-w-2xl mx-auto">
              Join hundreds of teams who trust CloudSentrix to protect their multi-cloud infrastructure.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <MagneticButton
                as="a"
                href="/signup"
                className="group inline-flex items-center justify-center gap-2 px-10 py-4 bg-gradient-to-r from-primary via-primary-light to-accent text-white font-semibold rounded-2xl text-lg shadow-2xl shadow-primary/40 hover:shadow-primary/60 transition-shadow no-underline"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </MagneticButton>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white font-semibold rounded-2xl text-lg hover:bg-white/15 transition-colors no-underline"
              >
                Talk to Sales
              </Link>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
