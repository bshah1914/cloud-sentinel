import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Wifi, WifiOff, LogOut, Bell, ChevronDown, Sun, Moon } from 'lucide-react';
import { getHealth } from '../api';
import { useAuth } from '../auth';
import { useTheme } from '../theme';

const PROVIDER_COLORS = {
  aws: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20', label: 'AWS' },
  azure: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', label: 'Azure' },
  gcp: { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/20', label: 'GCP' },
};

const PAGE_TITLES = {
  '/': 'Overview',
  '/dashboard': 'Dashboard',
  '/accounts': 'Accounts',
  '/scan': 'Scans',
  '/audit': 'Security Audit',
  '/resources': 'Resources',
  '/iam': 'IAM Report',
  '/security-groups': 'Security Groups',
  '/users': 'User Management',
  '/report': 'Comprehensive Report',
  '/compliance': 'Cloud Compliance',
};

export default function Topbar({ account, provider, onAccountChange, accounts }) {
  const { user, logout } = useAuth();
  const { theme, toggle: toggleTheme } = useTheme();
  const location = useLocation();
  const [health, setHealth] = useState(null);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    getHealth().then(setHealth).catch(() => setHealth(null));
    const t = setInterval(() => setTime(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const providerStyle = PROVIDER_COLORS[provider] || PROVIDER_COLORS.aws;
  const pageTitle = PAGE_TITLES[location.pathname] || 'CloudLunar';

  return (
    <header className="h-16 glass-strong border-b border-border/30 flex items-center justify-between px-6 sticky top-0 z-40">
      {/* Left */}
      <div className="flex items-center gap-5">
        <div>
          <h2 className="text-sm font-semibold text-text">{pageTitle}</h2>
          <p className="text-[10px] text-text-muted">Multi-Cloud Security Platform</p>
        </div>

        <div className="w-px h-8 bg-border/50" />

        <div className="relative">
          <select value={account} onChange={(e) => onAccountChange(e.target.value)}
            className="appearance-none bg-surface-lighter/50 border border-border/50 rounded-lg px-3 py-2 pr-8 text-xs text-text focus:outline-none focus:border-primary/50 transition-colors cursor-pointer hover:bg-surface-lighter/70">
            {accounts.map((a) => (
              <option key={`${a.provider}-${a.name}`} value={a.name}>
                [{(a.provider || 'aws').toUpperCase()}] {a.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-text-muted pointer-events-none" />
        </div>

        {provider && (
          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider border ${providerStyle.bg} ${providerStyle.text} ${providerStyle.border}`}>
            {providerStyle.label}
          </span>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-1.5 text-[11px] text-text-muted bg-surface-lighter/30 rounded-lg px-2.5 py-1.5">
          <Clock className="w-3 h-3" />
          {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {health ? (
            <div className="flex items-center gap-1.5 text-[11px] bg-emerald-500/8 border border-emerald-500/15 rounded-lg px-2.5 py-1.5">
              <span className="relative">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 block" />
                <span className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping opacity-40" />
              </span>
              <span className="text-emerald-400 font-medium">Connected</span>
              <span className="text-text-muted/60">v{health.version}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[11px] bg-red-500/8 border border-red-500/15 rounded-lg px-2.5 py-1.5">
              <WifiOff className="w-3 h-3 text-red-400" />
              <span className="text-red-400 font-medium">Offline</span>
            </div>
          )}
        </motion.div>

        {/* Theme toggle */}
        <button onClick={toggleTheme}
          className="p-2 rounded-lg text-text-muted hover:text-text hover:bg-white/[0.03] transition-all"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
          <motion.div key={theme} initial={{ rotate: -30, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} transition={{ duration: 0.2 }}>
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </motion.div>
        </button>

        <button className="relative p-2 rounded-lg text-text-muted hover:text-text hover:bg-white/[0.03] transition-all">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary dot-pulse" />
        </button>

        <div className="w-px h-8 bg-border/50" />

        {user && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center border border-primary/10">
                <span className="text-xs font-bold text-primary-light uppercase">{user.username.charAt(0)}</span>
              </div>
              <div className="hidden md:block text-xs">
                <p className="text-text font-medium">{user.username}</p>
                <p className="text-text-muted capitalize text-[10px]">{user.role}</p>
              </div>
            </div>
            <button onClick={logout} className="p-2 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/8 transition-all" title="Logout">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
