import { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, AreaChart, Area
} from 'recharts';
import {
  Brain, Sparkles, Shield, AlertTriangle, TrendingUp, Zap,
  CheckCircle2, XCircle, ArrowRight, RefreshCw, Bot, Target,
  Lightbulb, Activity, Server, Lock, Globe, Eye
} from 'lucide-react';
import { getDashboard, getMultiCloudOverview } from '../api';
import Card from '../components/Card';
import Loader from '../components/Loader';

const SEVERITY_COLORS = { CRITICAL: '#ef4444', HIGH: '#f97316', MEDIUM: '#eab308', LOW: '#3b82f6', INFO: '#10b981' };
const TOOLTIP_STYLE = { background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(148,163,184,0.1)', borderRadius: '12px', color: '#f1f5f9', fontSize: '12px' };

function InsightCard({ icon: Icon, title, value, description, color, delay = 0 }) {
  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="bg-surface-light/80 border border-border/30 rounded-2xl p-5 hover:border-border/50 transition-all">
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center`} style={{ background: `${color}15` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div className="flex-1">
          <p className="text-xs text-text-muted uppercase tracking-wider font-medium">{title}</p>
          <p className="text-xl font-bold text-text mt-0.5">{value}</p>
          <p className="text-xs text-text-muted mt-1.5 leading-relaxed">{description}</p>
        </div>
      </div>
    </motion.div>
  );
}

function RiskHeatCell({ label, value, max }) {
  const intensity = max > 0 ? value / max : 0;
  const color = intensity > 0.7 ? '#ef4444' : intensity > 0.4 ? '#f59e0b' : intensity > 0 ? '#10b981' : '#1e293b';
  return (
    <div className="text-center">
      <div className="w-full aspect-square rounded-xl flex items-center justify-center text-xs font-bold"
        style={{ background: `${color}25`, color, border: `1px solid ${color}30` }}>
        {value}
      </div>
      <p className="text-[9px] text-text-muted mt-1 truncate">{label}</p>
    </div>
  );
}

export default function AiDashboard() {
  const { account, provider } = useOutletContext();
  const [data, setData] = useState(null);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiInsights, setAiInsights] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    if (!account) return;
    setLoading(true);
    Promise.all([
      getDashboard(account, provider).catch(() => null),
      getMultiCloudOverview().catch(() => null),
    ]).then(([d, o]) => {
      setData(d);
      setOverview(o);
      if (d) generateInsights(d);
    }).finally(() => setLoading(false));
  }, [account, provider]);

  const generateInsights = (dashData) => {
    setLoadingAi(true);
    const token = localStorage.getItem('cm_token');
    fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ message: 'Give me a comprehensive security analysis with risk assessment, top priorities, and actionable recommendations. Be specific with resource IDs.' }),
    })
      .then((r) => r.json())
      .then((res) => setAiInsights(res.response))
      .catch(() => setAiInsights('Unable to generate AI insights.'))
      .finally(() => setLoadingAi(false));
  };

  if (loading) return <Loader text="AI analyzing your cloud..." />;
  if (!data) return <div className="text-center py-20 text-text-muted">No data available. Run a scan first.</div>;

  const { totals, security_score, findings_summary, findings, regions, public_ips, iam_summary, open_security_groups, regions_scanned } = data;
  const totalResources = Object.values(totals || {}).reduce((s, v) => s + (typeof v === 'number' ? v : 0), 0);
  const totalFindings = Object.values(findings_summary || {}).reduce((s, v) => s + v, 0);
  const criticalCount = (findings_summary?.CRITICAL || 0);
  const highCount = (findings_summary?.HIGH || 0);

  // Risk level
  const riskLevel = criticalCount > 0 ? 'CRITICAL' : highCount > 5 ? 'HIGH' : highCount > 0 ? 'MEDIUM' : 'LOW';
  const riskColor = { CRITICAL: '#ef4444', HIGH: '#f97316', MEDIUM: '#eab308', LOW: '#10b981' }[riskLevel];

  // Severity data for pie
  const severityPie = Object.entries(findings_summary || {}).filter(([, v]) => v > 0).map(([k, v]) => ({ name: k, value: v, color: SEVERITY_COLORS[k] }));

  // Category breakdown
  const categories = {};
  (findings || []).forEach((f) => { categories[f.category || 'other'] = (categories[f.category || 'other'] || 0) + 1; });
  const categoryData = Object.entries(categories).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));

  // Region risk
  const regionRisk = {};
  (findings || []).forEach((f) => { if (f.region) regionRisk[f.region] = (regionRisk[f.region] || 0) + 1; });
  const regionData = Object.entries(regionRisk).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const maxRegionRisk = Math.max(...regionData.map(([, v]) => v), 1);

  // Security posture radar
  const radarData = [
    { axis: 'Identity', value: iam_summary?.AccountMFAEnabled ? 80 : 20 },
    { axis: 'Network', value: open_security_groups > 10 ? 15 : open_security_groups > 0 ? 40 : 90 },
    { axis: 'Data', value: criticalCount > 0 ? 20 : 80 },
    { axis: 'Compute', value: totalResources > 0 ? 70 : 50 },
    { axis: 'Monitoring', value: 60 },
    { axis: 'Compliance', value: security_score || 50 },
  ];

  // Auto-suggest widgets based on data
  const suggestedWidgets = [];
  if (criticalCount + highCount > 0) suggestedWidgets.push({ id: 'top-findings', name: 'Top Findings', icon: AlertTriangle, reason: `${criticalCount + highCount} critical/high issues need visibility` });
  if (open_security_groups > 0) suggestedWidgets.push({ id: 'severity-pie', name: 'Severity Distribution', icon: Shield, reason: `${open_security_groups} open security groups detected` });
  if ((public_ips || []).length > 0) suggestedWidgets.push({ id: 'public-ips', name: 'Public IPs', icon: Globe, reason: `${public_ips.length} public-facing resources` });
  if (totalResources > 50) suggestedWidgets.push({ id: 'resource-bar', name: 'Resources by Region', icon: Server, reason: `${totalResources} resources across ${regions_scanned} regions` });
  suggestedWidgets.push({ id: 'security-score', name: 'Security Score', icon: Shield, reason: 'Track your overall security posture' });
  suggestedWidgets.push({ id: 'trend-chart', name: 'Score Trend', icon: TrendingUp, reason: 'Monitor improvements over time' });

  // Priority actions
  const priorities = [];
  if (criticalCount > 0) priorities.push({ icon: XCircle, text: `Fix ${criticalCount} critical findings immediately`, severity: 'critical', color: '#ef4444' });
  if (!iam_summary?.AccountMFAEnabled) priorities.push({ icon: Lock, text: 'Enable MFA on root account', severity: 'critical', color: '#ef4444' });
  if (open_security_groups > 0) priorities.push({ icon: Globe, text: `Close ${open_security_groups} security groups open to 0.0.0.0/0`, severity: 'high', color: '#f97316' });
  if (highCount > 0) priorities.push({ icon: AlertTriangle, text: `Review ${highCount} high severity findings`, severity: 'high', color: '#f97316' });
  if ((public_ips || []).length > 0) priorities.push({ icon: Eye, text: `Review ${public_ips.length} public-facing resources`, severity: 'medium', color: '#eab308' });
  if (priorities.length === 0) priorities.push({ icon: CheckCircle2, text: 'No critical actions needed', severity: 'low', color: '#10b981' });

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.8 }}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Brain className="w-5 h-5 text-white" />
          </motion.div>
          <div>
            <h1 className="text-2xl font-bold text-text">AI Security Dashboard</h1>
            <p className="text-xs text-text-muted mt-0.5">Intelligent analysis for <span className="text-accent font-medium">{account}</span></p>
          </div>
        </div>
        <button onClick={() => generateInsights(data)} disabled={loadingAi}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 rounded-xl text-xs font-medium shadow-lg shadow-violet-500/20 disabled:opacity-50">
          <RefreshCw className={`w-3.5 h-3.5 ${loadingAi ? 'animate-spin' : ''}`} />
          {loadingAi ? 'Analyzing...' : 'Re-analyze'}
        </button>
      </motion.div>

      {/* Risk Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <InsightCard icon={Shield} title="Risk Level" value={riskLevel} color={riskColor} delay={0}
          description={`Security score: ${security_score}/100. ${totalFindings} findings across ${regions_scanned} regions.`} />
        <InsightCard icon={Server} title="Attack Surface" value={`${totalResources} resources`} color="#06b6d4" delay={0.05}
          description={`${(public_ips || []).length} public IPs, ${open_security_groups} open security groups.`} />
        <InsightCard icon={AlertTriangle} title="Critical Issues" value={criticalCount + highCount} color="#f97316" delay={0.1}
          description={`${criticalCount} critical, ${highCount} high severity findings need attention.`} />
        <InsightCard icon={Target} title="Compliance" value={`${security_score}%`} color="#10b981" delay={0.15}
          description={`Based on ${totalFindings} audit findings across your infrastructure.`} />
      </div>

      {/* Priority Actions */}
      <Card delay={0.2} hover={false}>
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-bold text-text uppercase tracking-wider">Priority Actions</span>
        </div>
        <div className="space-y-2">
          {priorities.map((p, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.05 }}
              className="flex items-center gap-3 p-3 rounded-xl border transition-all"
              style={{ background: `${p.color}08`, borderColor: `${p.color}20` }}>
              <p.icon className="w-4 h-4 flex-shrink-0" style={{ color: p.color }} />
              <span className="text-sm text-text flex-1">{p.text}</span>
              <ArrowRight className="w-3.5 h-3.5 text-text-muted" />
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Severity Distribution */}
        <Card delay={0.25} hover={false}>
          <p className="text-xs font-bold text-text uppercase tracking-wider mb-4">Severity Distribution</p>
          {severityPie.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={severityPie} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                  {severityPie.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-text-muted text-xs text-center py-10">No findings</p>}
        </Card>

        {/* Security Posture Radar */}
        <Card delay={0.3} hover={false}>
          <p className="text-xs font-bold text-text uppercase tracking-wider mb-4">Security Posture</p>
          <ResponsiveContainer width="100%" height={180}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(148,163,184,0.1)" />
              <PolarAngleAxis dataKey="axis" tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <PolarRadiusAxis tick={false} domain={[0, 100]} />
              <Radar dataKey="value" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.2} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </Card>

        {/* Category Breakdown */}
        <Card delay={0.35} hover={false}>
          <p className="text-xs font-bold text-text uppercase tracking-wider mb-4">Findings by Category</p>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={categoryData} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} width={80} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="value" fill="#7c3aed" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-text-muted text-xs text-center py-10">No data</p>}
        </Card>
      </div>

      {/* Region Risk Heatmap */}
      {regionData.length > 0 && (
        <Card delay={0.4} hover={false}>
          <p className="text-xs font-bold text-text uppercase tracking-wider mb-4">Region Risk Heatmap</p>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
            {regionData.map(([region, count]) => (
              <RiskHeatCell key={region} label={region} value={count} max={maxRegionRisk} />
            ))}
          </div>
        </Card>
      )}

      {/* AI Insights */}
      <Card delay={0.45} hover={false}>
        <div className="flex items-center gap-2 mb-4">
          <Bot className="w-4 h-4 text-violet-400" />
          <span className="text-sm font-bold text-text uppercase tracking-wider">AI Security Analysis</span>
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-400 font-medium border border-violet-500/20">AI Generated</span>
        </div>
        {loadingAi ? (
          <div className="flex items-center gap-3 py-8 justify-center">
            <RefreshCw className="w-5 h-5 text-violet-400 animate-spin" />
            <span className="text-sm text-text-muted">AI is analyzing your infrastructure...</span>
          </div>
        ) : aiInsights ? (
          <div className="prose prose-sm max-w-none">
            {aiInsights.split('\n').map((line, i) => {
              if (line.startsWith('## ')) return <h3 key={i} className="text-sm font-bold text-text mt-3 mb-1">{line.replace('## ', '')}</h3>;
              if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="text-xs font-semibold text-text mt-2">{line.replace(/\*\*/g, '')}</p>;
              if (line.startsWith('- ')) return <p key={i} className="text-xs text-text-muted pl-4 py-0.5">• {line.slice(2)}</p>;
              if (line.trim()) return <p key={i} className="text-xs text-text-muted leading-relaxed">{line}</p>;
              return null;
            })}
          </div>
        ) : (
          <p className="text-text-muted text-sm text-center py-4">Click "Re-analyze" to generate AI insights</p>
        )}
      </Card>

      {/* Smart Recommendations */}
      <Card delay={0.5} hover={false}>
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-bold text-text uppercase tracking-wider">Smart Recommendations</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <SmartRecommendation
            title="Enable MFA Everywhere"
            description={iam_summary?.AccountMFAEnabled ? 'Root MFA is enabled. Ensure all IAM users have MFA too.' : 'Root account MFA is disabled. This is your highest priority security fix.'}
            impact={iam_summary?.AccountMFAEnabled ? 'low' : 'critical'}
            effort="low"
            category="Identity"
          />
          <SmartRecommendation
            title="Close Open Security Groups"
            description={open_security_groups > 0 ? `${open_security_groups} security groups are open to 0.0.0.0/0. Restrict to specific CIDRs.` : 'All security groups are properly restricted.'}
            impact={open_security_groups > 5 ? 'critical' : open_security_groups > 0 ? 'high' : 'resolved'}
            effort="medium"
            category="Network"
          />
          <SmartRecommendation
            title="Remove Public Access"
            description={`${(public_ips || []).length} resources have public IPs. Consider using private subnets with NAT gateway.`}
            impact={(public_ips || []).length > 10 ? 'high' : (public_ips || []).length > 0 ? 'medium' : 'resolved'}
            effort="medium"
            category="Exposure"
          />
          <SmartRecommendation
            title="Enable GuardDuty"
            description="Enable AWS GuardDuty across all regions for continuous threat detection and anomaly monitoring."
            impact="medium"
            effort="low"
            category="Monitoring"
          />
          <SmartRecommendation
            title="Encrypt Data at Rest"
            description="Ensure all RDS instances, S3 buckets, and EBS volumes have encryption enabled."
            impact={criticalCount > 0 ? 'high' : 'medium'}
            effort="medium"
            category="Data"
          />
          <SmartRecommendation
            title="Review IAM Policies"
            description="Audit IAM policies for least-privilege. Remove unused roles and excessive permissions."
            impact="medium"
            effort="high"
            category="Access"
          />
        </div>
      </Card>

      {/* Auto-Suggest Widgets */}
      <Card delay={0.55} hover={false}>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-bold text-text uppercase tracking-wider">Suggested Dashboard Widgets</span>
        </div>
        <p className="text-xs text-text-muted mb-4">Based on your scan data, we recommend adding these widgets to your custom dashboard:</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {suggestedWidgets.map((sw, i) => (
            <motion.div key={sw.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + i * 0.05 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-surface/40 border border-border/20 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                <sw.icon className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-text">{sw.name}</p>
                <p className="text-[10px] text-text-muted">{sw.reason}</p>
              </div>
            </motion.div>
          ))}
        </div>
        <a href="/custom-dashboard" className="inline-flex items-center gap-2 mt-4 text-xs text-cyan-400 hover:text-cyan-300 font-medium">
          Open Custom Dashboard <ArrowRight className="w-3 h-3" />
        </a>
      </Card>

      {/* AI Chatbot */}
      <AiChatInline account={account} />
    </div>
  );
}

/* ── Smart Recommendation Card ── */
function SmartRecommendation({ title, description, impact, effort, category }) {
  const impactColors = {
    critical: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', label: 'Critical' },
    high: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20', label: 'High' },
    medium: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', label: 'Medium' },
    low: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', label: 'Low' },
    resolved: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', label: 'Resolved' },
  };
  const effortColors = { low: 'text-emerald-400', medium: 'text-amber-400', high: 'text-red-400' };
  const ic = impactColors[impact] || impactColors.medium;

  return (
    <div className={`p-4 rounded-xl border ${ic.border} ${ic.bg}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-text">{title}</span>
        <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${ic.bg} ${ic.text} border ${ic.border}`}>{ic.label}</span>
      </div>
      <p className="text-[11px] text-text-muted leading-relaxed">{description}</p>
      <div className="flex items-center gap-4 mt-2.5 text-[10px]">
        <span className="text-text-muted">Category: <span className="text-text font-medium">{category}</span></span>
        <span className="text-text-muted">Effort: <span className={`font-medium ${effortColors[effort]}`}>{effort}</span></span>
      </div>
    </div>
  );
}

/* ── Inline AI Chatbot ── */
function AiChatInline({ account }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  const QUICK_QUESTIONS = [
    'What are my top 3 security risks?',
    'How can I improve my score?',
    'Show me publicly exposed resources',
    'What compliance gaps do I have?',
    'Explain my IAM configuration',
    'Which regions need attention?',
  ];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (msg) => {
    const text = msg || input;
    if (!text.trim()) return;
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setInput('');
    setLoading(true);
    try {
      const token = localStorage.getItem('cm_token');
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: 'ai', content: data.response }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'ai', content: 'Sorry, unable to process your request.' }]);
    }
    setLoading(false);
  };

  return (
    <Card delay={0.6} hover={false}>
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-4 h-4 text-violet-400" />
        <span className="text-sm font-bold text-text uppercase tracking-wider">Ask AI About Your Cloud</span>
      </div>

      {/* Quick Questions */}
      {messages.length === 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
          {QUICK_QUESTIONS.map((q) => (
            <button key={q} onClick={() => sendMessage(q)}
              className="text-left p-3 rounded-xl bg-surface/40 border border-border/20 hover:border-violet-500/30 hover:bg-violet-500/5 transition-all text-[11px] text-text-muted hover:text-text">
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Chat Messages */}
      {messages.length > 0 && (
        <div className="max-h-80 overflow-y-auto space-y-3 mb-4 pr-2">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role === 'ai' && (
                <div className="w-6 h-6 rounded-lg bg-violet-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5 text-violet-400" />
                </div>
              )}
              <div className={`max-w-[80%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-primary/15 text-text border border-primary/20'
                  : 'bg-surface/60 text-text-muted border border-border/20'
              }`}>
                {msg.content.split('\n').map((line, j) => {
                  if (line.startsWith('## ')) return <p key={j} className="font-bold text-text mt-1">{line.replace('## ', '')}</p>;
                  if (line.startsWith('- ')) return <p key={j} className="pl-2 py-0.5">• {line.slice(2)}</p>;
                  if (line.trim()) return <p key={j}>{line}</p>;
                  return <br key={j} />;
                })}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-text-muted text-xs">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-violet-400" />
              Thinking...
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2">
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Ask about your cloud security..."
          className="flex-1 bg-surface/50 border border-border/40 rounded-xl px-4 py-2.5 text-xs text-text placeholder:text-text-muted/40 focus:outline-none focus:border-violet-500/40" />
        <button onClick={() => sendMessage()} disabled={loading || !input.trim()}
          className="px-4 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5" /> Ask
        </button>
      </div>
    </Card>
  );
}
