import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Check, X, Zap, Crown, Building2, Shield, Cloud, Server,
  Users, FileText, Brain, ClipboardCheck, Crosshair, Globe,
  Lock, Bell, BookOpen, ArrowRight, Sparkles, Star, Rocket
} from 'lucide-react';
import Card from '../components/Card';
import { useToast } from '../components/Toast';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    subtitle: 'For individuals & exploration',
    price: { monthly: 0, yearly: 0 },
    icon: Cloud,
    color: '#94a3b8',
    popular: false,
    cta: 'Current Plan',
    ctaStyle: 'bg-surface-lighter/50 border border-border/50 text-text-muted cursor-default',
    features: [
      { text: '1 cloud account', included: true },
      { text: '5 scans per month', included: true },
      { text: 'Basic security audit', included: true },
      { text: '3 compliance frameworks', included: true },
      { text: 'Community support', included: true },
      { text: 'Dashboard & reports', included: true },
      { text: 'AI chat (10 queries/day)', included: true },
      { text: 'Threat detection (basic)', included: true },
      { text: 'Attack path analysis', included: false },
      { text: 'Custom compliance rules', included: false },
      { text: 'Team collaboration', included: false },
      { text: 'Webhook & Slack alerts', included: false },
      { text: 'SSO / SAML', included: false },
      { text: 'Priority support', included: false },
      { text: 'API access', included: false },
    ],
    limits: { accounts: 1, scans: 5, frameworks: 3, users: 1 },
  },
  {
    id: 'pro',
    name: 'Pro',
    subtitle: 'For growing teams',
    price: { monthly: 49, yearly: 39 },
    icon: Zap,
    color: '#7c3aed',
    popular: true,
    cta: 'Upgrade to Pro',
    ctaStyle: 'bg-gradient-to-r from-primary to-primary-dark hover:shadow-lg hover:shadow-primary/20 text-white font-semibold',
    features: [
      { text: '10 cloud accounts', included: true },
      { text: 'Unlimited scans', included: true },
      { text: 'Advanced security audit', included: true },
      { text: 'All 10 compliance frameworks', included: true },
      { text: 'Email support (24h SLA)', included: true },
      { text: 'Full dashboard & reports', included: true },
      { text: 'AI chat (unlimited)', included: true },
      { text: 'Advanced threat detection', included: true },
      { text: 'Attack path analysis', included: true },
      { text: 'Custom compliance rules', included: true },
      { text: 'Up to 10 team members', included: true },
      { text: 'Webhook & Slack alerts', included: true },
      { text: 'SSO / SAML', included: false },
      { text: 'Priority support', included: false },
      { text: 'API access', included: true },
    ],
    limits: { accounts: 10, scans: -1, frameworks: 10, users: 10 },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    subtitle: 'For large organizations',
    price: { monthly: 199, yearly: 159 },
    icon: Building2,
    color: '#f59e0b',
    popular: false,
    cta: 'Contact Sales',
    ctaStyle: 'bg-gradient-to-r from-amber-500 to-amber-600 hover:shadow-lg hover:shadow-amber-500/20 text-white font-semibold',
    features: [
      { text: 'Unlimited cloud accounts', included: true },
      { text: 'Unlimited scans', included: true },
      { text: 'Enterprise security audit', included: true },
      { text: 'All frameworks + custom', included: true },
      { text: 'Dedicated support engineer', included: true },
      { text: 'White-label reports', included: true },
      { text: 'AI chat + custom models', included: true },
      { text: 'Real-time threat detection', included: true },
      { text: 'Attack path + blast radius', included: true },
      { text: 'Custom compliance rules', included: true },
      { text: 'Unlimited team members', included: true },
      { text: 'All integrations', included: true },
      { text: 'SSO / SAML / SCIM', included: true },
      { text: 'Priority support (1h SLA)', included: true },
      { text: 'Full API access + SDK', included: true },
    ],
    limits: { accounts: -1, scans: -1, frameworks: -1, users: -1 },
  },
];

const COMPARISON = [
  { category: 'Cloud Accounts', free: '1', pro: '10', enterprise: 'Unlimited' },
  { category: 'Scans per Month', free: '5', pro: 'Unlimited', enterprise: 'Unlimited' },
  { category: 'Cloud Providers', free: 'AWS only', pro: 'AWS, Azure, GCP', enterprise: 'All + Private Cloud' },
  { category: 'Compliance Frameworks', free: '3 (CIS, SOC2, WAF)', pro: 'All 10', enterprise: 'All + Custom' },
  { category: 'Team Members', free: '1', pro: '10', enterprise: 'Unlimited' },
  { category: 'AI Chat Queries', free: '10/day', pro: 'Unlimited', enterprise: 'Unlimited + Custom' },
  { category: 'Threat Detection', free: 'Basic', pro: 'Advanced', enterprise: 'Real-time + ML' },
  { category: 'Attack Paths', free: '-', pro: 'Up to 10', enterprise: 'Unlimited + Blast Radius' },
  { category: 'Reports', free: 'PDF only', pro: 'PDF, Excel, JSON', enterprise: 'All + White-label' },
  { category: 'Alerts', free: 'Email only', pro: 'Email, Slack, Webhooks', enterprise: 'All + PagerDuty, Jira' },
  { category: 'Data Retention', free: '30 days', pro: '1 year', enterprise: 'Unlimited' },
  { category: 'Support', free: 'Community', pro: 'Email (24h)', enterprise: 'Dedicated (1h SLA)' },
  { category: 'SSO / SAML', free: '-', pro: '-', enterprise: '✓' },
  { category: 'API Access', free: '-', pro: 'REST API', enterprise: 'REST + SDK + GraphQL' },
  { category: 'Audit Log', free: '-', pro: '90 days', enterprise: 'Unlimited' },
];

export default function Pricing() {
  const [billing, setBilling] = useState('monthly');
  const { addToast } = useToast();

  const handleUpgrade = (plan) => {
    if (plan.id === 'free') return;
    addToast(`${plan.name} plan selected! In production, this would redirect to payment.`, 'info', 5000);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-10 h-10 rounded-xl gradient-border flex items-center justify-center shadow-lg shadow-primary/15">
            <Crown className="w-5 h-5 text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-black text-text">Choose Your Plan</h1>
        <p className="text-text-muted text-sm mt-2 max-w-lg mx-auto">
          Secure your cloud infrastructure with CloudSentinel. Start free, upgrade as you grow.
        </p>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-3 mt-6">
          <span className={`text-sm font-medium ${billing === 'monthly' ? 'text-text' : 'text-text-muted'}`}>Monthly</span>
          <button onClick={() => setBilling(b => b === 'monthly' ? 'yearly' : 'monthly')}
            className="relative w-14 h-7 rounded-full bg-surface-lighter border border-border/50 transition-all"
            style={billing === 'yearly' ? { background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' } : {}}>
            <motion.div animate={{ x: billing === 'yearly' ? 28 : 2 }}
              className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-md" />
          </button>
          <span className={`text-sm font-medium ${billing === 'yearly' ? 'text-text' : 'text-text-muted'}`}>
            Yearly
            <span className="ml-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/12 text-emerald-400 border border-emerald-500/15">Save 20%</span>
          </span>
        </div>
      </motion.div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {PLANS.map((plan, i) => {
          const Icon = plan.icon;
          const price = billing === 'yearly' ? plan.price.yearly : plan.price.monthly;
          return (
            <motion.div key={plan.id}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className={`relative rounded-2xl border p-6 transition-all ${
                plan.popular
                  ? 'border-primary/30 bg-gradient-to-b from-primary/[0.06] to-surface-light shadow-xl shadow-primary/8 scale-[1.02]'
                  : 'border-border/40 bg-surface-light/60 hover:border-border/60'
              }`}>
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1 rounded-full bg-gradient-to-r from-primary to-primary-dark text-white text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-primary/20 flex items-center gap-1.5">
                    <Star className="w-3 h-3" /> Most Popular
                  </span>
                </div>
              )}

              {/* Plan Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ background: `${plan.color}12`, border: `1px solid ${plan.color}20` }}>
                  <Icon className="w-5 h-5" style={{ color: plan.color }} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-text">{plan.name}</h3>
                  <p className="text-[10px] text-text-muted">{plan.subtitle}</p>
                </div>
              </div>

              {/* Price */}
              <div className="mb-5">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-text tabular-nums">
                    {price === 0 ? 'Free' : `$${price}`}
                  </span>
                  {price > 0 && <span className="text-text-muted text-sm">/ month</span>}
                </div>
                {price > 0 && billing === 'yearly' && (
                  <p className="text-[10px] text-emerald-400 mt-1">
                    Billed ${price * 12}/year (save ${(plan.price.monthly - plan.price.yearly) * 12}/year)
                  </p>
                )}
              </div>

              {/* CTA Button */}
              <button onClick={() => handleUpgrade(plan)}
                className={`w-full py-3 rounded-xl text-sm transition-all ${plan.ctaStyle} flex items-center justify-center gap-2`}>
                {plan.id === 'free' ? plan.cta : <><Rocket className="w-4 h-4" /> {plan.cta}</>}
              </button>

              {/* Features */}
              <div className="mt-6 space-y-2.5">
                {plan.features.map((f, fi) => (
                  <div key={fi} className="flex items-start gap-2.5">
                    {f.included ? (
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <X className="w-4 h-4 text-text-muted/30 flex-shrink-0 mt-0.5" />
                    )}
                    <span className={`text-xs leading-relaxed ${f.included ? 'text-text' : 'text-text-muted/40'}`}>{f.text}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Feature Comparison Table */}
      <div>
        <div className="section-title mb-5"><ClipboardCheck className="w-4 h-4 text-primary-light" /><span>Detailed Feature Comparison</span></div>
        <Card hover={false}>
          <div className="overflow-x-auto">
            <table className="corp-table w-full">
              <thead>
                <tr>
                  <th className="text-left w-1/4">Feature</th>
                  <th className="text-center">Free</th>
                  <th className="text-center" style={{ background: 'rgba(124,58,237,0.06)' }}>
                    <span className="flex items-center justify-center gap-1"><Star className="w-3 h-3 text-primary-light" /> Pro</span>
                  </th>
                  <th className="text-center">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row, i) => (
                  <motion.tr key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
                    <td className="font-medium text-text">{row.category}</td>
                    <td className="text-center text-text-muted">{row.free === '✓' ? <Check className="w-4 h-4 text-emerald-400 mx-auto" /> : row.free === '-' ? <X className="w-4 h-4 text-text-muted/20 mx-auto" /> : row.free}</td>
                    <td className="text-center" style={{ background: 'rgba(124,58,237,0.03)' }}>
                      {row.pro === '✓' ? <Check className="w-4 h-4 text-emerald-400 mx-auto" /> : row.pro === '-' ? <X className="w-4 h-4 text-text-muted/20 mx-auto" /> : <span className="text-primary-light font-medium">{row.pro}</span>}
                    </td>
                    <td className="text-center text-text-muted">{row.enterprise === '✓' ? <Check className="w-4 h-4 text-emerald-400 mx-auto" /> : row.enterprise === '-' ? <X className="w-4 h-4 text-text-muted/20 mx-auto" /> : <span className="text-amber-400 font-medium">{row.enterprise}</span>}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* FAQ */}
      <div>
        <div className="section-title mb-5"><BookOpen className="w-4 h-4 text-accent-light" /><span>Frequently Asked Questions</span></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { q: 'Can I change plans anytime?', a: 'Yes. Upgrade or downgrade at any time. Changes take effect immediately, and you\'ll be prorated for the remaining billing period.' },
            { q: 'What cloud providers are supported?', a: 'Free plan supports AWS only. Pro and Enterprise support AWS, Azure, and GCP. Enterprise can also integrate private cloud environments.' },
            { q: 'Is there a free trial for Pro?', a: 'Yes! Pro comes with a 14-day free trial. No credit card required to start.' },
            { q: 'What happens when I exceed limits?', a: 'You\'ll receive a notification and be prompted to upgrade. Existing data and scans are preserved.' },
            { q: 'Do you offer discounts for startups?', a: 'Yes, we offer 50% off for startups under $5M ARR. Contact sales for details.' },
            { q: 'How is data secured?', a: 'All data is encrypted at rest (AES-256) and in transit (TLS 1.3). We are SOC 2 Type II certified.' },
          ].map((faq, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.04 }}
              className="rounded-xl border border-border/30 bg-surface-light/50 p-4 hover:border-border/50 transition-all">
              <p className="text-sm font-semibold text-text mb-1.5">{faq.q}</p>
              <p className="text-xs text-text-muted leading-relaxed">{faq.a}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* CTA Banner */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="rounded-2xl bg-gradient-to-r from-primary/15 via-accent/10 to-primary/15 border border-primary/15 p-8 text-center">
        <Sparkles className="w-8 h-8 text-primary-light mx-auto mb-3" />
        <h2 className="text-xl font-bold text-text">Need a custom plan?</h2>
        <p className="text-text-muted text-sm mt-1.5 max-w-md mx-auto">
          We build custom solutions for enterprises with specific security, compliance, and integration needs.
        </p>
        <button onClick={() => addToast('Contact form would open here in production', 'info')}
          className="mt-4 px-6 py-3 bg-gradient-to-r from-primary to-primary-dark rounded-xl text-sm font-semibold transition-all shadow-lg shadow-primary/15 hover:shadow-primary/25 inline-flex items-center gap-2">
          <Building2 className="w-4 h-4" /> Talk to Sales <ArrowRight className="w-4 h-4" />
        </button>
      </motion.div>
    </div>
  );
}
