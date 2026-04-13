import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Shield, ShieldCheck, Cloud, Eye, Lock, Zap, BarChart3,
  CheckCircle2, ArrowRight, Server, Activity, Brain, Cpu,
  Terminal, GitBranch, BellRing, Wrench, ClipboardCheck,
  KeyRound, ShieldAlert, Crosshair, Globe, AlertTriangle,
  HardDrive, Wifi, Search, Layers, FileText, Bell
} from 'lucide-react';

const fadeUp = { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6 } };

const CATEGORIES = [
  {
    title: 'Cloud Security',
    subtitle: 'Comprehensive security for your multi-cloud infrastructure',
    color: '#6366f1',
    features: [
      { icon: ShieldCheck, title: 'Security Auditing', desc: 'Automated detection of misconfigurations, open ports, and public exposure across all cloud resources.' },
      { icon: KeyRound, title: 'IAM Analysis', desc: 'Deep analysis of users, roles, policies, and MFA status across AWS, Azure, and GCP.' },
      { icon: ShieldAlert, title: 'Security Groups', desc: 'Identify risky firewall rules with 0.0.0.0/0 exposure and remediate instantly.' },
      { icon: Crosshair, title: 'Threat Detection', desc: 'MITRE ATT&CK mapped threats with attack path analysis, secret detection, and risk scoring.' },
    ],
  },
  {
    title: 'Compliance & Governance',
    subtitle: 'Meet regulatory requirements with automated compliance scanning',
    color: '#10b981',
    features: [
      { icon: ClipboardCheck, title: '10+ Frameworks', desc: 'CIS AWS Foundations, NIST 800-53, SOC2, ISO 27001, PCI-DSS, HIPAA, GDPR, and WAF checks.' },
      { icon: FileText, title: 'Automated Reports', desc: 'Generate PDF, Excel, CSV, and JSON compliance reports for auditors and stakeholders.' },
      { icon: Bell, title: 'Alert Rules', desc: 'Custom notification rules with email, Slack, and webhook integrations.' },
      { icon: Layers, title: 'Audit Trail', desc: 'Every action logged with user, IP, timestamp, status for complete accountability.' },
    ],
  },
  {
    title: 'Auto-Remediation',
    subtitle: 'Fix security issues automatically with approval workflows',
    color: '#f59e0b',
    features: [
      { icon: Wrench, title: 'One-Click Fixes', desc: 'Close open security groups, disable public access, enable encryption with a single click.' },
      { icon: CheckCircle2, title: 'Approval Workflow', desc: 'Request > Owner Review > Approve/Reject > Execute > Verify — full audit trail.' },
      { icon: Shield, title: 'Risk Assessment', desc: 'Each remediation shows risk level, blast radius, and rollback instructions.' },
      { icon: Eye, title: 'Status Tracking', desc: 'Real-time tracking: pending, approved, in-progress, completed, or failed.' },
    ],
  },
  {
    title: 'App Monitoring',
    subtitle: 'Full-stack observability with metrics, logs, and traces',
    color: '#8b5cf6',
    features: [
      { icon: Cpu, title: 'Infrastructure Metrics', desc: 'Real-time CPU, memory, disk, network gauges with connected agent management.' },
      { icon: Terminal, title: 'Log Explorer', desc: 'Search, filter, and analyze application logs across all services with histogram analytics.' },
      { icon: GitBranch, title: 'Distributed Tracing', desc: 'Trace requests across microservices with span-level latency and service dependency maps.' },
      { icon: BellRing, title: 'Smart Alerts', desc: 'Threshold, anomaly, and composite alert rules with multi-channel notifications.' },
    ],
  },
  {
    title: 'AI-Powered Intelligence',
    subtitle: 'Machine learning for anomaly detection and predictive insights',
    color: '#ec4899',
    features: [
      { icon: Brain, title: 'Anomaly Detection', desc: 'Z-score, IQR, and Isolation Forest algorithms detect unusual patterns in real-time.' },
      { icon: Activity, title: 'Forecasting', desc: 'ARIMA and trend analysis predict resource usage 24 hours ahead with confidence intervals.' },
      { icon: Search, title: 'Log Clustering', desc: 'TF-IDF and KMeans clustering groups similar log patterns for faster troubleshooting.' },
      { icon: Zap, title: 'Root Cause Analysis', desc: 'AI-powered correlation across metrics, logs, and traces to identify incident causes.' },
    ],
  },
  {
    title: 'Security Hardening',
    subtitle: 'Platform-level security controls and API protection',
    color: '#14b8a6',
    features: [
      { icon: Lock, title: 'Rate Limiting', desc: 'Per-IP and per-user sliding window rate limiting with automatic throttling.' },
      { icon: Globe, title: 'Security Headers', desc: 'CSP, HSTS, X-Frame-Options, X-Content-Type-Options configured by default.' },
      { icon: AlertTriangle, title: 'Input Sanitization', desc: 'XSS prevention, SQL injection protection, and HTML tag stripping on all inputs.' },
      { icon: KeyRound, title: 'API Key Management', desc: 'Generate, list, and revoke API keys with permission scoping and audit logging.' },
    ],
  },
];

export default function Features() {
  return (
    <div className="pt-24">
      {/* Hero */}
      <section className="py-20 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(rgba(99,102,241,0.05)_1px,transparent_1px)] [background-size:32px_32px]" />
        <motion.div {...fadeUp} className="relative max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-black text-text mb-6">
            Powerful Features for{' '}
            <span className="bg-gradient-to-r from-primary-light to-accent-light bg-clip-text text-transparent">Complete Security</span>
          </h1>
          <p className="text-lg text-text-muted max-w-2xl mx-auto">
            From cloud security auditing to AI-powered monitoring, CloudSentrix provides every tool you need to protect and optimize your infrastructure.
          </p>
        </motion.div>
      </section>

      {/* Feature Categories */}
      {CATEGORIES.map((cat, ci) => (
        <section key={cat.title} className={`py-20 px-6 ${ci % 2 === 1 ? 'bg-surface-light/30 border-y border-border' : ''}`}>
          <div className="max-w-6xl mx-auto">
            <motion.div {...fadeUp} className="mb-12">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: `${cat.color}15` }}>
                <Shield className="w-6 h-6" style={{ color: cat.color }} />
              </div>
              <h2 className="text-3xl font-bold text-text mb-2">{cat.title}</h2>
              <p className="text-text-muted">{cat.subtitle}</p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {cat.features.map((f, fi) => (
                <motion.div
                  key={f.title}
                  {...fadeUp}
                  transition={{ delay: fi * 0.05 }}
                  className="flex gap-4 p-5 rounded-xl bg-surface-card border border-border hover:border-primary/20 transition-all"
                >
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${cat.color}15` }}>
                    <f.icon className="w-5 h-5" style={{ color: cat.color }} />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-text mb-1">{f.title}</h3>
                    <p className="text-sm text-text-muted leading-relaxed">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* CTA */}
      <section className="py-20 px-6 text-center">
        <motion.div {...fadeUp}>
          <h2 className="text-3xl font-bold text-text mb-4">See It In Action</h2>
          <p className="text-text-muted mb-8">Start your free 14-day trial. No credit card required.</p>
          <a href="/login" className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-primary to-primary-light text-white font-semibold rounded-xl text-lg hover:shadow-xl hover:shadow-primary/30 transition-all no-underline">
            Start Free Trial <ArrowRight className="w-5 h-5" />
          </a>
        </motion.div>
      </section>
    </div>
  );
}
