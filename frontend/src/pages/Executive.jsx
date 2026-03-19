import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, AreaChart, Area, CartesianGrid
} from 'recharts';
import {
  Shield, TrendingUp, AlertTriangle, Server, Users, Zap,
  Activity, Target, BarChart3, Clock, CheckCircle2, XCircle,
  ArrowUpRight, ArrowDownRight, Eye, Layers
} from 'lucide-react';
import { api } from '../api';
import Loader from '../components/Loader';

const TIP = {
  background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: '12px', color: '#f1f5f9', fontSize: '11px',
  boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
};

function Card3D({ children, className = '', delay = 0, glow = '' }) {
  const ref = useRef(null);
  const [tx, setTx] = useState('perspective(800px) rotateX(0) rotateY(0)');
  const [gp, setGp] = useState({ x: 50, y: 50 });

  const onMove = useCallback(e => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    setTx(`perspective(800px) rotateX(${(0.5 - y) * 6}deg) rotateY(${(x - 0.5) * 8}deg) scale3d(1.01,1.01,1.01)`);
    setGp({ x: x * 100, y: y * 100 });
  }, []);

  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }} onMouseMove={onMove}
      onMouseLeave={() => { setTx('perspective(800px) rotateX(0) rotateY(0)'); setGp({ x: 50, y: 50 }); }}
      className={`relative rounded-2xl overflow-hidden ${className}`}
      style={{ transform: tx, transition: 'transform 0.15s ease-out', transformStyle: 'preserve-3d' }}>
      <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity pointer-events-none"
        style={{ background: `radial-gradient(300px at ${gp.x}% ${gp.y}%, ${glow || 'rgba(124,58,237,0.06)'}, transparent 60%)` }} />
      <div className="relative bg-surface-light/80 backdrop-blur-xl border border-border/30 rounded-2xl p-5 h-full
        shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.04)]">
        {children}
      </div>
    </motion.div>
  );
}

function RiskGauge({ level, score }) {
  const colors = { CRITICAL: '#ef4444', HIGH: '#f97316', MEDIUM: '#f59e0b', LOW: '#10b981' };
  const color = colors[level] || '#10b981';
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center">
      <svg width="140" height="140" style={{ transform: 'rotateX(8deg)' }}>
        <circle cx="70" cy="70" r="54" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="12" />
        {[...Array(24)].map((_, i) => {
          const a = (i * 15 - 90) * (Math.PI / 180);
          return <line key={i} x1={70 + 48 * Math.cos(a)} y1={70 + 48 * Math.sin(a)}
            x2={70 + 52 * Math.cos(a)} y2={70 + 52 * Math.sin(a)} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />;
        })}
        <motion.circle cx="70" cy="70" r="54" fill="none" stroke={color} strokeWidth="12"
          strokeLinecap="round" strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ delay: 0.5, duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          style={{ transform: 'rotate(-90deg)', transformOrigin: 'center', filter: `drop-shadow(0 0 8px ${color}50)` }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black" style={{ color }}>{score}</span>
        <span className="text-[9px] font-bold tracking-[3px] mt-0.5" style={{ color: color + 'cc' }}>{level}</span>
      </div>
    </div>
  );
}

function BigStat({ icon: Icon, label, value, sub, color = 'violet', delay = 0 }) {
  const c = {
    violet: 'from-violet-600/20 to-violet-900/10 text-violet-400 border-violet-500/15 shadow-violet-500/5',
    cyan: 'from-cyan-600/20 to-cyan-900/10 text-cyan-400 border-cyan-500/15 shadow-cyan-500/5',
    red: 'from-red-600/20 to-red-900/10 text-red-400 border-red-500/15 shadow-red-500/5',
    amber: 'from-amber-600/20 to-amber-900/10 text-amber-400 border-amber-500/15 shadow-amber-500/5',
    emerald: 'from-emerald-600/20 to-emerald-900/10 text-emerald-400 border-emerald-500/15 shadow-emerald-500/5',
    blue: 'from-blue-600/20 to-blue-900/10 text-blue-400 border-blue-500/15 shadow-blue-500/5',
  }[color];

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      whileHover={{ y: -3, scale: 1.02 }}
      className={`bg-gradient-to-br ${c} rounded-2xl p-5 border shadow-lg cursor-default`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl bg-surface/60 flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
        <ArrowUpRight className="w-4 h-4 opacity-40" />
      </div>
      <p className="text-3xl font-black tabular-nums">{typeof value === 'number' ? value.toLocaleString() : value}</p>
      <p className="text-[10px] text-text-muted uppercase tracking-widest mt-1">{label}</p>
      {sub && <p className="text-[10px] text-text-muted/70 mt-0.5">{sub}</p>}
    </motion.div>
  );
}

export default function Executive() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/v2/executive-dashboard')
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader text="Loading executive dashboard..." />;
  if (!data) return <div className="text-center py-20 text-text-muted">No data available</div>;

  const { summary, severity_breakdown, category_breakdown, accounts, recent_scans } = data;

  const sevPie = Object.entries(severity_breakdown || {}).map(([k, v]) => ({ name: k, value: v })).filter(d => d.value > 0);
  const sevColors = { CRITICAL: '#ef4444', HIGH: '#f97316', MEDIUM: '#f59e0b', LOW: '#eab308' };

  const catBar = Object.entries(category_breakdown || {}).map(([k, v]) => ({
    name: k.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()), value: v
  })).sort((a, b) => b.value - a.value).slice(0, 8);

  const trendData = (recent_scans || []).reverse().map((s, i) => ({
    scan: `Scan ${i + 1}`, score: s.score, findings: s.findings,
  }));

  const radarData = [
    { axis: 'Network', value: Math.max(0, 100 - (severity_breakdown?.HIGH || 0) * 2) },
    { axis: 'Identity', value: summary.avg_security_score },
    { axis: 'Data', value: Math.max(0, 100 - (severity_breakdown?.CRITICAL || 0) * 10) },
    { axis: 'Compliance', value: Math.min(100, summary.avg_security_score + 20) },
    { axis: 'Monitoring', value: 60 },
    { axis: 'Cost', value: 75 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div whileHover={{ rotateY: 180 }} transition={{ duration: 0.6 }}
            className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20"
            style={{ transformStyle: 'preserve-3d' }}>
            <Eye className="w-5.5 h-5.5 text-text" />
          </motion.div>
          <div>
            <h1 className="text-2xl font-bold text-text">
              Executive Dashboard
            </h1>
            <p className="text-text-muted/70 text-xs">C-Level Security Overview</p>
          </div>
        </div>
        <div className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border ${
          summary.risk_level === 'CRITICAL' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
          summary.risk_level === 'HIGH' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
          summary.risk_level === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
          'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
        }`}>
          Risk Level: {summary.risk_level}
        </div>
      </motion.div>

      {/* Big Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <BigStat icon={Server} label="Cloud Accounts" value={summary.total_accounts} color="violet" delay={0} />
        <BigStat icon={Layers} label="Total Resources" value={summary.total_resources} color="cyan" delay={0.03} />
        <BigStat icon={Shield} label="Security Score" value={summary.avg_security_score} sub="out of 100" color="emerald" delay={0.06} />
        <BigStat icon={AlertTriangle} label="Open Findings" value={summary.total_findings} color="amber" delay={0.09} />
        <BigStat icon={Zap} label="Critical" value={summary.critical_findings} color="red" delay={0.12} />
        <BigStat icon={Activity} label="Total Scans" value={summary.total_scans} color="blue" delay={0.15} />
      </div>

      {/* Risk Gauge + Radar + Severity Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card3D delay={0.1} glow="rgba(239,68,68,0.08)">
          <h3 className="text-[10px] font-semibold text-text-muted uppercase tracking-widest mb-4 text-center">
            Infrastructure Risk Level
          </h3>
          <div className="flex justify-center">
            <RiskGauge level={summary.risk_level} score={summary.avg_security_score} />
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {Object.entries(severity_breakdown || {}).map(([sev, count]) => (
              <div key={sev} className="flex items-center justify-between bg-surface/40 rounded-lg px-3 py-2">
                <span className="text-[10px] text-text-muted/70">{sev}</span>
                <span className={`text-xs font-bold ${
                  sev === 'CRITICAL' ? 'text-red-400' : sev === 'HIGH' ? 'text-orange-400' :
                  sev === 'MEDIUM' ? 'text-amber-400' : 'text-yellow-400'
                }`}>{count}</span>
              </div>
            ))}
          </div>
        </Card3D>

        <Card3D delay={0.15} glow="rgba(124,58,237,0.08)">
          <h3 className="text-[10px] font-semibold text-text-muted uppercase tracking-widest mb-2">Security Posture Radar</h3>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.05)" />
              <PolarAngleAxis dataKey="axis" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar dataKey="value" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.15} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </Card3D>

        <Card3D delay={0.2} glow="rgba(245,158,11,0.08)">
          <h3 className="text-[10px] font-semibold text-text-muted uppercase tracking-widest mb-2">Severity Distribution</h3>
          {sevPie.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={sevPie} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                    {sevPie.map(e => <Cell key={e.name} fill={sevColors[e.name] || '#94a3b8'} stroke="transparent" />)}
                  </Pie>
                  <Tooltip contentStyle={TIP} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-3 justify-center mt-1">
                {sevPie.map(d => (
                  <div key={d.name} className="flex items-center gap-1.5 text-[10px]">
                    <span className="w-2 h-2 rounded-full" style={{ background: sevColors[d.name] }} />
                    <span className="text-text-muted">{d.name}</span>
                    <span className="text-text font-bold">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-48 text-text-muted/70">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mr-3" /> No findings
            </div>
          )}
        </Card3D>
      </div>

      {/* Category Breakdown + Score Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card3D delay={0.25} glow="rgba(6,182,212,0.06)">
          <h3 className="text-[10px] font-semibold text-text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
            <BarChart3 className="w-3.5 h-3.5 text-cyan-400" /> Findings by Category
          </h3>
          {catBar.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={catBar} layout="vertical" barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} width={100} />
                <Tooltip contentStyle={TIP} />
                <Bar dataKey="value" fill="#7c3aed" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="h-64 flex items-center justify-center text-text-muted/70">No data</div>}
        </Card3D>

        <Card3D delay={0.3} glow="rgba(16,185,129,0.06)">
          <h3 className="text-[10px] font-semibold text-text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Security Score Trend
          </h3>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="scan" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} />
                <Tooltip contentStyle={TIP} />
                <Area type="monotone" dataKey="score" stroke="#7c3aed" fill="url(#scoreFill)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-text-muted/70">
              <Clock className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-xs">Run scans to see trends</p>
            </div>
          )}
        </Card3D>
      </div>

      {/* Cloud Accounts Table */}
      {accounts && accounts.length > 0 && (
        <Card3D delay={0.35} glow="rgba(99,102,241,0.06)">
          <h3 className="text-[10px] font-semibold text-text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
            <Server className="w-3.5 h-3.5 text-violet-400" /> Cloud Accounts ({accounts.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-text-muted border-b border-border/30">
                  <th className="pb-3 text-left text-[10px] uppercase tracking-wider">Account</th>
                  <th className="pb-3 text-left text-[10px] uppercase tracking-wider">Provider</th>
                  <th className="pb-3 text-center text-[10px] uppercase tracking-wider">Score</th>
                  <th className="pb-3 text-center text-[10px] uppercase tracking-wider">Resources</th>
                  <th className="pb-3 text-right text-[10px] uppercase tracking-wider">Last Scan</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((a, i) => (
                  <motion.tr key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 + i * 0.03 }}
                    className="border-b border-white/[0.03] hover:bg-surface/30">
                    <td className="py-3 font-medium text-text">{a.name}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                        a.provider === 'aws' ? 'bg-orange-500/10 text-orange-400' :
                        a.provider === 'azure' ? 'bg-blue-500/10 text-blue-400' : 'bg-red-500/10 text-red-400'
                      }`}>{a.provider?.toUpperCase()}</span>
                    </td>
                    <td className="py-3 text-center">
                      <span className={`font-bold ${a.score >= 80 ? 'text-emerald-400' : a.score >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                        {a.score}/100
                      </span>
                    </td>
                    <td className="py-3 text-center text-text">{a.resources?.toLocaleString()}</td>
                    <td className="py-3 text-right text-text-muted/70">{a.last_scan ? new Date(a.last_scan).toLocaleDateString() : 'Never'}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card3D>
      )}
    </div>
  );
}
