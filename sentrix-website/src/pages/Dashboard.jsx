import { useAuth } from '../auth';
import { Navigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Shield, Activity, ClipboardCheck, Eye, Wrench, Brain,
  Server, AlertTriangle, TrendingUp, LogOut, Cpu, Terminal,
  GitBranch, BellRing, Lock, BarChart3, Globe, Users
} from 'lucide-react';

const MODULES = [
  { icon: BarChart3, title: 'Overview', desc: 'Multi-cloud security overview', color: '#6366f1', path: '/dashboard' },
  { icon: Shield, title: 'Security Audit', desc: 'Scan for misconfigurations', color: '#10b981', path: '/dashboard' },
  { icon: ClipboardCheck, title: 'Compliance', desc: '10+ frameworks', color: '#06b6d4', path: '/dashboard' },
  { icon: Eye, title: 'Threat Detection', desc: 'MITRE ATT&CK mapped', color: '#f59e0b', path: '/dashboard' },
  { icon: Wrench, title: 'Remediation', desc: 'Auto-fix with approval', color: '#ec4899', path: '/dashboard' },
  { icon: Cpu, title: 'Infrastructure', desc: 'CPU, memory, disk metrics', color: '#8b5cf6', path: '/dashboard' },
  { icon: Terminal, title: 'Log Explorer', desc: 'Search & filter logs', color: '#14b8a6', path: '/dashboard' },
  { icon: GitBranch, title: 'Tracing', desc: 'Distributed traces', color: '#3b82f6', path: '/dashboard' },
  { icon: BellRing, title: 'Alerts', desc: 'Smart alert rules', color: '#f97316', path: '/dashboard' },
  { icon: Brain, title: 'AI Analysis', desc: 'Anomaly detection & forecast', color: '#ef4444', path: '/dashboard' },
  { icon: Lock, title: 'Security Center', desc: 'Hardening & API keys', color: '#10b981', path: '/dashboard' },
  { icon: Users, title: 'User Management', desc: 'RBAC & team management', color: '#6366f1', path: '/dashboard' },
];

export default function Dashboard() {
  const { user, logout } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-surface pt-24 px-6 pb-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-bold text-text"
            >
              Welcome, <span className="bg-gradient-to-r from-primary-light to-accent-light bg-clip-text text-transparent">{user.username}</span>
            </motion.h1>
            <p className="text-sm text-text-muted mt-1">
              Role: {user.role || 'admin'} &bull; Organization: {user.org_name || 'CloudSentrix'} &bull; Type: {user.user_type || 'owner'}
            </p>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-light border border-border text-sm text-text-muted hover:text-red-400 hover:border-red-500/30 transition-all"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Security Score', value: '92/100', icon: Shield, color: '#10b981' },
            { label: 'Active Threats', value: '3', icon: AlertTriangle, color: '#ef4444' },
            { label: 'Compliance', value: '97%', icon: TrendingUp, color: '#06b6d4' },
            { label: 'Resources', value: '1,284', icon: Server, color: '#8b5cf6' },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-5 rounded-2xl bg-surface-card border border-border"
            >
              <s.icon className="w-5 h-5 mb-3" style={{ color: s.color }} />
              <p className="text-2xl font-bold text-text">{s.value}</p>
              <p className="text-xs text-text-muted mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Modules Grid */}
        <h2 className="text-xl font-bold text-text mb-4">Platform Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {MODULES.map((m, i) => (
            <motion.div
              key={m.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.04 }}
              whileHover={{ y: -4 }}
              className="group p-5 rounded-2xl bg-surface-card border border-border hover:border-primary/30 cursor-pointer transition-all"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: `${m.color}15` }}>
                <m.icon className="w-5 h-5" style={{ color: m.color }} />
              </div>
              <h3 className="text-sm font-semibold text-text mb-1">{m.title}</h3>
              <p className="text-xs text-text-muted">{m.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Info */}
        <div className="mt-10 p-6 rounded-2xl bg-gradient-to-r from-primary/10 to-accent/5 border border-primary/20 text-center">
          <p className="text-sm text-text-muted">
            This is a preview dashboard. For the full experience with live cloud data, deploy the complete CloudSentrix backend.
          </p>
        </div>
      </div>
    </div>
  );
}
