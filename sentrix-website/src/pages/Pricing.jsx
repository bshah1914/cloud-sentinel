import { motion } from 'framer-motion';
import { CheckCircle2, ArrowRight, Zap, Crown, Building2, X } from 'lucide-react';

const fadeUp = { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6 } };

const PLANS = [
  {
    name: 'Starter',
    price: 'Free',
    period: '',
    desc: 'For small teams getting started with cloud security.',
    icon: Zap,
    color: '#6366f1',
    cta: 'Get Started Free',
    popular: false,
    features: [
      { text: '1 Cloud Account', included: true },
      { text: 'Security Audit', included: true },
      { text: '3 Compliance Frameworks', included: true },
      { text: 'Basic Dashboard', included: true },
      { text: 'Email Alerts', included: true },
      { text: 'App Monitoring', included: false },
      { text: 'AI Analysis', included: false },
      { text: 'Auto-Remediation', included: false },
      { text: 'Custom Branding', included: false },
      { text: 'SSO / SAML', included: false },
    ],
  },
  {
    name: 'Professional',
    price: '$99',
    period: '/month',
    desc: 'For growing teams that need full cloud visibility.',
    icon: Crown,
    color: '#8b5cf6',
    cta: 'Start Free Trial',
    popular: true,
    features: [
      { text: '5 Cloud Accounts', included: true },
      { text: 'Security Audit + IAM', included: true },
      { text: 'All 10 Compliance Frameworks', included: true },
      { text: 'Advanced Dashboard + Widgets', included: true },
      { text: 'Slack, Email, Webhook Alerts', included: true },
      { text: 'App Monitoring (Full)', included: true },
      { text: 'AI Analysis + Forecasting', included: true },
      { text: 'Auto-Remediation', included: true },
      { text: 'Custom Branding', included: false },
      { text: 'SSO / SAML', included: false },
    ],
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    desc: 'For large organizations with advanced security needs.',
    icon: Building2,
    color: '#06b6d4',
    cta: 'Contact Sales',
    popular: false,
    features: [
      { text: 'Unlimited Cloud Accounts', included: true },
      { text: 'Full Security Suite', included: true },
      { text: 'All Compliance + Custom Rules', included: true },
      { text: 'White-Label Dashboard', included: true },
      { text: 'All Notification Channels', included: true },
      { text: 'App Monitoring (Full)', included: true },
      { text: 'AI Analysis + Custom Models', included: true },
      { text: 'Auto-Remediation + Approval', included: true },
      { text: 'Custom Branding / White-Label', included: true },
      { text: 'SSO / SAML / SCIM', included: true },
    ],
  },
];

const FAQS = [
  { q: 'How does the free trial work?', a: 'You get full access to the Professional plan for 14 days. No credit card required. If you decide not to continue, your account automatically downgrades to the Starter plan.' },
  { q: 'Can I change plans later?', a: 'Yes, you can upgrade or downgrade at any time. Changes take effect immediately. If you downgrade mid-cycle, you\'ll receive prorated credit.' },
  { q: 'What cloud providers do you support?', a: 'We support AWS, Microsoft Azure, and Google Cloud Platform. You can connect multiple accounts from different providers in a single dashboard.' },
  { q: 'Is my data secure?', a: 'Absolutely. We use AES-256 encryption at rest, TLS 1.2+ in transit, and never store your cloud credentials in plain text. We\'re SOC2 Type II certified.' },
  { q: 'Do you offer volume discounts?', a: 'Yes, we offer discounts for annual billing and for organizations with 10+ cloud accounts. Contact our sales team for a custom quote.' },
];

export default function Pricing() {
  return (
    <div className="pt-24">
      {/* Hero */}
      <section className="py-20 px-6 text-center">
        <motion.div {...fadeUp}>
          <h1 className="text-4xl md:text-6xl font-black text-text mb-6">
            Simple, Transparent{' '}
            <span className="bg-gradient-to-r from-primary-light to-accent-light bg-clip-text text-transparent">Pricing</span>
          </h1>
          <p className="text-lg text-text-muted max-w-2xl mx-auto">
            Start free, scale as you grow. No hidden fees, no surprises.
          </p>
        </motion.div>
      </section>

      {/* Plans */}
      <section className="px-6 pb-24">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.name}
              {...fadeUp}
              transition={{ delay: i * 0.1 }}
              className={`relative rounded-2xl p-6 border ${plan.popular ? 'border-primary/40 bg-gradient-to-b from-primary/5 to-transparent shadow-lg shadow-primary/10' : 'border-border bg-surface-card'}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-primary to-primary-light text-white text-xs font-bold rounded-full">
                  Most Popular
                </div>
              )}
              <div className="mb-6">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: `${plan.color}15` }}>
                  <plan.icon className="w-6 h-6" style={{ color: plan.color }} />
                </div>
                <h3 className="text-xl font-bold text-text">{plan.name}</h3>
                <p className="text-sm text-text-muted mt-1">{plan.desc}</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-black text-text">{plan.price}</span>
                <span className="text-text-muted">{plan.period}</span>
              </div>
              <a
                href={plan.name === 'Enterprise' ? '/contact' : '/app/login'}
                className={`block text-center px-6 py-3 rounded-xl font-semibold text-sm no-underline transition-all ${
                  plan.popular
                    ? 'bg-gradient-to-r from-primary to-primary-light text-white hover:shadow-lg hover:shadow-primary/25'
                    : 'bg-white/5 border border-border text-text hover:bg-white/10'
                }`}
              >
                {plan.cta}
              </a>
              <ul className="mt-6 space-y-3 list-none p-0 m-0">
                {plan.features.map(f => (
                  <li key={f.text} className="flex items-center gap-2.5 text-sm">
                    {f.included ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <X className="w-4 h-4 text-text-muted/30 flex-shrink-0" />
                    )}
                    <span className={f.included ? 'text-text-muted' : 'text-text-muted/40'}>{f.text}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6 bg-surface-light/30 border-t border-border">
        <div className="max-w-3xl mx-auto">
          <motion.h2 {...fadeUp} className="text-3xl font-bold text-text text-center mb-12">Frequently Asked Questions</motion.h2>
          <div className="space-y-4">
            {FAQS.map((faq, i) => (
              <motion.div key={i} {...fadeUp} transition={{ delay: i * 0.05 }} className="p-5 rounded-xl bg-surface-card border border-border">
                <h4 className="text-base font-semibold text-text mb-2">{faq.q}</h4>
                <p className="text-sm text-text-muted leading-relaxed">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
