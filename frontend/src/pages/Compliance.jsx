import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area, Legend
} from 'recharts';
import {
  Shield, Zap, Download, FileText, FileSpreadsheet, CheckCircle2,
  XCircle, AlertTriangle, ChevronRight, Search, RefreshCw,
  Target, Globe, Lock, Heart, CreditCard, BookOpen, Award,
  Layers, Activity, Eye, Filter, Clock, TrendingUp, Brain, MapPin
} from 'lucide-react';
import {
  getComplianceFrameworks, runComplianceScan, getComplianceResults,
  getComplianceHistory, exportComplianceReport
} from '../api';
import { useToast } from '../components/Toast';
import Card from '../components/Card';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';

const CHART_TOOLTIP = {
  contentStyle: { background: '#1a2332', border: '1px solid rgba(148,163,184,0.15)', borderRadius: '12px', color: '#f1f5f9', fontSize: '11px', boxShadow: '0 8px 32px rgba(0,0,0,0.25)' },
};

const SEV_COLORS = { CRITICAL: '#ef4444', HIGH: '#f97316', MEDIUM: '#eab308', LOW: '#3b82f6', INFO: '#64748b' };

const FW_ICONS = { Shield, BookOpen, Award, Globe, CreditCard, Heart, Lock, Layers };

const STATUS_COLORS = {
  PASS: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/15' },
  FAIL: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/15' },
  WARN: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/15' },
  ERROR: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/15' },
  'N/A': { bg: 'bg-slate-500/10', text: 'text-text-muted', border: 'border-slate-500/15' },
};

function ScoreRing({ score, size = 80, strokeWidth = 6 }) {
  const r = (size - strokeWidth * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 80 ? '#34d399' : score >= 50 ? '#fbbf24' : '#f87171';
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#334155" strokeWidth={strokeWidth} />
        <motion.circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeLinecap="round" strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          style={{ filter: `drop-shadow(0 0 6px ${color}50)` }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold tabular-nums" style={{ color }}>{score}%</span>
      </div>
    </div>
  );
}

export default function Compliance() {
  const { account } = useOutletContext();
  const { addToast } = useToast();
  const [frameworks, setFrameworks] = useState([]);
  const [results, setResults] = useState(null);
  const [history, setHistory] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedFw, setSelectedFw] = useState(null);
  const [search, setSearch] = useState('');
  const [sevFilter, setSevFilter] = useState(new Set(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']));
  const [expandedChecks, setExpandedChecks] = useState(new Set());

  useEffect(() => {
    Promise.all([
      getComplianceFrameworks().catch(() => ({ frameworks: [] })),
      account ? getComplianceResults(account).catch(() => null) : Promise.resolve(null),
      account ? getComplianceHistory(account).catch(() => ({ history: [] })) : Promise.resolve({ history: [] }),
    ]).then(([fwRes, resultsRes, histRes]) => {
      setFrameworks(fwRes.frameworks || []);
      setResults(resultsRes);
      setHistory(histRes?.history || []);
      setLoading(false);
    });
  }, [account]);

  const handleScan = async () => {
    if (!account) return;
    setScanning(true);
    try {
      const res = await runComplianceScan(account);
      setResults(res);
      addToast(`Compliance scan complete: ${res.summary.overall_score}% overall score`, 'success', 5000);
      getComplianceHistory(account).then(h => setHistory(h?.history || [])).catch(() => {});
    } catch (e) {
      addToast(`Scan failed: ${e.message}`, 'error');
    }
    setScanning(false);
  };

  const handleExport = async (format) => {
    try {
      await exportComplianceReport(account, format);
      addToast(`${format.toUpperCase()} report downloaded`, 'success');
    } catch (e) {
      addToast(`Export failed: ${e.message}`, 'error');
    }
  };

  if (loading) return <Loader text="Loading compliance data..." />;

  const summary = results?.summary || {};
  const fwResults = results?.frameworks || {};
  const findings = results?.all_findings || [];
  const aiRecs = results?.ai_recommendations || [];

  const filteredFindings = findings.filter(f => {
    if (!sevFilter.has(f.severity)) return false;
    if (search) {
      const s = search.toLowerCase();
      return f.title?.toLowerCase().includes(s) || f.reason?.toLowerCase().includes(s) ||
             f.resource_type?.toLowerCase().includes(s);
    }
    return true;
  });

  const fwBarData = Object.values(fwResults).map(fw => ({
    name: fw.name.length > 15 ? fw.name.slice(0, 15) + '...' : fw.name,
    score: fw.score, passed: fw.passed, failed: fw.failed,
    fill: fw.score >= 80 ? '#34d399' : fw.score >= 50 ? '#fbbf24' : '#f87171',
  }));

  const radarData = Object.values(fwResults).map(fw => ({
    framework: fw.name.length > 12 ? fw.name.slice(0, 12) + '...' : fw.name,
    score: fw.score, fullMark: 100,
  }));

  const sevPie = Object.entries(summary.severity_counts || {})
    .map(([name, value]) => ({ name, value })).filter(d => d.value > 0);

  const trendData = history.slice(0, 10).reverse().map((h, i) => ({
    scan: `#${i + 1}`,
    score: h.overall_score,
    passed: h.passed,
    failed: h.failed,
  }));

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'frameworks', label: 'Frameworks', icon: Shield },
    { id: 'findings', label: 'Findings', icon: AlertTriangle, count: findings.length },
    { id: 'controls', label: 'Controls', icon: Target },
    { id: 'recommendations', label: 'AI Recommendations', icon: Brain },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="report-header flex items-end justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-border flex items-center justify-center shadow-lg shadow-primary/15">
            <Shield className="w-5 h-5 text-text" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text">Cloud Compliance</h1>
            <p className="text-text-muted text-xs mt-0.5">
              {frameworks.length} frameworks &bull; {account ? `Account: ${account}` : 'Select an account'}
              {results && ` \u2022 Last scan: ${new Date(results.scanned_at).toLocaleString()}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {results && (
            <>
              <button onClick={() => handleExport('pdf')} className="flex items-center gap-1.5 px-3 py-2 bg-surface-lighter/50 hover:bg-surface-lighter border border-border/50 rounded-xl text-xs font-medium transition-all">
                <FileText className="w-3.5 h-3.5" /> PDF
              </button>
              <button onClick={() => handleExport('csv')} className="flex items-center gap-1.5 px-3 py-2 bg-surface-lighter/50 hover:bg-surface-lighter border border-border/50 rounded-xl text-xs font-medium transition-all">
                <Download className="w-3.5 h-3.5" /> CSV
              </button>
              <button onClick={() => handleExport('json')} className="flex items-center gap-1.5 px-3 py-2 bg-surface-lighter/50 hover:bg-surface-lighter border border-border/50 rounded-xl text-xs font-medium transition-all">
                <FileSpreadsheet className="w-3.5 h-3.5" /> JSON
              </button>
            </>
          )}
          <button onClick={handleScan} disabled={scanning || !account}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-primary-dark disabled:opacity-50 rounded-xl text-sm font-semibold transition-all shadow-sm shadow-primary/15">
            {scanning ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> : <Zap className="w-4 h-4" />}
            {scanning ? 'Scanning...' : 'Run Compliance Scan'}
          </button>
        </div>
      </motion.div>

      {/* Score Cards */}
      {results && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { label: 'Overall Score', value: `${summary.overall_score}%`, color: summary.overall_score >= 80 ? '#34d399' : summary.overall_score >= 50 ? '#fbbf24' : '#f87171' },
            { label: 'Checks Passed', value: summary.passed, color: '#34d399' },
            { label: 'Checks Failed', value: summary.failed, color: '#f87171' },
            { label: 'Warnings', value: summary.warnings, color: '#fbbf24' },
            { label: 'Frameworks', value: Object.keys(fwResults).length, color: '#7c3aed' },
          ].map((kpi, i) => (
            <motion.div key={kpi.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="kpi-card stat-shine">
              <p className="metric-label">{kpi.label}</p>
              <p className="text-2xl font-bold mt-1.5 tabular-nums" style={{ color: kpi.color }}>{kpi.value}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {tabs.map(({ id, label, icon: Icon, count }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition-all border ${
              activeTab === id ? 'bg-primary/10 text-primary-light border-primary/15' : 'bg-surface-light/50 text-text-muted border-border/30 hover:text-text'
            }`}>
            <Icon className="w-3.5 h-3.5" /> {label}
            {count !== undefined && count > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-surface-lighter/50 font-semibold">{count}</span>}
          </button>
        ))}
      </div>

      {/* ═══ OVERVIEW TAB ═══ */}
      {activeTab === 'overview' && results && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Framework Scores Bar */}
            <Card delay={0.05} hover={false}>
              <div className="section-title mb-4"><Shield className="w-4 h-4 text-primary-light" /><span>Framework Compliance Scores</span></div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={fwBarData} layout="vertical" barSize={16}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} width={120} />
                  <Tooltip {...CHART_TOOLTIP} />
                  <Bar dataKey="score" radius={[0, 6, 6, 0]}>
                    {fwBarData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Radar */}
            <Card delay={0.1} hover={false}>
              <div className="section-title mb-4"><Target className="w-4 h-4 text-accent-light" /><span>Compliance Radar</span></div>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData} outerRadius="70%">
                  <PolarGrid stroke="rgba(148,163,184,0.1)" />
                  <PolarAngleAxis dataKey="framework" tick={{ fill: '#94a3b8', fontSize: 9 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Score" dataKey="score" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.15} strokeWidth={2}
                    dot={{ r: 3, fill: '#7c3aed', stroke: '#1a2332', strokeWidth: 2 }} />
                </RadarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Severity Distribution */}
            <Card delay={0.15} hover={false}>
              <div className="section-title mb-4"><AlertTriangle className="w-4 h-4 text-amber-400" /><span>Risk Distribution</span></div>
              {sevPie.length > 0 ? (
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width="55%" height={180}>
                    <PieChart>
                      <Pie data={sevPie} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                        {sevPie.map(d => <Cell key={d.name} fill={SEV_COLORS[d.name]} stroke="transparent" />)}
                      </Pie>
                      <Tooltip {...CHART_TOOLTIP} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2">
                    {sevPie.map(d => (
                      <div key={d.name} className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: SEV_COLORS[d.name] }} />
                        <span className="text-[10px] text-text-muted w-14">{d.name}</span>
                        <span className="text-xs font-bold tabular-nums" style={{ color: SEV_COLORS[d.name] }}>{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-40 text-text-muted text-sm">No failures detected</div>
              )}
            </Card>

            {/* Compliance Trend */}
            <Card delay={0.2} hover={false} className="lg:col-span-2">
              <div className="section-title mb-4"><TrendingUp className="w-4 h-4 text-emerald-400" /><span>Compliance Trend</span></div>
              {trendData.length > 1 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="compGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" />
                    <XAxis dataKey="scan" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <Tooltip {...CHART_TOOLTIP} />
                    <Area type="monotone" dataKey="score" stroke="#7c3aed" fill="url(#compGrad)" strokeWidth={2}
                      dot={{ r: 3, fill: '#7c3aed', stroke: '#1a2332', strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-40 text-text-muted text-sm">Run multiple scans to see trends</div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* ═══ FRAMEWORKS TAB ═══ */}
      {activeTab === 'frameworks' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {frameworks.map((fw, i) => {
            const fwResult = fwResults[fw.id];
            const score = fwResult?.score ?? null;
            const IconComp = FW_ICONS[fw.icon] || Shield;
            return (
              <motion.div key={fw.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="border border-border/30 rounded-2xl bg-surface-light/50 p-5 hover:border-border/50 transition-all cursor-pointer"
                onClick={() => { setSelectedFw(selectedFw === fw.id ? null : fw.id); setActiveTab('controls'); }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${fw.color}15` }}>
                      <IconComp className="w-5 h-5" style={{ color: fw.color }} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-text">{fw.name}</h3>
                      <p className="text-[10px] text-text-muted">{fw.version} &bull; {fw.category}</p>
                    </div>
                  </div>
                  {score !== null && <ScoreRing score={score} size={56} strokeWidth={4} />}
                </div>
                <p className="text-xs text-text-muted leading-relaxed mb-3">{fw.description}</p>
                <div className="flex items-center gap-3 text-[10px]">
                  <span className="text-text-muted">{fw.total_controls} controls</span>
                  <span className="text-text-muted">{fw.total_checks} checks</span>
                  {fwResult && (
                    <>
                      <span className="text-emerald-400">{fwResult.passed} passed</span>
                      <span className="text-red-400">{fwResult.failed} failed</span>
                    </>
                  )}
                </div>
                {fwResult && (
                  <div className="compliance-bar mt-3">
                    <motion.div className="compliance-fill" style={{ background: `linear-gradient(90deg, ${fw.color}, ${fw.color}80)` }}
                      initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 1.2, delay: 0.3 }} />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ═══ FINDINGS TAB ═══ */}
      {activeTab === 'findings' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search findings..."
                className="w-full bg-surface-light/50 border border-border/50 rounded-xl pl-10 pr-3 py-2.5 text-sm text-text placeholder:text-text-muted/40 focus:outline-none focus:border-primary/30 transition-all" />
            </div>
            {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(sev => (
              <button key={sev} onClick={() => { const n = new Set(sevFilter); n.has(sev) ? n.delete(sev) : n.add(sev); setSevFilter(n); }}
                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider border transition-all ${
                  sevFilter.has(sev) ? 'opacity-100 border-current/20' : 'opacity-30 border-transparent'
                }`} style={{ color: SEV_COLORS[sev] }}>{sev}</button>
            ))}
          </div>

          {/* Findings List */}
          <Card hover={false}>
            <div className="section-title mb-4"><AlertTriangle className="w-4 h-4 text-amber-400" /><span>Compliance Findings ({filteredFindings.length})</span></div>
            <div className="space-y-0.5 max-h-[600px] overflow-y-auto">
              {filteredFindings.map((f, i) => {
                const isExpanded = expandedChecks.has(i);
                const statusStyle = STATUS_COLORS[f.status] || STATUS_COLORS['FAIL'];
                return (
                  <div key={i}>
                    <button onClick={() => { const n = new Set(expandedChecks); n.has(i) ? n.delete(i) : n.add(i); setExpandedChecks(n); }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-surface/40 transition-all text-left group">
                      <motion.div animate={{ rotate: isExpanded ? 90 : 0 }}><ChevronRight className="w-3.5 h-3.5 text-text-muted" /></motion.div>
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                        {f.severity}
                      </span>
                      <span className="text-sm flex-1 truncate">{f.title}</span>
                      <span className="text-[10px] text-text-muted bg-surface-lighter/30 px-2 py-0.5 rounded-md">{f.resource_type}</span>
                    </button>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                          className="ml-11 mr-4 mb-2 overflow-hidden">
                          <div className="bg-surface/40 rounded-xl p-4 space-y-3 border border-border/20">
                            <p className="text-xs text-text-muted">{f.reason}</p>
                            {f.affected_count > 0 && (
                              <div>
                                <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Affected Resources ({f.affected_count})</p>
                                <div className="flex flex-wrap gap-1">
                                  {f.affected_resources?.slice(0, 10).map((r, j) => (
                                    <span key={j} className="px-2 py-0.5 rounded-md bg-red-500/8 text-red-400 text-[10px] font-mono">{r}</span>
                                  ))}
                                  {f.affected_count > 10 && <span className="text-[10px] text-text-muted">+{f.affected_count - 10} more</span>}
                                </div>
                              </div>
                            )}
                            <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-3">
                              <p className="text-[10px] text-emerald-400 uppercase tracking-wider mb-1 font-semibold">Remediation</p>
                              <p className="text-xs text-text-muted leading-relaxed">{f.remediation}</p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
              {filteredFindings.length === 0 && <EmptyState title="No findings match" description="Adjust filters or run a compliance scan" />}
            </div>
          </Card>
        </div>
      )}

      {/* ═══ CONTROLS TAB ═══ */}
      {activeTab === 'controls' && results && (
        <div className="space-y-4">
          {/* Framework selector */}
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setSelectedFw(null)}
              className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${!selectedFw ? 'bg-primary/10 text-primary-light border-primary/15' : 'bg-surface-light/50 text-text-muted border-border/30'}`}>
              All Frameworks
            </button>
            {Object.values(fwResults).map(fw => (
              <button key={fw.framework_id} onClick={() => setSelectedFw(fw.framework_id)}
                className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${selectedFw === fw.framework_id ? 'bg-primary/10 text-primary-light border-primary/15' : 'bg-surface-light/50 text-text-muted border-border/30'}`}>
                {fw.name.length > 20 ? fw.name.slice(0, 20) + '...' : fw.name}
                <span className="ml-1.5 text-[10px] font-bold tabular-nums" style={{ color: fw.score >= 80 ? '#34d399' : fw.score >= 50 ? '#fbbf24' : '#f87171' }}>{fw.score}%</span>
              </button>
            ))}
          </div>

          {/* Controls list */}
          {Object.entries(fwResults)
            .filter(([id]) => !selectedFw || id === selectedFw)
            .map(([fwId, fw]) => (
              <div key={fwId} className="space-y-2">
                <div className="section-title"><Shield className="w-4 h-4" style={{ color: fw.color }} /><span>{fw.name}</span></div>
                {fw.controls.map((ctrl, ci) => (
                  <Card key={ci} delay={ci * 0.02} hover={false} className="!p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="text-sm font-semibold text-text">{ctrl.section}</h4>
                        <p className="text-[10px] text-text-muted">{ctrl.title}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-400 text-xs font-bold">{ctrl.passed}</span>
                        <span className="text-text-muted text-xs">/</span>
                        <span className="text-red-400 text-xs font-bold">{ctrl.failed}</span>
                        <span className="text-text-muted text-xs">/ {ctrl.total}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      {ctrl.checks.map((ch, chi) => {
                        const sty = STATUS_COLORS[ch.status] || STATUS_COLORS['N/A'];
                        return (
                          <div key={chi} className={`flex items-center gap-3 px-3 py-2 rounded-lg ${sty.bg} border ${sty.border}`}>
                            {ch.status === 'PASS' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" /> :
                             ch.status === 'FAIL' ? <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" /> :
                             <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
                            <span className="text-xs flex-1">{ch.title}</span>
                            <span className={`text-[9px] font-bold uppercase ${sty.text}`}>{ch.status}</span>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                ))}
              </div>
            ))}
        </div>
      )}

      {/* ═══ AI RECOMMENDATIONS TAB ═══ */}
      {activeTab === 'recommendations' && (
        <div className="space-y-4">
          {aiRecs.length > 0 ? aiRecs.map((rec, i) => {
            const priorityColors = { CRITICAL: '#f87171', HIGH: '#f97316', MEDIUM: '#fbbf24', LOW: '#60a5fa' };
            const color = priorityColors[rec.priority] || '#94a3b8';
            return (
              <Card key={i} delay={i * 0.05}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}15` }}>
                    <Brain className="w-5 h-5" style={{ color }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md" style={{ background: `${color}15`, color }}>{rec.priority}</span>
                      <h3 className="text-sm font-semibold text-text">{rec.title}</h3>
                    </div>
                    <p className="text-xs text-text-muted mb-2">{rec.description}</p>
                    <div className="space-y-1">
                      {rec.items?.map((item, j) => (
                        <p key={j} className="text-xs text-text-muted flex items-start gap-1.5 pl-2">
                          <span className="text-primary-light mt-0.5 text-[8px]">●</span> {item}
                        </p>
                      ))}
                    </div>
                    {rec.impact && (
                      <p className="text-[10px] text-text-muted/70 mt-2 italic">{rec.impact}</p>
                    )}
                  </div>
                </div>
              </Card>
            );
          }) : <EmptyState icon={Brain} title="No recommendations yet" description="Run a compliance scan to generate AI recommendations" />}
        </div>
      )}

      {/* No Results State */}
      {!results && !scanning && (
        <EmptyState icon={Shield} title="No compliance scan results"
          description="Click 'Run Compliance Scan' to evaluate your cloud infrastructure against 10 compliance frameworks including CIS, NIST, SOC2, ISO 27001, PCI-DSS, HIPAA, GDPR, and AWS Well-Architected."
        />
      )}
    </div>
  );
}
