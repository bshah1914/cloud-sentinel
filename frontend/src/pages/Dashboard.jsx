import { useState, useEffect, useRef, useCallback } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, AreaChart, Area, RadarChart,
  Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import {
  Server, Shield, Globe, Database, CloudLightning, Layers,
  AlertTriangle, MapPin, ScanLine, Plus, Users, Lock, Unlock,
  HardDrive, Network, Camera, Activity, CheckCircle2, XCircle,
  ChevronDown, ChevronUp, Download, FileText, Zap, Eye, TrendingUp,
  BarChart3, PieChart as PieChartIcon, Cpu, Box
} from 'lucide-react';
import { getDashboard, exportDashboard } from '../api';
import { useToast } from '../components/Toast';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';

/* ── 3D Tilt Card ── */
function Card3D({ children, className = '', delay = 0, glow = '', span = '' }) {
  const ref = useRef(null);
  const [transform, setTransform] = useState('perspective(800px) rotateX(0deg) rotateY(0deg)');
  const [glowPos, setGlowPos] = useState({ x: 50, y: 50 });

  const handleMove = useCallback((e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const rotateY = (x - 0.5) * 12;
    const rotateX = (0.5 - y) * 8;
    setTransform(`perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02,1.02,1.02)`);
    setGlowPos({ x: x * 100, y: y * 100 });
  }, []);

  const handleLeave = useCallback(() => {
    setTransform('perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)');
    setGlowPos({ x: 50, y: 50 });
  }, []);

  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 20, rotateX: -5 }} animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      onMouseMove={handleMove} onMouseLeave={handleLeave}
      className={`relative rounded-2xl overflow-hidden ${span} ${className}`}
      style={{ transform, transition: 'transform 0.15s ease-out', transformStyle: 'preserve-3d' }}>
      {/* Glow follow */}
      <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none z-0"
        style={{ background: `radial-gradient(400px circle at ${glowPos.x}% ${glowPos.y}%, ${glow || 'rgba(124,58,237,0.08)'}, transparent 60%)` }} />
      {/* Glass surface */}
      <div className="relative z-10 bg-surface-light/80 backdrop-blur-xl border border-border/30 rounded-2xl p-5 h-full
        shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.04)]">
        {children}
      </div>
    </motion.div>
  );
}

/* ── 3D Stat Cube ── */
function StatCube({ icon: Icon, label, value, color, delay = 0 }) {
  const colors = {
    primary: { bg: 'from-violet-600/20 to-violet-900/10', text: 'text-violet-400', glow: 'shadow-violet-500/10', icon: 'bg-violet-500/15', border: 'border-violet-500/20' },
    accent: { bg: 'from-cyan-600/20 to-cyan-900/10', text: 'text-cyan-400', glow: 'shadow-cyan-500/10', icon: 'bg-cyan-500/15', border: 'border-cyan-500/20' },
    warning: { bg: 'from-amber-600/20 to-amber-900/10', text: 'text-amber-400', glow: 'shadow-amber-500/10', icon: 'bg-amber-500/15', border: 'border-amber-500/20' },
    success: { bg: 'from-emerald-600/20 to-emerald-900/10', text: 'text-emerald-400', glow: 'shadow-emerald-500/10', icon: 'bg-emerald-500/15', border: 'border-emerald-500/20' },
    info: { bg: 'from-blue-600/20 to-blue-900/10', text: 'text-blue-400', glow: 'shadow-blue-500/10', icon: 'bg-blue-500/15', border: 'border-blue-500/20' },
    danger: { bg: 'from-red-600/20 to-red-900/10', text: 'text-red-400', glow: 'shadow-red-500/10', icon: 'bg-red-500/15', border: 'border-red-500/20' },
  };
  const c = colors[color] || colors.primary;

  return (
    <motion.div initial={{ opacity: 0, y: 20, rotateX: -15 }} animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4, scale: 1.03, rotateY: 5 }}
      className={`relative bg-gradient-to-br ${c.bg} rounded-2xl p-4 border ${c.border}
        shadow-lg ${c.glow} cursor-default group overflow-hidden`}
      style={{ transformStyle: 'preserve-3d', perspective: '600px' }}>
      {/* Floating depth layer */}
      <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-surface/30 group-hover:scale-150 transition-transform duration-700" />
      <div className="flex items-center justify-between mb-2">
        <div className={`w-9 h-9 rounded-xl ${c.icon} flex items-center justify-center
          shadow-lg ${c.glow} group-hover:scale-110 transition-transform`}
          style={{ transform: 'translateZ(20px)' }}>
          <Icon className={`w-4.5 h-4.5 ${c.text}`} />
        </div>
        <TrendingUp className="w-3 h-3 text-emerald-400/50 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <p className={`text-2xl font-bold tabular-nums ${c.text}`} style={{ transform: 'translateZ(15px)' }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      <p className="text-[10px] text-text-muted uppercase tracking-wider mt-1">{label}</p>
    </motion.div>
  );
}

/* ── 3D Security Score Ring ── */
function ScoreRing3D({ score }) {
  const circumference = 2 * Math.PI * 58;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
  const label = score >= 80 ? 'SECURE' : score >= 50 ? 'AT RISK' : 'CRITICAL';

  return (
    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.2, type: 'spring', stiffness: 120 }}
      className="relative flex flex-col items-center justify-center"
      style={{ perspective: '600px' }}>
      {/* Outer glow ring */}
      <div className="absolute w-40 h-40 rounded-full opacity-20 animate-pulse"
        style={{ boxShadow: `0 0 40px ${color}, 0 0 80px ${color}40` }} />
      <svg width="160" height="160" className="drop-shadow-2xl" style={{ transform: 'rotateX(10deg)' }}>
        <defs>
          <filter id="glow3d">
            <feGaussianBlur stdDeviation="3" result="glow" />
            <feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={color + '80'} />
          </linearGradient>
        </defs>
        {/* Background track */}
        <circle cx="80" cy="80" r="58" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="10" />
        {/* Decorative ticks */}
        {[...Array(36)].map((_, i) => {
          const angle = (i * 10 - 90) * (Math.PI / 180);
          const x1 = 80 + 52 * Math.cos(angle);
          const y1 = 80 + 52 * Math.sin(angle);
          const x2 = 80 + 55 * Math.cos(angle);
          const y2 = 80 + 55 * Math.sin(angle);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />;
        })}
        {/* Score arc */}
        <motion.circle cx="80" cy="80" r="58" fill="none" stroke="url(#scoreGrad)" strokeWidth="10"
          strokeLinecap="round" strokeDasharray={circumference} filter="url(#glow3d)"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ delay: 0.5, duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.8, type: 'spring' }}
          className="text-4xl font-black tabular-nums" style={{ color }}>{score}</motion.span>
        <span className="text-[9px] font-bold tracking-[3px] mt-0.5" style={{ color: color + 'cc' }}>{label}</span>
        <span className="text-[8px] text-text-muted/70 mt-0.5">/ 100</span>
      </div>
    </motion.div>
  );
}

/* ── Severity Config ── */
const SEVERITY = {
  critical: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/15', dot: 'bg-red-500' },
  high: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/15', dot: 'bg-orange-500' },
  medium: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/15', dot: 'bg-amber-500' },
  low: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/15', dot: 'bg-yellow-500' },
  info: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/15', dot: 'bg-emerald-500' },
};

function SeverityBadge({ level }) {
  const s = SEVERITY[level] || SEVERITY.info;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider ${s.bg} ${s.text} border ${s.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {level.charAt(0).toUpperCase() + level.slice(1)}
    </span>
  );
}

const RESOURCE_LABELS = {
  instances: 'EC2', security_groups: 'SGs', vpcs: 'VPCs',
  subnets: 'Subnets', lambdas: 'Lambda', rds: 'RDS',
  elbs: 'ELB', snapshots: 'Snapshots',
};

const TOOLTIP_STYLE = {
  background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(148,163,184,0.1)',
  borderRadius: '12px', color: '#f1f5f9', fontSize: '12px',
  boxShadow: '0 20px 60px rgba(0,0,0,0.5)', backdropFilter: 'blur(20px)',
};

const CHART_COLORS = ['#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

export default function Dashboard() {
  const { account, provider, accounts } = useOutletContext();
  const { addToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [noData, setNoData] = useState(false);
  const [expandedRegion, setExpandedRegion] = useState(null);
  const [showAllPublicIps, setShowAllPublicIps] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [activeView, setActiveView] = useState('overview');

  const handleExport = async (format) => {
    setExporting(true);
    try {
      await exportDashboard(account, provider || 'aws', format);
      addToast(`Dashboard ${format.toUpperCase()} report downloaded successfully`, 'success');
    } catch (e) {
      addToast(`Export failed: ${e.message}`, 'error');
    }
    setExporting(false);
  };

  useEffect(() => {
    if (!account) { setLoading(false); setNoData(true); return; }
    setLoading(true); setError(null); setNoData(false); setData(null);
    getDashboard(account, provider)
      .then((res) => { setData(res); setNoData(false); })
      .catch((e) => {
        if (e.message.includes('No data') || e.message.includes('404')) { setNoData(true); setError(null); }
        else setError(e.message);
      })
      .finally(() => setLoading(false));
  }, [account]);

  if (loading) return <Loader text="Loading dashboard..." />;

  if (!account || accounts.length === 0) {
    return (
      <EmptyState icon={Plus} title="No accounts configured"
        description="Add a cloud account first to get started."
        action={<Link to="/accounts" className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl text-sm font-medium inline-flex items-center gap-2 shadow-lg shadow-violet-500/20"><Plus className="w-4 h-4" /> Add Account</Link>}
      />
    );
  }

  if (noData) {
    return (
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-text-muted text-sm mt-1">Account: <span className="text-cyan-400 font-medium">{account}</span></p>
        </motion.div>
        <EmptyState icon={ScanLine} title="No data collected yet"
          description={`Account "${account}" has no scan data. Run a scan to collect resource data.`}
          action={<Link to="/scan" className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl text-sm font-medium inline-flex items-center gap-2 shadow-lg shadow-violet-500/20"><ScanLine className="w-4 h-4" /> Go to Scans</Link>}
        />
      </div>
    );
  }

  if (error) return <EmptyState icon={AlertTriangle} title="Error loading dashboard" description={error} />;
  if (!data) return <EmptyState title="No data available" description="Select an account to view the dashboard" />;

  const { totals, regions, region_matrix, public_ips, public_summary, security_score, iam_summary, iam_users, iam_users_no_mfa, open_security_groups, regions_scanned, caller_identity, collection_date } = data;

  const activeRegions = Object.entries(regions)
    .filter(([, stats]) => stats.has_resources)
    .sort((a, b) => {
      const sumA = (a[1].instances || 0) + (a[1].security_groups || 0) + (a[1].vpcs || 0) + (a[1].lambdas || 0) + (a[1].rds || 0) + (a[1].elbs || 0);
      const sumB = (b[1].instances || 0) + (b[1].security_groups || 0) + (b[1].vpcs || 0) + (b[1].lambdas || 0) + (b[1].rds || 0) + (b[1].elbs || 0);
      return sumB - sumA;
    });

  const regionBarData = activeRegions.map(([name, stats]) => ({
    name: name.replace('ap-', '').replace('us-', '').replace('eu-', '').replace('sa-', '').replace('ca-', ''),
    fullName: name, EC2: stats.instances || 0, SGs: stats.security_groups || 0,
    VPCs: stats.vpcs || 0, Lambda: stats.lambdas || 0,
    RDS: stats.rds || 0, ELB: stats.elbs || 0,
  }));

  const resourcePie = [
    { name: 'EC2', value: totals.instances, color: '#7c3aed' },
    { name: 'S3 Buckets', value: totals.buckets, color: '#06b6d4' },
    { name: 'Lambda', value: totals.lambdas, color: '#10b981' },
    { name: 'RDS', value: totals.rds, color: '#f59e0b' },
    { name: 'ELB', value: totals.elbs, color: '#ef4444' },
    { name: 'SGs', value: totals.security_groups, color: '#8b5cf6' },
    { name: 'Snapshots', value: totals.snapshots, color: '#ec4899' },
    { name: 'VPCs', value: totals.vpcs, color: '#14b8a6' },
  ].filter((d) => d.value > 0);

  const totalResources = resourcePie.reduce((s, d) => s + d.value, 0);

  const findings = [];
  if (!iam_summary.AccountMFAEnabled) findings.push({ text: 'Root account MFA not enabled', severity: 'critical' });
  if (iam_summary.AccountAccessKeysPresent) findings.push({ text: 'Root account has access keys', severity: 'critical' });
  if (public_summary?.rds > 0) findings.push({ text: `${public_summary.rds} publicly accessible RDS instance(s)`, severity: 'high' });
  if (open_security_groups > 0) findings.push({ text: `${open_security_groups} security group rule(s) open to 0.0.0.0/0`, severity: 'high' });
  if (public_summary?.ec2 > 0) findings.push({ text: `${public_summary.ec2} EC2 instance(s) with public IPs`, severity: 'medium' });
  if (iam_users_no_mfa > 0) findings.push({ text: `${iam_users_no_mfa} IAM user(s) without MFA`, severity: 'medium' });
  if (public_summary?.elb > 0) findings.push({ text: `${public_summary.elb} internet-facing load balancer(s)`, severity: 'low' });
  if (findings.length === 0) findings.push({ text: 'No major issues detected', severity: 'info' });

  const securityRadar = [
    { axis: 'Identity', value: iam_summary.AccountMFAEnabled ? 80 : 20 },
    { axis: 'Network', value: open_security_groups > 10 ? 15 : open_security_groups > 0 ? 40 : 90 },
    { axis: 'Data', value: public_summary?.rds > 0 ? 20 : 85 },
    { axis: 'Compute', value: totals.instances > 0 ? 70 : 50 },
    { axis: 'Access', value: iam_users_no_mfa > 5 ? 15 : iam_users_no_mfa > 0 ? 40 : 90 },
    { axis: 'Exposure', value: public_ips.length > 5 ? 20 : public_ips.length > 0 ? 50 : 90 },
  ];

  const publicIpsToShow = showAllPublicIps ? public_ips : public_ips.slice(0, 10);

  const views = [
    { id: 'overview', label: 'Overview', icon: Eye },
    { id: 'resources', label: 'Resources', icon: Box },
    { id: 'regions', label: 'Regions', icon: Globe },
    { id: 'identity', label: 'Identity', icon: Users },
  ];

  return (
    <div className="space-y-6">
      {/* ── Hero Header ── */}
      <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <motion.div whileHover={{ rotateY: 180 }} transition={{ duration: 0.6 }}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20"
              style={{ transformStyle: 'preserve-3d' }}>
              <Layers className="w-5 h-5 text-text" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold text-text">
                Cloud Dashboard
              </h1>
              <p className="text-text-muted text-xs mt-0.5">
                <span className="text-cyan-400 font-medium">{account}</span>
                {caller_identity?.Account && <span className="text-text-muted/70 ml-1.5">#{caller_identity.Account}</span>}
                <span className="text-text-muted/50 mx-1.5">•</span>
                {regions_scanned} regions
                {collection_date && <><span className="text-text-muted/50 mx-1.5">•</span>{new Date(collection_date).toLocaleString()}</>}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handleExport('csv')} disabled={exporting}
            className="flex items-center gap-2 px-4 py-2.5 bg-surface/50 hover:bg-white/[0.08] border border-border/30 disabled:opacity-50 rounded-xl text-xs font-medium transition-all backdrop-blur-sm">
            <Download className="w-3.5 h-3.5" /> CSV
          </motion.button>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => handleExport('pdf')} disabled={exporting}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 rounded-xl text-xs font-medium transition-all shadow-lg shadow-violet-500/20">
            <FileText className="w-3.5 h-3.5" /> Export PDF
          </motion.button>
        </div>
      </motion.div>

      {/* ── View Tabs ── */}
      <div className="flex items-center gap-1 bg-surface/40 p-1 rounded-xl border border-border/30 w-fit">
        {views.map(v => (
          <button key={v.id} onClick={() => setActiveView(v.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              activeView === v.id ? 'bg-violet-600 text-text shadow-lg shadow-violet-500/20' : 'text-text-muted hover:text-text hover:bg-white/[0.05]'
            }`}>
            <v.icon className="w-3.5 h-3.5" /> {v.label}
          </button>
        ))}
      </div>

      {/* ── 3D Stats Grid (Overview + Resources only) ── */}
      {(activeView === 'overview' || activeView === 'resources') && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          <StatCube icon={Server} label="EC2 Instances" value={totals.instances} color="primary" delay={0} />
          <StatCube icon={Database} label="S3 Buckets" value={totals.buckets} color="accent" delay={0.03} />
          <StatCube icon={Shield} label="Security Groups" value={totals.security_groups} color="warning" delay={0.06} />
          <StatCube icon={Layers} label="VPCs" value={totals.vpcs} color="success" delay={0.09} />
          <StatCube icon={CloudLightning} label="Lambda" value={totals.lambdas} color="info" delay={0.12} />
          <StatCube icon={Database} label="RDS" value={totals.rds} color="danger" delay={0.15} />
          <StatCube icon={Globe} label="ELBs" value={totals.elbs} color="primary" delay={0.18} />
          <StatCube icon={Network} label="Subnets" value={totals.subnets} color="accent" delay={0.21} />
          <StatCube icon={Camera} label="Snapshots" value={totals.snapshots} color="warning" delay={0.24} />
          <StatCube icon={HardDrive} label="NICs" value={totals.network_interfaces} color="info" delay={0.27} />
        </div>
      )}

      {(activeView === 'overview' || activeView === 'resources') && (
        <>
          {/* ── Security Score + Radar + Distribution ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <Card3D delay={0.1} glow="rgba(124,58,237,0.1)">
              <div className="flex flex-col items-center justify-center py-2">
                <ScoreRing3D score={security_score} />
                <p className="text-[10px] text-text-muted/70 uppercase tracking-widest mt-4 mb-3">Security Posture</p>
                <div className="grid grid-cols-2 gap-2 w-full">
                  {[
                    { label: 'Root MFA', value: iam_summary.AccountMFAEnabled ? 'Yes' : 'No', ok: iam_summary.AccountMFAEnabled },
                    { label: 'Public IPs', value: public_ips.length, ok: public_ips.length === 0 },
                    { label: 'Open SGs', value: open_security_groups, ok: open_security_groups === 0 },
                    { label: 'No MFA', value: iam_users_no_mfa, ok: iam_users_no_mfa === 0 },
                  ].map(({ label, value, ok }) => (
                    <div key={label} className="flex items-center justify-between bg-surface/40 rounded-xl px-3 py-2 border border-border/20">
                      <span className="text-[10px] text-text-muted/70">{label}</span>
                      <span className={`text-xs font-bold ${ok ? 'text-emerald-400' : 'text-red-400'}`}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card3D>

            <Card3D delay={0.15} glow="rgba(6,182,212,0.08)">
              <h3 className="text-[10px] font-semibold text-text-muted mb-3 uppercase tracking-widest flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-cyan-400" /> Security Radar
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={securityRadar}>
                  <PolarGrid stroke="rgba(255,255,255,0.05)" />
                  <PolarAngleAxis dataKey="axis" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Security" dataKey="value" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.15} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </Card3D>

            <Card3D delay={0.2} glow="rgba(16,185,129,0.08)">
              <h3 className="text-[10px] font-semibold text-text-muted mb-1 uppercase tracking-widest">Resource Distribution</h3>
              <p className="text-[9px] text-text-muted/70 mb-3">{totalResources.toLocaleString()} total resources</p>
              {resourcePie.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={resourcePie} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={2}
                        dataKey="value" animationDuration={1200} animationBegin={300}>
                        {resourcePie.map((entry, i) => <Cell key={entry.name} fill={entry.color} stroke="transparent" />)}
                      </Pie>
                      <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v, n) => [`${v} (${((v/totalResources)*100).toFixed(1)}%)`, n]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-1.5 mt-1">
                    {resourcePie.slice(0, 6).map((d) => (
                      <div key={d.name} className="flex items-center gap-1.5 text-[10px]">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                        <span className="text-text-muted truncate">{d.name}</span>
                        <span className="text-text font-semibold tabular-nums ml-auto">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-48 text-text-muted/70 text-sm">No resources</div>
              )}
            </Card3D>
          </div>

          {/* ── Findings ── */}
          <Card3D delay={0.25} glow="rgba(239,68,68,0.06)">
            <h3 className="text-[10px] font-semibold text-text-muted mb-4 uppercase tracking-widest flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> Security Findings
              <span className="ml-auto text-[10px] px-2 py-0.5 rounded-md bg-red-500/10 text-red-400 border border-red-500/15">
                {findings.filter(f => f.severity === 'critical' || f.severity === 'high').length} critical/high
              </span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {findings.map((f, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  className={`flex items-start gap-3 p-3.5 rounded-xl ${SEVERITY[f.severity].bg} border ${SEVERITY[f.severity].border}
                    hover:scale-[1.01] transition-transform`}>
                  <span className={`mt-0.5 ${SEVERITY[f.severity].text}`}>
                    {f.severity === 'critical' || f.severity === 'high' ? <XCircle className="w-4 h-4" /> :
                     f.severity === 'info' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  </span>
                  <p className="text-xs text-text flex-1">{f.text}</p>
                  <SeverityBadge level={f.severity} />
                </motion.div>
              ))}
            </div>
          </Card3D>
        </>
      )}

      {(activeView === 'overview' || activeView === 'resources') && regionBarData.length > 0 && (
        <Card3D delay={0.3} glow="rgba(99,102,241,0.06)">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] font-semibold text-text-muted uppercase tracking-widest flex items-center gap-2">
              <BarChart3 className="w-3.5 h-3.5 text-violet-400" /> Resources by Region
            </h3>
            <span className="text-[10px] text-text-muted/70">{activeRegions.length} active regions</span>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={regionBarData} barGap={1} barCategoryGap="15%">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 9 }} angle={-30} textAnchor="end" height={60} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={(_, p) => p?.[0]?.payload?.fullName || ''} />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
              <Bar dataKey="EC2" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              <Bar dataKey="SGs" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Lambda" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="RDS" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="ELB" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card3D>
      )}

      {/* ── Region Matrix ── */}
      {(activeView === 'overview' || activeView === 'regions') && region_matrix && Object.keys(region_matrix).length > 0 && (
        <Card3D delay={0.35} glow="rgba(6,182,212,0.06)">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-4 h-4 text-cyan-400" />
            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">Region Usage Matrix</h3>
            <span className="text-[10px] text-text-muted/70 bg-surface/40 px-2 py-0.5 rounded-md">{Object.keys(region_matrix).length} regions</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-text-muted border-b border-border/30">
                  <th className="pb-3 text-left font-medium text-[10px] uppercase tracking-wider pr-4 sticky left-0 bg-surface-light/90 backdrop-blur">Region</th>
                  {Object.keys(RESOURCE_LABELS).map(key => (
                    <th key={key} className="pb-3 text-center font-medium text-[10px] uppercase tracking-wider px-2 whitespace-nowrap">{RESOURCE_LABELS[key]}</th>
                  ))}
                  <th className="pb-3 text-center font-medium text-[10px] uppercase tracking-wider px-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(region_matrix)
                  .sort((a, b) => Object.values(b[1]).reduce((s, v) => s + v, 0) - Object.values(a[1]).reduce((s, v) => s + v, 0))
                  .map(([region, resources], i) => {
                    const total = Object.values(resources).reduce((s, v) => s + v, 0);
                    return (
                      <motion.tr key={region} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 + i * 0.01 }}
                        className={`border-b border-border/15 ${total > 0 ? 'hover:bg-surface/30' : 'opacity-30'} transition-all`}>
                        <td className="py-2.5 pr-4 font-mono text-text sticky left-0 bg-surface-light/90 backdrop-blur text-[11px]">
                          <div className="flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${total > 0 ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-gray-700'}`} />
                            {region}
                          </div>
                        </td>
                        {Object.keys(RESOURCE_LABELS).map(key => {
                          const val = resources[key] || 0;
                          return (
                            <td key={key} className="py-2.5 text-center px-2">
                              {val > 0 ? (
                                <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 font-semibold text-[10px] border border-cyan-500/10">{val}</span>
                              ) : <span className="text-gray-700">-</span>}
                            </td>
                          );
                        })}
                        <td className="py-2.5 text-center px-2">
                          <span className={`font-bold text-xs ${total > 0 ? 'text-text' : 'text-gray-700'}`}>{total}</span>
                        </td>
                      </motion.tr>
                    );
                  })}
                <tr className="border-t-2 border-border/50 font-bold">
                  <td className="py-3 pr-4 text-text sticky left-0 bg-surface-light/90 text-[10px] uppercase tracking-wider">Total</td>
                  {Object.keys(RESOURCE_LABELS).map(key => {
                    const colTotal = Object.values(region_matrix).reduce((s, r) => s + (r[key] || 0), 0);
                    return <td key={key} className="py-3 text-center px-2 text-violet-400">{colTotal > 0 ? colTotal : '-'}</td>;
                  })}
                  <td className="py-3 text-center px-2 text-violet-400 font-bold">
                    {Object.values(region_matrix).reduce((s, r) => s + Object.values(r).reduce((a, b) => a + b, 0), 0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card3D>
      )}

      {/* ── Region Details ── */}
      {(activeView === 'overview' || activeView === 'regions') && activeRegions.length > 0 && (
        <div>
          <h2 className="text-[10px] font-semibold text-text-muted mb-3 flex items-center gap-2 uppercase tracking-widest">
            <Activity className="w-3.5 h-3.5 text-violet-400" /> Region Details ({activeRegions.length} active)
          </h2>
          <div className="space-y-2">
            {activeRegions.map(([regionName, stats], i) => (
              <motion.div key={regionName} initial={{ opacity: 0, y: 10, rotateX: -5 }} animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-surface-light/80 backdrop-blur-xl border border-border/30 rounded-2xl overflow-hidden hover:border-border/60 transition-all
                  shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
                <button onClick={() => setExpandedRegion(expandedRegion === regionName ? null : regionName)}
                  className="w-full flex items-center justify-between p-4 hover:bg-surface/30 transition-all text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-cyan-400" />
                    </div>
                    <span className="font-mono text-sm font-medium text-text">{regionName}</span>
                    <div className="flex items-center gap-1.5 ml-2">
                      {stats.instances > 0 && <span className="text-[10px] px-2 py-0.5 rounded-md bg-violet-500/10 text-violet-400 font-medium border border-violet-500/10">{stats.instances} EC2</span>}
                      {stats.lambdas > 0 && <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 font-medium border border-emerald-500/10">{stats.lambdas} Lambda</span>}
                      {stats.rds > 0 && <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 font-medium border border-amber-500/10">{stats.rds} RDS</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {stats.guardduty_enabled ?
                      <span className="text-[10px] text-emerald-400 flex items-center gap-1"><Shield className="w-3 h-3" /> GuardDuty</span> :
                      <span className="text-[10px] text-gray-600 flex items-center gap-1"><Shield className="w-3 h-3" /> No GuardDuty</span>}
                    {expandedRegion === regionName ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
                  </div>
                </button>
                <AnimatePresence>
                  {expandedRegion === regionName && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                      <div className="px-4 pb-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
                        {[
                          { label: 'EC2', value: stats.instances, sub: `${stats.instances_running || 0} running / ${stats.instances_stopped || 0} stopped` },
                          { label: 'Security Groups', value: stats.security_groups },
                          { label: 'VPCs', value: stats.vpcs },
                          { label: 'Subnets', value: stats.subnets },
                          { label: 'Lambda', value: stats.lambdas },
                          { label: 'RDS', value: stats.rds },
                          { label: 'ELBs', value: stats.elbs },
                          { label: 'Snapshots', value: stats.snapshots },
                          { label: 'NICs', value: stats.network_interfaces },
                          { label: 'CloudTrail', value: stats.cloudtrail_trails, sub: stats.cloudtrail_trails > 0 ? 'Active' : 'None' },
                        ].map(({ label, value, sub }) => (
                          <div key={label} className="bg-surface/40 rounded-xl p-3 border border-border/20 hover:border-border/50 transition-all">
                            <p className="text-lg font-bold text-text tabular-nums">{value || 0}</p>
                            <p className="text-[10px] text-text-muted/70 uppercase tracking-wider">{label}</p>
                            {sub && <p className="text-[10px] text-text-muted/50 mt-0.5">{sub}</p>}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ── Public Network Resources ── */}
      {(activeView === 'overview' || activeView === 'resources') && public_ips.length > 0 && (
        <Card3D delay={0.4} glow="rgba(245,158,11,0.06)">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-amber-400" />
              <h3 className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">Public Network Resources ({public_ips.length})</h3>
            </div>
            {public_summary && (
              <div className="flex items-center gap-2 text-[10px]">
                {public_summary.ec2 > 0 && <span className="px-2 py-1 rounded-md bg-violet-500/10 text-violet-400 border border-violet-500/10">{public_summary.ec2} EC2</span>}
                {public_summary.rds > 0 && <span className="px-2 py-1 rounded-md bg-red-500/10 text-red-400 border border-red-500/10">{public_summary.rds} RDS</span>}
                {public_summary.elb > 0 && <span className="px-2 py-1 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/10">{public_summary.elb} ELB</span>}
              </div>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-text-muted text-left border-b border-border/30">
                  {['IP / DNS', 'Resource', 'Name', 'Type', 'Instance', 'State', 'Region'].map(h => (
                    <th key={h} className="pb-3 font-medium text-[10px] uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {publicIpsToShow.map((ip, i) => (
                  <motion.tr key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 + i * 0.02 }}
                    className="border-b border-border/15 hover:bg-surface/30 transition-all">
                    <td className="py-2.5 font-mono text-amber-400 text-xs max-w-[200px] truncate">{ip.ip}</td>
                    <td className="py-2.5 font-mono text-text-muted text-xs">{ip.resource}</td>
                    <td className="py-2.5 text-xs text-text">{ip.name || '-'}</td>
                    <td className="py-2.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${
                        ip.type === 'EC2' ? 'bg-violet-500/10 text-violet-400' :
                        ip.type === 'RDS' ? 'bg-red-500/10 text-red-400' : 'bg-purple-500/10 text-purple-400'
                      }`}>{ip.type}</span>
                    </td>
                    <td className="py-2.5 text-xs text-text-muted font-mono">{ip.instance_type || '-'}</td>
                    <td className="py-2.5">
                      <span className={`text-xs ${
                        ['running', 'active', 'available'].includes(ip.state) ? 'text-emerald-400' :
                        ip.state === 'stopped' ? 'text-gray-500' : 'text-amber-400'
                      }`}>{ip.state || '-'}</span>
                    </td>
                    <td className="py-2.5 text-xs flex items-center gap-1.5 text-text-muted">
                      <MapPin className="w-3 h-3" />{ip.region}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          {public_ips.length > 10 && (
            <button onClick={() => setShowAllPublicIps(!showAllPublicIps)}
              className="mt-3 text-xs text-violet-400 hover:text-violet-300 transition-colors font-medium">
              {showAllPublicIps ? 'Show less' : `Show all ${public_ips.length} resources`}
            </button>
          )}
        </Card3D>
      )}

      {/* ── IAM Overview ── */}
      {(activeView === 'overview' || activeView === 'identity') && (
        <Card3D delay={0.5} glow="rgba(99,102,241,0.06)">
          <h3 className="text-[10px] font-semibold text-text-muted mb-4 flex items-center gap-2 uppercase tracking-widest">
            <Users className="w-3.5 h-3.5 text-violet-400" /> IAM Overview
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-4">
            {[
              { label: 'Users', value: iam_summary.Users, color: 'text-violet-400', bg: 'bg-violet-500/10' },
              { label: 'Roles', value: iam_summary.Roles, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
              { label: 'Groups', value: iam_summary.Groups, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
              { label: 'Policies', value: iam_summary.Policies, color: 'text-amber-400', bg: 'bg-amber-500/10' },
              { label: 'MFA Devices', value: iam_summary.MFADevices, color: 'text-blue-400', bg: 'bg-blue-500/10' },
              { label: 'Keys Quota', value: iam_summary.AccessKeysPerUserQuota, color: 'text-purple-400', bg: 'bg-purple-500/10' },
            ].map(({ label, value, color, bg }) => (
              <motion.div key={label} whileHover={{ y: -3, scale: 1.03 }}
                className={`${bg} rounded-xl p-3 text-center border border-border/20 hover:border-border/50 transition-all`}>
                <p className={`text-2xl font-bold tabular-nums ${color}`}>{value ?? '-'}</p>
                <p className="text-[10px] text-text-muted/70 mt-1 uppercase tracking-wider">{label}</p>
              </motion.div>
            ))}
          </div>
          {iam_users && iam_users.length > 0 && (
            <div className="mt-4">
              <h4 className="text-[10px] font-semibold text-text-muted mb-2 uppercase tracking-widest">IAM Users ({iam_users.length})</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-text-muted border-b border-border/30">
                      {['Username', 'MFA', 'Policies', 'Groups', 'Created'].map(h => (
                        <th key={h} className="pb-2 text-left font-medium text-[10px] uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {iam_users.map(u => (
                      <tr key={u.name} className="border-b border-border/15 hover:bg-surface/30 transition-all">
                        <td className="py-2 font-mono text-text">{u.name}</td>
                        <td className="py-2 text-center">
                          {u.has_mfa ? <Lock className="w-3.5 h-3.5 text-emerald-400 mx-auto" /> : <Unlock className="w-3.5 h-3.5 text-red-400 mx-auto" />}
                        </td>
                        <td className="py-2 text-text-muted">{u.policies_count}</td>
                        <td className="py-2 text-text-muted">{u.groups?.join(', ') || '-'}</td>
                        <td className="py-2 text-text-muted">{u.created ? new Date(u.created).toLocaleDateString() : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Card3D>
      )}
    </div>
  );
}
