import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Shield, AlertTriangle, TrendingUp, Cpu, MemoryStick } from 'lucide-react';

function generateData() {
  return Array.from({ length: 20 }, () => Math.random() * 60 + 20);
}

export default function LiveDashboard() {
  const [cpuData, setCpuData] = useState(generateData);
  const [memData, setMemData] = useState(generateData);
  const [threats, setThreats] = useState(12847);
  const [scans, setScans] = useState(384);

  useEffect(() => {
    const iv = setInterval(() => {
      setCpuData(prev => [...prev.slice(1), Math.random() * 60 + 20]);
      setMemData(prev => [...prev.slice(1), Math.random() * 50 + 30]);
      setThreats(t => t + Math.floor(Math.random() * 5));
      setScans(s => s + (Math.random() > 0.7 ? 1 : 0));
    }, 1500);
    return () => clearInterval(iv);
  }, []);

  const sparkline = (data, color) => {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const points = data
      .map((v, i) => `${(i / (data.length - 1)) * 100},${100 - ((v - min) / range) * 100}`)
      .join(' ');
    return (
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-12">
        <defs>
          <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          points={points}
          vectorEffect="non-scaling-stroke"
        />
        <polygon
          fill={`url(#grad-${color.replace('#', '')})`}
          points={`0,100 ${points} 100,100`}
        />
      </svg>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      className="relative rounded-2xl bg-surface-card border border-border overflow-hidden shadow-2xl shadow-primary/10"
    >
      {/* Browser bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-surface-light/50">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
        </div>
        <div className="ml-3 px-3 py-1 rounded-md bg-surface text-[10px] text-text-muted font-mono flex-1 max-w-xs">
          sentrix.cloudtrio.in/dashboard
        </div>
        <div className="flex items-center gap-1 text-[10px] text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          LIVE
        </div>
      </div>

      {/* Dashboard content */}
      <div className="p-5 space-y-4">
        {/* Top stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Threats Blocked', value: threats.toLocaleString(), icon: Shield, color: '#ef4444' },
            { label: 'Active Scans', value: scans, icon: Activity, color: '#06b6d4' },
            { label: 'Compliance', value: '95%', icon: TrendingUp, color: '#10b981' },
            { label: 'Findings', value: '247', icon: AlertTriangle, color: '#f59e0b' },
          ].map(s => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-3 rounded-lg bg-surface/60 border border-border"
            >
              <div className="flex items-center gap-2 mb-1">
                <s.icon className="w-3.5 h-3.5" style={{ color: s.color }} />
                <span className="text-[9px] uppercase tracking-wider text-text-muted">{s.label}</span>
              </div>
              <p className="text-lg font-bold text-text">{s.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-surface/60 border border-border">
            <div className="flex items-center gap-2 mb-1">
              <Cpu className="w-3 h-3 text-cyan-400" />
              <span className="text-[10px] text-text-muted">CPU Usage</span>
              <span className="ml-auto text-[10px] font-bold text-cyan-400">{Math.round(cpuData[cpuData.length - 1])}%</span>
            </div>
            {sparkline(cpuData, '#06b6d4')}
          </div>
          <div className="p-3 rounded-lg bg-surface/60 border border-border">
            <div className="flex items-center gap-2 mb-1">
              <MemoryStick className="w-3 h-3 text-violet-400" />
              <span className="text-[10px] text-text-muted">Memory</span>
              <span className="ml-auto text-[10px] font-bold text-violet-400">{Math.round(memData[memData.length - 1])}%</span>
            </div>
            {sparkline(memData, '#8b5cf6')}
          </div>
        </div>

        {/* Activity feed */}
        <div className="p-3 rounded-lg bg-surface/60 border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-text-muted uppercase tracking-wider">Live Activity</span>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" /> Streaming
            </span>
          </div>
          <div className="space-y-1.5">
            {[
              { time: 'now', text: 'Blocked SQL injection from 203.0.113.42', color: '#ef4444' },
              { time: '2s', text: 'Scan completed: prod-aws-account', color: '#10b981' },
              { time: '5s', text: 'Auto-remediated: open S3 bucket', color: '#06b6d4' },
            ].map((a, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 text-[10px]"
              >
                <span className="w-1 h-1 rounded-full" style={{ background: a.color }} />
                <span className="text-text-muted font-mono w-6">{a.time}</span>
                <span className="text-text/80">{a.text}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
