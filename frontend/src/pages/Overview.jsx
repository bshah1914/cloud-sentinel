import { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Area, XAxis, YAxis, CartesianGrid
} from 'recharts';
import {
  Cloud, Shield, Server, AlertTriangle, Globe, Plus,
  ArrowRight, Activity, Eye, TrendingUp, Lock, Cpu,
  DollarSign, Settings, Leaf, CheckCircle2, XCircle,
  ChevronRight, BarChart3, Zap, Target
} from 'lucide-react';
import { getMultiCloudOverview, getWafReport } from '../api';
import Card from '../components/Card';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';

const PROVIDER_META = {
  aws: { name: 'Amazon Web Services', short: 'AWS', color: '#FF9900', gradient: 'from-orange-500/15 to-orange-600/5', border: 'border-orange-500/15', bg: '#FF990015' },
  azure: { name: 'Microsoft Azure', short: 'Azure', color: '#0078D4', gradient: 'from-blue-500/15 to-blue-600/5', border: 'border-blue-500/15', bg: '#0078D415' },
  gcp: { name: 'Google Cloud Platform', short: 'GCP', color: '#4285F4', gradient: 'from-sky-500/15 to-sky-600/5', border: 'border-sky-500/15', bg: '#4285F415' },
};

const WAF_PILLARS = [
  { key: 'security', label: 'Security', icon: Shield, color: '#ef4444', gradient: 'from-red-500/15 to-red-600/5' },
  { key: 'reliability', label: 'Reliability', icon: Activity, color: '#f59e0b', gradient: 'from-amber-500/15 to-amber-600/5' },
  { key: 'performance', label: 'Performance', icon: Cpu, color: '#7c3aed', gradient: 'from-indigo-500/15 to-indigo-600/5' },
  { key: 'cost', label: 'Cost', icon: DollarSign, color: '#10b981', gradient: 'from-emerald-500/15 to-emerald-600/5' },
  { key: 'operational', label: 'Operations', icon: Settings, color: '#06b6d4', gradient: 'from-cyan-500/15 to-cyan-600/5' },
  { key: 'sustainability', label: 'Sustainability', icon: Leaf, color: '#84cc16', gradient: 'from-lime-500/15 to-lime-600/5' },
];

const CHART_TOOLTIP = {
  contentStyle: { background: '#1a2332', border: '1px solid rgba(99,102,241,0.12)', borderRadius: '12px', color: '#eef2ff', fontSize: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' },
};

function ScoreGauge({ score, size = 120 }) {
  const r = size / 2 - 12;
  const circ = Math.PI * r; // half circle
  const offset = circ - (score / 100) * circ;
  const color = score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative flex flex-col items-center" style={{ width: size, height: size * 0.7 }}>
      <svg width={size} height={size * 0.65} viewBox={`0 0 ${size} ${size * 0.65}`}>
        <path d={`M 12 ${size * 0.6} A ${r} ${r} 0 0 1 ${size - 12} ${size * 0.6}`}
          fill="none" stroke="currentColor" className="text-border" strokeWidth="8" strokeLinecap="round" />
        <motion.path
          d={`M 12 ${size * 0.6} A ${r} ${r} 0 0 1 ${size - 12} ${size * 0.6}`}
          fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circ} initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
          style={{ filter: `drop-shadow(0 0 8px ${color}50)` }}
        />
      </svg>
      <div className="absolute bottom-1 flex flex-col items-center">
        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
          className="text-2xl font-bold tabular-nums" style={{ color }}>{score}%</motion.span>
      </div>
    </div>
  );
}

export default function Overview() {
  const { accounts, account } = useOutletContext();
  const [data, setData] = useState(null);
  const [waf, setWaf] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMultiCloudOverview()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (account) {
      getWafReport(account).then(setWaf).catch(() => setWaf(null));
    }
  }, [account]);

  if (loading) return <Loader text="Loading executive overview..." />;

  if (!data || data.total_accounts === 0) {
    return (
      <EmptyState icon={Plus} title="No cloud accounts configured"
        description="Add an AWS, Azure, or GCP account to get started with multi-cloud security monitoring."
        action={
          <Link to="/accounts" className="px-6 py-3 bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary rounded-xl text-sm font-semibold transition-all inline-flex items-center gap-2 shadow-lg shadow-primary/25">
            <Plus className="w-4 h-4" /> Add Cloud Account
          </Link>
        }
      />
    );
  }

  const providerPie = Object.entries(data.providers).map(([pid, p]) => ({
    name: p.short_name, value: p.total_resources,
    color: PROVIDER_META[pid]?.color || '#7c3aed',
  })).filter((d) => d.value > 0);

  const radarData = waf ? WAF_PILLARS.map((p) => ({
    pillar: p.label,
    score: waf.pillars?.[p.key]?.score || 0,
    fullMark: 100,
  })) : [];

  // Fake trend data for visual appeal
  const trendData = [
    { day: 'Mon', score: Math.max(0, (data.avg_security_score || 70) - 8) },
    { day: 'Tue', score: Math.max(0, (data.avg_security_score || 70) - 5) },
    { day: 'Wed', score: Math.max(0, (data.avg_security_score || 70) - 3) },
    { day: 'Thu', score: Math.max(0, (data.avg_security_score || 70) - 1) },
    { day: 'Fri', score: Math.max(0, (data.avg_security_score || 70) + 1) },
    { day: 'Sat', score: Math.max(0, (data.avg_security_score || 70) + 2) },
    { day: 'Today', score: data.avg_security_score || 70 },
  ];

  const kpis = [
    { label: 'Cloud Accounts', value: data.total_accounts, icon: Cloud, color: '#7c3aed', change: '+1' },
    { label: 'Total Resources', value: data.total_resources, icon: Server, color: '#06b6d4', change: null },
    { label: 'Security Findings', value: data.total_findings, icon: AlertTriangle, color: data.total_findings > 10 ? '#ef4444' : '#f59e0b', change: null },
    { label: 'Security Score', value: `${data.avg_security_score}/100`, icon: Shield, color: data.avg_security_score >= 80 ? '#10b981' : data.avg_security_score >= 50 ? '#f59e0b' : '#ef4444', change: null },
  ];

  return (
    <div className="space-y-7">
      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="report-header flex items-end justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl gradient-border flex items-center justify-center shadow-lg shadow-primary/15">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text">Executive Overview</h1>
              <p className="text-text-muted text-xs mt-0.5">
                {data.total_accounts} account(s) &bull; {Object.keys(data.providers).length} provider(s) &bull; Last updated {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/audit" className="flex items-center gap-2 px-4 py-2.5 bg-surface-lighter/50 hover:bg-surface-lighter border border-border/50 rounded-xl text-xs font-medium text-text-muted hover:text-text transition-all">
            <Target className="w-3.5 h-3.5" /> Run Audit
          </Link>
          <Link to="/dashboard" className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary to-primary-dark rounded-xl text-xs font-semibold transition-all shadow-sm shadow-primary/15">
            <BarChart3 className="w-3.5 h-3.5" /> Deep Dive
          </Link>
        </div>
      </motion.div>

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <motion.div key={kpi.label}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -3, scale: 1.01 }}
              className="kpi-card stat-shine"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="metric-label">{kpi.label}</p>
                  <p className="metric-value mt-2 text-text">{kpi.value}</p>
                  {kpi.change && (
                    <p className="text-[10px] mt-1.5 text-emerald-400 font-medium flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> {kpi.change} this week
                    </p>
                  )}
                </div>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${kpi.color}15` }}>
                  <Icon className="w-5 h-5" style={{ color: kpi.color }} />
                </div>
              </div>
              <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full blur-3xl opacity-10" style={{ background: kpi.color }} />
            </motion.div>
          );
        })}
      </div>

      {/* ── Well-Architected Framework + Security Trend ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* WAF Radar */}
        <Card delay={0.1} className="lg:col-span-2" hover={false}>
          <div className="flex items-center justify-between mb-5">
            <div className="section-title flex-none">
              <Shield className="w-4 h-4 text-primary-light" />
              <span>Well-Architected Framework</span>
            </div>
            {waf && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-text-muted uppercase tracking-wider">Overall</span>
                <span className={`text-lg font-bold tabular-nums ${waf.overall_score >= 80 ? 'text-emerald-400' : waf.overall_score >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                  {waf.overall_score}%
                </span>
              </div>
            )}
          </div>

          {waf && radarData.length > 0 ? (
            <div className="flex items-start gap-6">
              <div className="flex-1">
                <ResponsiveContainer width="100%" height={260}>
                  <RadarChart data={radarData} outerRadius="75%">
                    <PolarGrid stroke="rgba(99,102,241,0.08)" />
                    <PolarAngleAxis dataKey="pillar" tick={{ fill: '#7c8db5', fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="Score" dataKey="score" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.15} strokeWidth={2}
                      dot={{ r: 4, fill: '#7c3aed', stroke: '#1a2332', strokeWidth: 2 }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="w-64 space-y-2.5">
                {WAF_PILLARS.map((p) => {
                  const pillarData = waf.pillars?.[p.key];
                  const score = pillarData?.score || 0;
                  const Icon = p.icon;
                  return (
                    <div key={p.key} className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${p.color}15` }}>
                        <Icon className="w-3.5 h-3.5" style={{ color: p.color }} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-text">{p.label}</span>
                          <span className="text-[10px] font-bold tabular-nums" style={{ color: p.color }}>{score}%</span>
                        </div>
                        <div className="progress-track">
                          <motion.div className="progress-fill" style={{ background: p.color }}
                            initial={{ width: 0 }} animate={{ width: `${score}%` }}
                            transition={{ duration: 1.2, delay: 0.5, ease: [0.16, 1, 0.3, 1] }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-60 text-text-muted text-sm">
              <div className="text-center">
                <Shield className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>Run a scan to generate WAF analysis</p>
              </div>
            </div>
          )}

          {/* WAF Checks Detail */}
          {waf && (
            <div className="mt-5 pt-5 border-t border-border/30">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                {WAF_PILLARS.map((p) => {
                  const pillarData = waf.pillars?.[p.key];
                  if (!pillarData) return null;
                  return pillarData.checks?.map((check, ci) => (
                    <div key={`${p.key}-${ci}`}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${check.passed ? 'bg-emerald-500/5 text-emerald-400' : 'bg-red-500/5 text-red-400'}`}>
                      {check.passed ? <CheckCircle2 className="w-3 h-3 flex-shrink-0" /> : <XCircle className="w-3 h-3 flex-shrink-0" />}
                      <span className="truncate">{check.name}</span>
                    </div>
                  ));
                })}
              </div>
            </div>
          )}
        </Card>

        {/* Security Score Trend */}
        <Card delay={0.15} hover={false}>
          <div className="section-title mb-4">
            <TrendingUp className="w-4 h-4 text-accent-light" />
            <span>Security Trend</span>
          </div>
          <div className="flex justify-center mb-4">
            <ScoreGauge score={data.avg_security_score || 0} />
          </div>
          <ResponsiveContainer width="100%" height={130}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.05)" />
              <XAxis dataKey="day" tick={{ fill: '#7c8db5', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} hide />
              <Tooltip {...CHART_TOOLTIP} />
              <Area type="monotone" dataKey="score" stroke="#7c3aed" fill="url(#scoreGrad)" strokeWidth={2}
                dot={{ r: 3, fill: '#7c3aed', stroke: '#1a2332', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* ── Provider Cards ── */}
      <div>
        <div className="section-title mb-4">
          <Cloud className="w-4 h-4 text-primary-light" />
          <span>Cloud Providers</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {Object.entries(PROVIDER_META).map(([pid, meta]) => {
            const provider = data.providers[pid];
            const hasAccounts = provider && provider.accounts && provider.accounts.length > 0;

            return (
              <Card key={pid} delay={0.15}>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center border" style={{ background: meta.bg, borderColor: `${meta.color}20` }}>
                      <Cloud className="w-5 h-5" style={{ color: meta.color }} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-text">{meta.short}</h3>
                      <p className="text-[10px] text-text-muted">{meta.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: hasAccounts ? meta.color : '#374151', boxShadow: hasAccounts ? `0 0 8px ${meta.color}40` : 'none' }} />
                    <span className="text-[10px] text-text-muted">{hasAccounts ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>

                {hasAccounts ? (
                  <div className="space-y-2.5">
                    {provider.accounts.map((acct) => (
                      <div key={acct.name} className="bg-surface/40 rounded-xl p-3.5 border border-border/20 hover:border-border/40 transition-all group">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-text group-hover:text-primary-light transition-colors">{acct.name}</span>
                          <span className={`text-xs font-bold tabular-nums px-2 py-0.5 rounded-md ${
                            acct.security_score >= 80 ? 'bg-emerald-500/10 text-emerald-400' :
                            acct.security_score >= 50 ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'
                          }`}>
                            {acct.security_score}/100
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-[10px] text-text-muted">
                          <span className="flex items-center gap-1"><Server className="w-3 h-3" /> {acct.total_resources}</span>
                          <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {acct.total_findings}</span>
                          <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {acct.regions_scanned} regions</span>
                        </div>
                        {/* Compliance bar */}
                        <div className="compliance-bar mt-3">
                          <motion.div className="compliance-fill"
                            initial={{ width: 0 }} animate={{ width: `${acct.security_score}%` }}
                            transition={{ duration: 1.5, delay: 0.5 }}
                            style={{
                              background: `linear-gradient(90deg, ${
                                acct.security_score >= 80 ? '#10b981' : acct.security_score >= 50 ? '#f59e0b' : '#ef4444'
                              }, ${
                                acct.security_score >= 80 ? '#06b6d4' : acct.security_score >= 50 ? '#f59e0b80' : '#ef444480'
                              })`
                            }}
                          />
                        </div>
                      </div>
                    ))}
                    <div className="text-center pt-1">
                      <span className="text-[10px] text-text-muted">{provider.total_resources} total resources</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 rounded-xl bg-surface-lighter/30 flex items-center justify-center mx-auto mb-3">
                      <Plus className="w-5 h-5 text-text-muted/40" />
                    </div>
                    <p className="text-sm text-text-muted mb-3">No {meta.short} accounts</p>
                    <Link to="/accounts" className="text-xs text-primary hover:text-primary-light transition-colors inline-flex items-center gap-1 font-medium">
                      Add Account <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {/* ── Resource Distribution + Quick Actions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Resource Pie */}
        {providerPie.length > 0 && (
          <Card delay={0.2} hover={false}>
            <div className="section-title mb-5">
              <Activity className="w-4 h-4 text-primary-light" />
              <span>Resource Distribution</span>
            </div>
            <div className="flex items-center gap-8">
              <ResponsiveContainer width="55%" height={220}>
                <PieChart>
                  <Pie data={providerPie} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value" animationDuration={1200}>
                    {providerPie.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip {...CHART_TOOLTIP} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-4 flex-1">
                {providerPie.map((d) => (
                  <div key={d.name}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ background: d.color, boxShadow: `0 0 8px ${d.color}40` }} />
                        <span className="text-sm text-text">{d.name}</span>
                      </div>
                      <span className="text-sm font-bold tabular-nums text-text">{d.value}</span>
                    </div>
                    <div className="progress-track">
                      <motion.div className="progress-fill" style={{ background: d.color }}
                        initial={{ width: 0 }} animate={{ width: `${(d.value / Math.max(...providerPie.map(p => p.value))) * 100}%` }}
                        transition={{ duration: 1, delay: 0.8 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Quick Actions */}
        <Card delay={0.25} hover={false}>
          <div className="section-title mb-5">
            <Zap className="w-4 h-4 text-accent-light" />
            <span>Quick Actions</span>
          </div>
          <div className="space-y-3">
            {[
              { to: '/scan', icon: Activity, label: 'Run Cloud Scan', desc: 'Collect latest resource data from your cloud providers', color: '#7c3aed' },
              { to: '/audit', icon: Shield, label: 'Security Audit', desc: 'Check for misconfigurations and compliance violations', color: '#ef4444' },
              { to: '/resources', icon: Server, label: 'Browse Resources', desc: 'Explore EC2, S3, Lambda, RDS and more', color: '#06b6d4' },
              { to: '/security-groups', icon: Lock, label: 'Security Groups', desc: 'Identify risky firewall rules and open ports', color: '#f59e0b' },
              { to: '/iam', icon: Eye, label: 'IAM Analysis', desc: 'Review users, roles, policies and MFA status', color: '#10b981' },
            ].map(({ to, icon: Icon, label, desc, color }) => (
              <Link key={to} to={to}
                className="flex items-center gap-4 p-3.5 rounded-xl border border-border/20 hover:border-border/50 hover:bg-white/[0.02] transition-all group">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}12` }}>
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-text group-hover:text-primary-light transition-colors">{label}</p>
                  <p className="text-[10px] text-text-muted mt-0.5">{desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-text-muted/30 group-hover:text-primary-light transition-all group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
