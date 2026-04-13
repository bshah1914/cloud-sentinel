import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, MapPin, Phone, Send, CheckCircle2, MessageSquare, Headphones, Clock } from 'lucide-react';

const fadeUp = { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6 } };

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', company: '', subject: 'general', message: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="pt-24">
      {/* Hero */}
      <section className="py-20 px-6 text-center">
        <motion.div {...fadeUp}>
          <h1 className="text-4xl md:text-6xl font-black text-text mb-6">
            Get in{' '}
            <span className="bg-gradient-to-r from-primary-light to-accent-light bg-clip-text text-transparent">Touch</span>
          </h1>
          <p className="text-lg text-text-muted max-w-2xl mx-auto">
            Have questions about CloudSentrix? Want a demo? We'd love to hear from you.
          </p>
        </motion.div>
      </section>

      {/* Contact cards */}
      <section className="px-6 pb-12">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Mail, title: 'Email Us', detail: 'info@cloudtrio.in', sub: 'We reply within 24 hours' },
            { icon: Headphones, title: 'Live Support', detail: 'Available for Pro & Enterprise', sub: 'Mon-Fri, 9AM-6PM IST' },
            { icon: MapPin, title: 'Our Office', detail: 'Ahmedabad, India', sub: 'CloudTrio Technologies' },
          ].map((c, i) => (
            <motion.div key={c.title} {...fadeUp} transition={{ delay: i * 0.1 }} className="p-6 rounded-xl bg-surface-card border border-border text-center">
              <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center mx-auto mb-4">
                <c.icon className="w-6 h-6 text-primary-light" />
              </div>
              <h3 className="text-base font-semibold text-text mb-1">{c.title}</h3>
              <p className="text-sm text-text">{c.detail}</p>
              <p className="text-xs text-text-muted mt-1">{c.sub}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Form */}
      <section className="py-20 px-6 bg-surface-light/30 border-t border-border">
        <div className="max-w-2xl mx-auto">
          <motion.div {...fadeUp}>
            {submitted ? (
              <div className="text-center p-12 rounded-2xl bg-surface-card border border-emerald-500/20">
                <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-text mb-2">Message Sent!</h2>
                <p className="text-text-muted">Thank you for reaching out. We'll get back to you within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <h2 className="text-2xl font-bold text-text mb-2">Send Us a Message</h2>
                <p className="text-text-muted text-sm mb-6">Fill out the form below and we'll get back to you shortly.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-text-muted mb-1.5 block">Full Name *</label>
                    <input
                      required
                      value={form.name}
                      onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                      className="w-full px-4 py-3 bg-surface-card border border-border rounded-xl text-sm text-text focus:outline-none focus:border-primary/40 placeholder:text-text-muted/40"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted mb-1.5 block">Work Email *</label>
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                      className="w-full px-4 py-3 bg-surface-card border border-border rounded-xl text-sm text-text focus:outline-none focus:border-primary/40 placeholder:text-text-muted/40"
                      placeholder="john@company.com"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-text-muted mb-1.5 block">Company</label>
                    <input
                      value={form.company}
                      onChange={e => setForm(p => ({ ...p, company: e.target.value }))}
                      className="w-full px-4 py-3 bg-surface-card border border-border rounded-xl text-sm text-text focus:outline-none focus:border-primary/40 placeholder:text-text-muted/40"
                      placeholder="Acme Inc."
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted mb-1.5 block">Subject</label>
                    <select
                      value={form.subject}
                      onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                      className="w-full px-4 py-3 bg-surface-card border border-border rounded-xl text-sm text-text focus:outline-none focus:border-primary/40"
                    >
                      <option value="general">General Inquiry</option>
                      <option value="demo">Request a Demo</option>
                      <option value="sales">Sales / Enterprise</option>
                      <option value="support">Technical Support</option>
                      <option value="partnership">Partnership</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-text-muted mb-1.5 block">Message *</label>
                  <textarea
                    required
                    rows="5"
                    value={form.message}
                    onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                    className="w-full px-4 py-3 bg-surface-card border border-border rounded-xl text-sm text-text focus:outline-none focus:border-primary/40 placeholder:text-text-muted/40 resize-none"
                    placeholder="Tell us how we can help..."
                  />
                </div>
                <button type="submit" className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-primary to-primary-light text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all">
                  <Send className="w-4 h-4" /> Send Message
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  );
}
