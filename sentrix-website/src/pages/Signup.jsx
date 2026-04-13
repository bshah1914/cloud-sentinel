import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User, Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight, Shield, Building2,
  Phone, Cloud, CheckCircle2, ArrowLeft, Zap
} from 'lucide-react';

export default function Signup() {
  const [form, setForm] = useState({ name: '', email: '', company: '', phone: '', cloud_provider: 'aws', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          company: form.company,
          phone: form.phone,
          cloud_provider: form.cloud_provider,
          password: form.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Signup failed');
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const set = (key) => (e) => setForm(p => ({ ...p, [key]: e.target.value }));

  if (success) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md text-center"
        >
          <div className="rounded-2xl p-10 bg-surface-light/50 backdrop-blur-xl border border-emerald-500/20">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-text mb-3">Account Created!</h2>
            <p className="text-text-muted mb-2">Your account is <span className="text-amber-400 font-semibold">pending admin approval</span>.</p>
            <p className="text-sm text-text-muted mb-8">You'll be able to login once an administrator approves your account. We'll notify you at <span className="text-text font-medium">{form.email}</span>.</p>
            <div className="flex flex-col gap-3">
              <Link to="/" className="px-6 py-3 bg-gradient-to-r from-primary to-primary-light text-white font-semibold rounded-xl no-underline text-center">
                Back to Home
              </Link>
              <a href="/app/login" className="px-6 py-3 bg-white/5 border border-border text-text-muted font-medium rounded-xl no-underline text-center hover:bg-white/10 transition-all">
                Go to Login
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <motion.div className="absolute w-[600px] h-[600px] rounded-full opacity-[0.07]"
          style={{ background: 'radial-gradient(circle, #6366f1, transparent 70%)', left: '10%', top: '20%' }}
          animate={{ x: [0, 80, -40, 0], y: [0, -60, 40, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.div className="absolute w-[500px] h-[500px] rounded-full opacity-[0.05]"
          style={{ background: 'radial-gradient(circle, #10b981, transparent 70%)', right: '5%', bottom: '10%' }}
          animate={{ x: [0, -60, 30, 0], y: [0, 40, -30, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-lg relative z-10"
      >
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-primary-light transition-colors mb-6 no-underline">
          <ArrowLeft className="w-4 h-4" /> Back to website
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Shield className="w-7 h-7 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-black text-text">Create Your Account</h1>
          <p className="text-text-muted text-sm mt-2">Start securing your cloud infrastructure today</p>
        </div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl p-8 bg-surface-light/50 backdrop-blur-xl border border-border shadow-2xl shadow-black/20"
        >
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-5 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-xs text-text-muted mb-1.5 font-medium uppercase tracking-wider">Full Name *</label>
              <div className="relative group">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-primary-light transition-colors" />
                <input type="text" value={form.name} onChange={set('name')} placeholder="John Doe" required
                  className="w-full bg-surface/80 border border-border rounded-xl pl-11 pr-4 py-3 text-sm text-text placeholder:text-text-muted/30 focus:outline-none focus:border-primary/50 transition-all" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs text-text-muted mb-1.5 font-medium uppercase tracking-wider">Work Email *</label>
              <div className="relative group">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-primary-light transition-colors" />
                <input type="email" value={form.email} onChange={set('email')} placeholder="john@company.com" required
                  className="w-full bg-surface/80 border border-border rounded-xl pl-11 pr-4 py-3 text-sm text-text placeholder:text-text-muted/30 focus:outline-none focus:border-primary/50 transition-all" />
              </div>
            </div>

            {/* Company + Phone */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-text-muted mb-1.5 font-medium uppercase tracking-wider">Company</label>
                <div className="relative group">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-primary-light transition-colors" />
                  <input type="text" value={form.company} onChange={set('company')} placeholder="Acme Inc."
                    className="w-full bg-surface/80 border border-border rounded-xl pl-11 pr-4 py-3 text-sm text-text placeholder:text-text-muted/30 focus:outline-none focus:border-primary/50 transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1.5 font-medium uppercase tracking-wider">Phone</label>
                <div className="relative group">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-primary-light transition-colors" />
                  <input type="tel" value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210"
                    className="w-full bg-surface/80 border border-border rounded-xl pl-11 pr-4 py-3 text-sm text-text placeholder:text-text-muted/30 focus:outline-none focus:border-primary/50 transition-all" />
                </div>
              </div>
            </div>

            {/* Cloud Provider */}
            <div>
              <label className="block text-xs text-text-muted mb-1.5 font-medium uppercase tracking-wider">Primary Cloud Provider</label>
              <div className="relative group">
                <Cloud className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-primary-light transition-colors" />
                <select value={form.cloud_provider} onChange={set('cloud_provider')}
                  className="w-full bg-surface/80 border border-border rounded-xl pl-11 pr-4 py-3 text-sm text-text focus:outline-none focus:border-primary/50 transition-all appearance-none">
                  <option value="aws">Amazon Web Services (AWS)</option>
                  <option value="azure">Microsoft Azure</option>
                  <option value="gcp">Google Cloud Platform (GCP)</option>
                  <option value="multi">Multi-Cloud</option>
                </select>
              </div>
            </div>

            {/* Password */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-text-muted mb-1.5 font-medium uppercase tracking-wider">Password *</label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-primary-light transition-colors" />
                  <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={set('password')} placeholder="Min 6 chars" required
                    className="w-full bg-surface/80 border border-border rounded-xl pl-11 pr-4 py-3 text-sm text-text placeholder:text-text-muted/30 focus:outline-none focus:border-primary/50 transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1.5 font-medium uppercase tracking-wider">Confirm *</label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-primary-light transition-colors" />
                  <input type={showPassword ? 'text' : 'password'} value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="Repeat" required
                    className="w-full bg-surface/80 border border-border rounded-xl pl-11 pr-10 py-3 text-sm text-text placeholder:text-text-muted/30 focus:outline-none focus:border-primary/50 transition-all" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Submit */}
            <motion.button type="submit" disabled={loading || !form.name || !form.email || !form.password || !form.confirmPassword}
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-primary-light disabled:opacity-50 rounded-xl py-3.5 text-sm font-semibold text-white transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30 mt-2">
              {loading ? (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
              ) : (<>Create Account <ArrowRight className="w-4 h-4" /></>)}
            </motion.button>
          </form>

          {/* Login link */}
          <div className="mt-6 pt-5 border-t border-border/50 text-center">
            <p className="text-sm text-text-muted">
              Already have an account? <a href="/app/login" className="text-primary-light font-medium hover:underline no-underline">Sign In</a>
            </p>
          </div>
        </motion.div>

        <p className="text-center text-xs text-text-muted/50 mt-6">
          By signing up you agree to our Terms of Service and Privacy Policy
        </p>
      </motion.div>
    </div>
  );
}
