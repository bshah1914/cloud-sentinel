import { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, AreaChart, Area
} from 'recharts';
import {
  Server, Shield, Globe, Database, CloudLightning, Layers,
  AlertTriangle, MapPin, ScanLine, Plus, Users, Lock, Unlock,
  HardDrive, Network, Camera, Activity, CheckCircle2, XCircle,
  ChevronDown, ChevronUp, Download, FileText, Zap
} from 'lucide-react';
import { getDashboard, exportDashboard } from '../api';
import { useToast } from '../components/Toast';
import StatCard from '../components/StatCard';
import SecurityScore from '../components/SecurityScore';
import Card from '../components/Card';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';

const SEVERITY = {
  critical: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/15', dot: 'bg-red-500' },
  high:     { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/15', dot: 'bg-orange-500' },
  medium:   { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/15', dot: 'bg-amber-500' },
  low:      { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/15', dot: 'bg-yellow-500' },
  info:     { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/15', dot: 'bg-emerald-500' },
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
  background: '#1e293b', border: '1px solid rgba(148,163,184,0.15)',
  borderRadius: '12px', color: '#f1f5f9', fontSize: '12px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
};

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
        action={<Link to="/accounts" className="px-5 py-2.5 bg-gradient-to-r from-primary to-primary-dark rounded-xl text-sm font-medium inline-flex items-center gap-2 shadow-lg shadow-primary/20"><Plus className="w-4 h-4" /> Add Account</Link>}
      />
    );
  }

  if (noData) {
    return (
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-text-muted text-sm mt-1">Account: <span className="text-accent font-medium">{account}</span></p>
        </motion.div>
        <EmptyState icon={ScanLine} title="No data collected yet"
          description={`Account "${account}" has no scan data. Run a scan to collect resource data and view the dashboard.`}
          action={<Link to="/scan" className="px-5 py-2.5 bg-gradient-to-r from-primary to-primary-dark rounded-xl text-sm font-medium inline-flex items-center gap-2 shadow-lg shadow-primary/20"><ScanLine className="w-4 h-4" /> Go to Scans</Link>}
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
    name, EC2: stats.instances || 0, SGs: stats.security_groups || 0,
    VPCs: stats.vpcs || 0, Lambda: stats.lambdas || 0,
    RDS: stats.rds || 0, ELB: stats.elbs || 0,
  }));

  const resourcePie = [
    { name: 'EC2', value: totals.instances, color: '#6366f1' },
    { name: 'S3', value: totals.buckets, color: '#06b6d4' },
    { name: 'Lambda', value: totals.lambdas, color: '#10b981' },
    { name: 'RDS', value: totals.rds, color: '#f59e0b' },
    { name: 'ELB', value: totals.elbs, color: '#ef4444' },
    { name: 'SGs', value: totals.security_groups, color: '#8b5cf6' },
  ].filter((d) => d.value > 0);

  const findings = [];
  if (!iam_summary.AccountMFAEnabled) findings.push({ text: 'Root account MFA not enabled', severity: 'critical' });
  if (iam_summary.AccountAccessKeysPresent) findings.push({ text: 'Root account has access keys', severity: 'critical' });
  if (public_summary?.rds > 0) findings.push({ text: `${public_summary.rds} publicly accessible RDS instance(s)`, severity: 'high' });
  if (open_security_groups > 0) findings.push({ text: `${open_security_groups} security group rule(s) open to 0.0.0.0/0`, severity: 'high' });
  if (public_summary?.ec2 > 0) findings.push({ text: `${public_summary.ec2} EC2 instance(s) with public IPs`, severity: 'medium' });
  if (iam_users_no_mfa > 0) findings.push({ text: `${iam_users_no_mfa} IAM user(s) without MFA`, severity: 'medium' });
  if (public_summary?.elb > 0) findings.push({ text: `${public_summary.elb} internet-facing load balancer(s)`, severity: 'low' });
  if (findings.length === 0) findings.push({ text: 'No major issues detected', severity: 'info' });

  const publicIpsToShow = showAllPublicIps ? public_ips : public_ips.slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/12 flex items-center justify-center">
              <Layers className="w-4.5 h-4.5 text-primary-light" />
            </div>
            Dashboard
          </h1>
          <p className="text-text-muted text-sm mt-1">
            Account: <span className="text-accent font-medium">{account}</span>
            {caller_identity?.Account && <span className="text-text-muted/60 ml-1">({caller_identity.Account})</span>}
          </p>
          <p className="text-text-muted text-[10px] mt-0.5">
            {regions_scanned} region(s) scanned
            {collection_date && ` \u2022 Updated ${new Date(collection_date).toLocaleString()}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => handleExport('csv')} disabled={exporting}
            className="flex items-center gap-2 px-3.5 py-2 bg-surface-lighter/50 hover:bg-surface-lighter border border-border/50 disabled:opacity-50 rounded-xl text-xs font-medium transition-all">
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
          <button onClick={() => handleExport('pdf')} disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary disabled:opacity-50 rounded-xl text-xs font-medium transition-all shadow-sm shadow-primary/15">
            <FileText className="w-3.5 h-3.5" /> Export PDF
          </button>
        </div>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        <StatCard icon={Server} label="EC2 Instances" value={totals.instances} color="primary" delay={0} />
        <StatCard icon={Database} label="S3 Buckets" value={totals.buckets} color="accent" delay={0.03} />
        <StatCard icon={Shield} label="Security Groups" value={totals.security_groups} color="warning" delay={0.06} />
        <StatCard icon={Layers} label="VPCs" value={totals.vpcs} color="success" delay={0.09} />
        <StatCard icon={CloudLightning} label="Lambda" value={totals.lambdas} color="info" delay={0.12} />
        <StatCard icon={Database} label="RDS" value={totals.rds} color="danger" delay={0.15} />
        <StatCard icon={Globe} label="ELBs" value={totals.elbs} color="primary" delay={0.18} />
        <StatCard icon={Network} label="Subnets" value={totals.subnets} color="accent" delay={0.21} />
        <StatCard icon={Camera} label="Snapshots" value={totals.snapshots} color="warning" delay={0.24} />
        <StatCard icon={HardDrive} label="NICs" value={totals.network_interfaces} color="info" delay={0.27} />
      </div>

      {/* Security Score + Findings + Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card delay={0.1} className="flex flex-col items-center justify-center">
          <SecurityScore score={security_score} />
          <div className="mt-4 grid grid-cols-2 gap-2.5 w-full text-xs">
            {[
              { label: 'MFA Enabled', value: iam_summary.AccountMFAEnabled ? 'Yes' : 'No', ok: iam_summary.AccountMFAEnabled },
              { label: 'Public IPs', value: public_ips.length, ok: public_ips.length === 0 },
              { label: 'Open SGs', value: open_security_groups, ok: open_security_groups === 0 },
              { label: 'No MFA Users', value: iam_users_no_mfa, ok: iam_users_no_mfa === 0 },
            ].map(({ label, value, ok }) => (
              <div key={label} className="flex items-center justify-between bg-surface/40 rounded-xl px-3 py-2.5 border border-border/20">
                <span className="text-text-muted text-[10px]">{label}</span>
                <span className={`font-semibold ${ok ? 'text-emerald-400' : 'text-red-400'}`}>{value}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card delay={0.15}>
          <h3 className="text-xs font-semibold text-text-muted mb-3 flex items-center gap-2 uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5" /> Security Findings
          </h3>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {findings.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.04 }}
                className={`flex items-start gap-2.5 p-3 rounded-xl ${SEVERITY[f.severity].bg} border ${SEVERITY[f.severity].border}`}>
                <span className={`mt-0.5 ${SEVERITY[f.severity].text}`}>
                  {f.severity === 'critical' || f.severity === 'high' ? <XCircle className="w-3.5 h-3.5" /> :
                   f.severity === 'info' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                </span>
                <p className="text-xs text-text flex-1">{f.text}</p>
                <SeverityBadge level={f.severity} />
              </motion.div>
            ))}
          </div>
        </Card>

        <Card delay={0.2}>
          <h3 className="text-xs font-semibold text-text-muted mb-3 uppercase tracking-wider">Resource Distribution</h3>
          {resourcePie.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={resourcePie} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value" animationDuration={800}>
                    {resourcePie.map((entry) => <Cell key={entry.name} fill={entry.color} stroke="transparent" />)}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-3 justify-center mt-2">
                {resourcePie.map((d) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs">
                    <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                    <span className="text-text-muted">{d.name}</span>
                    <span className="text-text font-semibold tabular-nums">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-48 text-text-muted text-sm">No resources</div>
          )}
        </Card>
      </div>

      {/* Region Usage Matrix */}
      {region_matrix && Object.keys(region_matrix).length > 0 && (
        <Card delay={0.25} hover={false}>
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider">Region Usage Matrix</h3>
            <span className="text-[10px] text-text-muted bg-surface-lighter/50 px-2 py-0.5 rounded-md">{Object.keys(region_matrix).length} regions</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-text-muted border-b border-border/50">
                  <th className="pb-3 text-left font-medium text-[10px] uppercase tracking-wider pr-4 sticky left-0 bg-surface-light/80 backdrop-blur-sm">Region</th>
                  {Object.keys(RESOURCE_LABELS).map((key) => (
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
                      <motion.tr key={region} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 + i * 0.015 }}
                        className={`border-b border-border/15 ${total > 0 ? 'hover:bg-white/[0.015]' : 'opacity-40'} transition-all`}>
                        <td className="py-2.5 pr-4 font-mono text-text sticky left-0 bg-surface-light/80 backdrop-blur-sm">
                          <div className="flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${total > 0 ? 'bg-emerald-400' : 'bg-gray-600'}`} />
                            {region}
                          </div>
                        </td>
                        {Object.keys(RESOURCE_LABELS).map((key) => {
                          const val = resources[key] || 0;
                          return (
                            <td key={key} className="py-2.5 text-center px-2">
                              {val > 0 ? (
                                <span className="inline-flex items-center justify-center min-w-[26px] px-1.5 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 font-semibold text-[10px]">{val}</span>
                              ) : <span className="text-gray-700">-</span>}
                            </td>
                          );
                        })}
                        <td className="py-2.5 text-center px-2">
                          <span className={`font-bold ${total > 0 ? 'text-text' : 'text-gray-700'}`}>{total}</span>
                        </td>
                      </motion.tr>
                    );
                  })}
                <tr className="border-t-2 border-border/30 font-bold">
                  <td className="py-3 pr-4 text-text sticky left-0 bg-surface-light/80 text-[10px] uppercase tracking-wider">Total</td>
                  {Object.keys(RESOURCE_LABELS).map((key) => {
                    const colTotal = Object.values(region_matrix).reduce((s, r) => s + (r[key] || 0), 0);
                    return <td key={key} className="py-3 text-center px-2 text-primary">{colTotal > 0 ? colTotal : '-'}</td>;
                  })}
                  <td className="py-3 text-center px-2 text-primary font-bold">
                    {Object.values(region_matrix).reduce((s, r) => s + Object.values(r).reduce((a, b) => a + b, 0), 0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Region Bar Chart */}
      {regionBarData.length > 0 && (
        <Card delay={0.3} hover={false}>
          <h3 className="text-xs font-semibold text-text-muted mb-4 uppercase tracking-wider">Resources by Region</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={regionBarData} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.06)" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="EC2" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="SGs" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Lambda" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="RDS" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="ELB" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Per-Region Details */}
      {activeRegions.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-text-muted mb-3 flex items-center gap-2 uppercase tracking-wider">
            <Activity className="w-3.5 h-3.5" /> Region Details ({activeRegions.length} active)
          </h2>
          <div className="space-y-2">
            {activeRegions.map(([regionName, stats], i) => (
              <motion.div key={regionName} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.025 }}
                className="bg-surface-light/80 border border-border/30 rounded-2xl overflow-hidden hover:border-border/50 transition-all">
                <button onClick={() => setExpandedRegion(expandedRegion === regionName ? null : regionName)}
                  className="w-full flex items-center justify-between p-4 hover:bg-white/[0.015] transition-all text-left">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-cyan-400" />
                    <span className="font-mono text-sm font-medium">{regionName}</span>
                    <div className="flex items-center gap-1.5 ml-2">
                      {stats.instances > 0 && <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 font-medium">{stats.instances} EC2</span>}
                      {stats.lambdas > 0 && <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 font-medium">{stats.lambdas} Lambda</span>}
                      {stats.rds > 0 && <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 font-medium">{stats.rds} RDS</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {stats.guardduty_enabled ? (
                      <span className="text-[10px] text-emerald-400 flex items-center gap-1"><Shield className="w-3 h-3" /> GuardDuty</span>
                    ) : (
                      <span className="text-[10px] text-gray-600 flex items-center gap-1"><Shield className="w-3 h-3" /> No GuardDuty</span>
                    )}
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
                          <div key={label} className="bg-surface/40 rounded-xl p-3 border border-border/20">
                            <p className="text-lg font-bold text-text tabular-nums">{value || 0}</p>
                            <p className="text-[10px] text-text-muted uppercase tracking-wider">{label}</p>
                            {sub && <p className="text-[10px] text-text-muted/60 mt-0.5">{sub}</p>}
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

      {/* Public Network Resources */}
      {public_ips.length > 0 && (
        <Card delay={0.4} hover={false}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-semibold uppercase tracking-wider">Public Network Resources ({public_ips.length})</h3>
            </div>
            {public_summary && (
              <div className="flex items-center gap-2 text-[10px]">
                {public_summary.ec2 > 0 && <span className="px-2 py-1 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/15">{public_summary.ec2} EC2</span>}
                {public_summary.rds > 0 && <span className="px-2 py-1 rounded-md bg-red-500/10 text-red-400 border border-red-500/15">{public_summary.rds} RDS</span>}
                {public_summary.elb > 0 && <span className="px-2 py-1 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/15">{public_summary.elb} ELB</span>}
              </div>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-text-muted text-left border-b border-border/50">
                  {['IP / DNS', 'Resource', 'Name', 'Type', 'Instance', 'State', 'Region'].map((h) => (
                    <th key={h} className="pb-3 font-medium text-[10px] uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {publicIpsToShow.map((ip, i) => (
                  <motion.tr key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 + i * 0.02 }}
                    className="border-b border-border/15 hover:bg-white/[0.015] transition-all">
                    <td className="py-2.5 font-mono text-amber-400 text-xs max-w-[200px] truncate">{ip.ip}</td>
                    <td className="py-2.5 font-mono text-text-muted text-xs">{ip.resource}</td>
                    <td className="py-2.5 text-xs text-text">{ip.name || '-'}</td>
                    <td className="py-2.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${
                        ip.type === 'EC2' ? 'bg-indigo-500/10 text-indigo-400' :
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
                    <td className="py-2.5 text-xs flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-text-muted" />{ip.region}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          {public_ips.length > 10 && (
            <button onClick={() => setShowAllPublicIps(!showAllPublicIps)}
              className="mt-3 text-xs text-primary hover:text-primary-light transition-colors font-medium">
              {showAllPublicIps ? 'Show less' : `Show all ${public_ips.length} resources`}
            </button>
          )}
        </Card>
      )}

      {/* IAM Overview */}
      <Card delay={0.5} hover={false}>
        <h3 className="text-xs font-semibold text-text-muted mb-4 flex items-center gap-2 uppercase tracking-wider">
          <Users className="w-3.5 h-3.5" /> IAM Overview
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-4">
          {[
            { label: 'Users', value: iam_summary.Users, color: 'text-indigo-400' },
            { label: 'Roles', value: iam_summary.Roles, color: 'text-cyan-400' },
            { label: 'Groups', value: iam_summary.Groups, color: 'text-emerald-400' },
            { label: 'Policies', value: iam_summary.Policies, color: 'text-amber-400' },
            { label: 'MFA Devices', value: iam_summary.MFADevices, color: 'text-blue-400' },
            { label: 'Keys Quota', value: iam_summary.AccessKeysPerUserQuota, color: 'text-purple-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-surface/40 rounded-xl p-3 text-center border border-border/20">
              <p className={`text-2xl font-bold tabular-nums ${color}`}>{value ?? '-'}</p>
              <p className="text-[10px] text-text-muted mt-1 uppercase tracking-wider">{label}</p>
            </div>
          ))}
        </div>
        {iam_users && iam_users.length > 0 && (
          <div className="mt-4">
            <h4 className="text-[10px] font-semibold text-text-muted mb-2 uppercase tracking-wider">IAM Users ({iam_users.length})</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-text-muted border-b border-border/50">
                    {['Username', 'MFA', 'Policies', 'Groups', 'Created'].map((h) => (
                      <th key={h} className="pb-2 text-left font-medium text-[10px] uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {iam_users.map((u) => (
                    <tr key={u.name} className="border-b border-border/15 hover:bg-white/[0.015] transition-all">
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
      </Card>
    </div>
  );
}
