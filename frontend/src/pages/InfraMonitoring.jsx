import { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import {
  Cpu, HardDrive, MemoryStick, Wifi, Activity, Server,
  RefreshCw, Clock, Monitor, Thermometer, Database,
  AlertTriangle, CheckCircle2, XCircle, Download, X, Copy
} from 'lucide-react';
import { useState as useStateModal } from 'react';
import Card from '../components/Card';
import { getBase } from '../api';

const CHART_TOOLTIP = {
  contentStyle: { background: '#1a2332', border: '1px solid rgba(99,102,241,0.12)', borderRadius: '12px', color: '#eef2ff', fontSize: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' },
};

function GaugeRing({ value, label, icon: Icon, color, max = 100, unit = '%' }) {
  const pct = Math.min((value / max) * 100, 100);
  const r = 42;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const statusColor = pct > 90 ? '#ef4444' : pct > 70 ? '#f59e0b' : color;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-28 h-28">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" className="text-border/30" strokeWidth="6" />
          <motion.circle
            cx="50" cy="50" r={r} fill="none" stroke={statusColor} strokeWidth="6"
            strokeLinecap="round" strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Icon className="w-4 h-4 mb-0.5" style={{ color: statusColor }} />
          <span className="text-lg font-bold text-text">{Math.round(value)}{unit}</span>
        </div>
      </div>
      <span className="text-xs text-text-muted font-medium">{label}</span>
    </div>
  );
}

const STATUS_COLORS = { healthy: '#10b981', warning: '#f59e0b', critical: '#ef4444', stopped: '#64748b' };
const STATUS_ICONS = { healthy: CheckCircle2, warning: AlertTriangle, critical: XCircle, stopped: XCircle };

async function fetchJSON(path) {
  const token = localStorage.getItem('cm_token');
  const res = await fetch(`${getBase()}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export default function InfraMonitoring() {
  const ctx = useOutletContext() || {};
  const account = ctx.account;
  const [metrics, setMetrics] = useState(null);
  const [agents, setAgents] = useState([]);
  const [history, setHistory] = useState([]);
  const [agentStats, setAgentStats] = useState({ total: 0, running: 0, healthy: 0, warning: 0, critical: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [error, setError] = useState(null);
  const [installInfo, setInstallInfo] = useState(null);
  const [showInstall, setShowInstall] = useState(false);

  const refresh = useCallback(async () => {
    if (!account) { setLoading(false); return; }
    setRefreshing(true);
    setError(null);
    try {
      const q = `?account=${encodeURIComponent(account)}`;
      const [m, a, h] = await Promise.all([
        fetchJSON(`/monitoring/metrics${q}`),
        fetchJSON(`/monitoring/agents${q}`),
        fetchJSON(`/monitoring/history${q}&metric=cpu&hours=24`),
      ]);
      setMetrics(m);
      setAgents(a.agents || []);
      setAgentStats({
        total: a.total || 0, running: a.running || 0,
        healthy: a.healthy || 0, warning: a.warning || 0, critical: a.critical || 0,
      });
      const chart = (h.history || []).map(pt => ({
        time: new Date(pt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        cpu: pt.cpu,
        instances: pt.instances,
      }));
      setHistory(chart);
      setLastUpdate(new Date());
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
    setRefreshing(false);
  }, [account]);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    if (!autoRefresh) return;
    const iv = setInterval(refresh, 15000);
    return () => clearInterval(iv);
  }, [autoRefresh, refresh]);

  if (!account) {
    return (
      <Card className="!p-8 text-center">
        <Server className="w-10 h-10 text-text-muted mx-auto mb-3 opacity-40" />
        <h3 className="text-sm font-semibold text-text mb-1">Select a cloud account</h3>
        <p className="text-xs text-text-muted">Choose an AWS account from the top bar to view live infrastructure metrics.</p>
      </Card>
    );
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-text-muted">Loading Provider Metrics metrics…</div>;
  }

  const cpuPct = metrics?.cpu?.usage_pct ?? 0;
  const totalInst = metrics?.instances?.total ?? 0;
  const runningInst = metrics?.instances?.running ?? 0;
  const stoppedInst = metrics?.instances?.stopped ?? 0;
  const netIn = metrics?.network?.bytes_in ?? 0;
  const netOut = metrics?.network?.bytes_out ?? 0;
  const provider = metrics?.provider || 'aws';

  // Agent install status: how many running instances have the monitoring agent?
  const runningAgents = agents.filter(a => a.state === 'running');
  const withAgent = runningAgents.filter(a => a.agent_installed).length;
  const withoutAgent = runningAgents.length - withAgent;

  const pieData = [
    { name: 'Healthy', value: agentStats.healthy, color: '#10b981' },
    { name: 'Warning', value: agentStats.warning, color: '#f59e0b' },
    { name: 'Critical', value: agentStats.critical, color: '#ef4444' },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
              <Monitor className="w-5 h-5 text-cyan-400" />
            </div>
            Infrastructure Monitoring
          </h1>
          <p className="text-sm text-text-muted mt-1">Live compute metrics from your cloud provider (AWS / Azure / GCP)</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <Clock className="w-3.5 h-3.5" />
            {lastUpdate.toLocaleTimeString()}
          </div>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${autoRefresh ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-surface-light text-text-muted border border-border/30'}`}
          >
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </button>
          <button onClick={refresh} className="p-2 rounded-lg bg-surface-light border border-border/30 hover:bg-white/[0.05] transition-all">
            <RefreshCw className={`w-4 h-4 text-text-muted ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          Error: {error}
        </div>
      )}

      {/* Agent install banner */}
      {runningAgents.length > 0 && withoutAgent > 0 && (
        <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-center gap-4">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-text">Memory &amp; disk metrics unavailable</h4>
            <p className="text-xs text-text-muted mt-0.5">
              {withoutAgent} of {runningAgents.length} running instance(s) don't have the monitoring agent installed. CPU &amp; network are visible (no agent needed); memory and disk usage require the provider's free agent.
            </p>
          </div>
          <button
            onClick={async () => {
              try {
                const token = localStorage.getItem('cm_token');
                const res = await fetch(`${getBase()}/monitoring/agent-install?provider=${provider}`, {
                  headers: token ? { Authorization: `Bearer ${token}` } : {},
                });
                const data = await res.json();
                setInstallInfo(data);
                setShowInstall(true);
              } catch (e) { setError(e.message); }
            }}
            className="flex items-center gap-2 px-3 py-2 bg-amber-500/15 text-amber-400 rounded-lg text-xs font-medium border border-amber-500/30 hover:bg-amber-500/25"
          >
            <Download className="w-3.5 h-3.5" /> Install Guide
          </button>
        </div>
      )}

      {/* Install modal */}
      {showInstall && installInfo && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowInstall(false)}>
          <div className="bg-surface-light border border-border/30 rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-text">{installInfo.agent_name}</h3>
                <p className="text-xs text-text-muted">for {installInfo.provider?.toUpperCase()}</p>
              </div>
              <button onClick={() => setShowInstall(false)} className="text-text-muted hover:text-text"><X className="w-5 h-5" /></button>
            </div>
            {installInfo.docs_url && (
              <a href={installInfo.docs_url} target="_blank" rel="noopener noreferrer" className="inline-block mb-4 text-xs text-primary-light hover:underline">
                View official documentation →
              </a>
            )}
            <h4 className="text-sm font-semibold text-text mb-2">Setup Steps</h4>
            <ol className="list-decimal list-inside space-y-1 text-xs text-text-muted mb-4">
              {(installInfo.steps || []).map((s, i) => <li key={i}>{s}</li>)}
            </ol>
            <h4 className="text-sm font-semibold text-text mb-2">Quick Install</h4>
            <div className="bg-surface rounded-lg p-3 border border-border/30 font-mono text-xs text-text whitespace-pre-wrap relative">
              {(installInfo.quick_install || []).join("\n")}
              <button
                onClick={() => navigator.clipboard.writeText((installInfo.quick_install || []).join("\n"))}
                className="absolute top-2 right-2 p-1.5 bg-surface-light rounded text-text-muted hover:text-text"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
            <h4 className="text-sm font-semibold text-text mt-4 mb-2">Metrics You'll Get</h4>
            <div className="flex flex-wrap gap-1.5">
              {(installInfo.metrics_collected || []).map(m => (
                <span key={m} className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20 font-mono">{m}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface-light/60 border border-border/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1"><Server className="w-4 h-4 text-primary-light" /><span className="text-xs text-text-muted">Compute Instances</span></div>
          <p className="text-2xl font-bold text-text">{totalInst}</p>
          <p className="text-[10px] text-text-muted mt-0.5">{runningInst} running, {stoppedInst} stopped</p>
        </div>
        <div className="bg-surface-light/60 border border-border/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1"><Cpu className="w-4 h-4 text-cyan-400" /><span className="text-xs text-text-muted">Avg CPU</span></div>
          <p className="text-2xl font-bold text-text">{cpuPct.toFixed(1)}%</p>
          <p className="text-[10px] text-text-muted mt-0.5">{metrics?.cpu?.samples || 0} Provider Metrics samples</p>
        </div>
        <div className="bg-surface-light/60 border border-border/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1"><Wifi className="w-4 h-4 text-emerald-400" /><span className="text-xs text-text-muted">Network In</span></div>
          <p className="text-2xl font-bold text-text">{(netIn / (1024 ** 2)).toFixed(1)}</p>
          <p className="text-[10px] text-text-muted mt-0.5">MB (last 10 min)</p>
        </div>
        <div className="bg-surface-light/60 border border-border/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1"><Wifi className="w-4 h-4 text-amber-400" /><span className="text-xs text-text-muted">Network Out</span></div>
          <p className="text-2xl font-bold text-text">{(netOut / (1024 ** 2)).toFixed(1)}</p>
          <p className="text-[10px] text-text-muted mt-0.5">MB (last 10 min)</p>
        </div>
      </div>

      {/* Fleet Gauge */}
      <Card>
        <div className="flex items-center gap-2 mb-6">
          <Thermometer className="w-4 h-4 text-primary-light" />
          <h3 className="text-sm font-semibold text-text">Fleet Resource Utilization</h3>
          <span className="text-[10px] text-text-muted ml-auto">Provider Metrics (last 10 min)</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>
        <div className="flex justify-around flex-wrap gap-6">
          <GaugeRing value={cpuPct} label="Avg CPU" icon={Cpu} color="#06b6d4" />
          <GaugeRing value={runningInst > 0 ? (runningInst / totalInst) * 100 : 0} label="Instance Availability" icon={Server} color="#10b981" />
        </div>
      </Card>

      {/* Historical Chart */}
      {history.length > 1 && (
        <Card>
          <h3 className="text-sm font-semibold text-text mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" /> Fleet CPU (last 24h, Provider Metrics)
            <span className="ml-auto text-[10px] text-text-muted">{history.length} samples</span>
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={history}>
              <defs>
                <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.06)" />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b' }} interval={Math.floor(history.length / 8)} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} unit="%" />
              <Tooltip {...CHART_TOOLTIP} />
              <Area type="monotone" dataKey="cpu" stroke="#06b6d4" fill="url(#cpuGrad)" strokeWidth={2} name="Avg CPU" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Agents Table + Health Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <h3 className="text-sm font-semibold text-text mb-4 flex items-center gap-2">
              <Server className="w-4 h-4 text-primary-light" /> Compute Instances
              <span className="ml-auto text-xs text-text-muted">{agents.length} total</span>
            </h3>
            {agents.length === 0 ? (
              <div className="text-center py-8 text-sm text-text-muted">
                <Server className="w-8 h-8 mx-auto mb-3 opacity-40" />
                No EC2 instances found in this account.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-text-muted text-xs border-b border-border/30">
                      <th className="text-left pb-3 font-medium">Name</th>
                      <th className="text-left pb-3 font-medium">Instance</th>
                      <th className="text-left pb-3 font-medium">Region</th>
                      <th className="text-center pb-3 font-medium">CPU</th>
                      <th className="text-center pb-3 font-medium">Memory</th>
                      <th className="text-center pb-3 font-medium">Disk</th>
                      <th className="text-center pb-3 font-medium">Agent</th>
                      <th className="text-center pb-3 font-medium">State</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agents.map((a, i) => {
                      const statusKey = a.state === 'running' ? a.status : 'stopped';
                      const sColor = STATUS_COLORS[statusKey] || '#64748b';
                      const SIcon = STATUS_ICONS[statusKey] || AlertTriangle;
                      return (
                        <motion.tr
                          key={a.instance_id + i}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.05 }}
                          className="border-b border-border/10 hover:bg-white/[0.02]"
                        >
                          <td className="py-2.5 font-medium text-text">{a.hostname}</td>
                          <td className="py-2.5 text-text-muted text-xs font-mono">{a.instance_type} · {a.instance_id?.slice(-6)}</td>
                          <td className="py-2.5 text-text-muted text-xs">{a.region}</td>
                          <td className="py-2.5 text-center">
                            {a.state === 'running' ? (
                              <span className={`text-xs font-medium ${a.cpu > 80 ? 'text-red-400' : a.cpu > 60 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                {a.cpu}%
                              </span>
                            ) : <span className="text-xs text-text-muted">—</span>}
                          </td>
                          <td className="py-2.5 text-center">
                            {a.memory !== null && a.memory !== undefined ? (
                              <span className={`text-xs font-medium ${a.memory > 80 ? 'text-red-400' : a.memory > 60 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                {a.memory}%
                              </span>
                            ) : <span className="text-xs text-text-muted/50" title="Install monitoring agent">—</span>}
                          </td>
                          <td className="py-2.5 text-center">
                            {a.disk !== null && a.disk !== undefined ? (
                              <span className={`text-xs font-medium ${a.disk > 85 ? 'text-red-400' : a.disk > 70 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                {a.disk}%
                              </span>
                            ) : <span className="text-xs text-text-muted/50" title="Install monitoring agent">—</span>}
                          </td>
                          <td className="py-2.5 text-center">
                            {a.state !== 'running' ? <span className="text-text-muted/50">—</span> : a.agent_installed ? (
                              <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">
                                <CheckCircle2 className="w-3 h-3" /> Installed
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                Missing
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 text-center">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                              style={{ background: `${sColor}15`, color: sColor }}>
                              <SIcon className="w-3 h-3" />
                              {a.state}
                            </span>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        <Card>
          <h3 className="text-sm font-semibold text-text mb-4">Agent Health</h3>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} dataKey="value" paddingAngle={3}>
                    {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip {...CHART_TOOLTIP} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-2">
                {pieData.map(d => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs text-text-muted">
                    <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                    {d.name} ({d.value})
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-sm text-text-muted">No agent data</div>
          )}
        </Card>
      </div>

      {/* Regions scanned */}
      {metrics?.regions_scanned && (
        <p className="text-center text-xs text-text-muted">Scanned {metrics.regions_scanned} AWS region(s) · data from Provider Metrics GetMetricStatistics</p>
      )}
    </div>
  );
}
