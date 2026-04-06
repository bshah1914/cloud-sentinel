import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import {
  Cpu, HardDrive, MemoryStick, Wifi, Activity, Server,
  RefreshCw, Clock, ArrowUp, ArrowDown, Monitor, Thermometer,
  Zap, Database, Globe, AlertTriangle, CheckCircle2, XCircle
} from 'lucide-react';
import Card from '../components/Card';

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
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Icon className="w-4 h-4 mb-0.5" style={{ color: statusColor }} />
          <span className="text-lg font-bold text-text">{value}{unit}</span>
        </div>
      </div>
      <span className="text-xs text-text-muted font-medium">{label}</span>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, trend, color = '#6366f1', sub }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface-light/60 backdrop-blur-sm border border-border/30 rounded-xl p-4"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
          <Icon className="w-4.5 h-4.5" style={{ color }} />
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-medium flex items-center gap-0.5 ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-text">{value}</p>
      <p className="text-xs text-text-muted mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-text-muted/60 mt-1">{sub}</p>}
    </motion.div>
  );
}

function generateMetricsHistory(points = 30) {
  const now = Date.now();
  return Array.from({ length: points }, (_, i) => {
    const t = new Date(now - (points - i) * 60000);
    return {
      time: t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      cpu: Math.round(25 + Math.random() * 40 + Math.sin(i / 5) * 15),
      memory: Math.round(55 + Math.random() * 20 + Math.cos(i / 4) * 8),
      disk_read: Math.round(Math.random() * 150 + 20),
      disk_write: Math.round(Math.random() * 80 + 10),
      net_in: Math.round(Math.random() * 500 + 100),
      net_out: Math.round(Math.random() * 300 + 50),
    };
  });
}

function generateAgents() {
  const hosts = [
    { hostname: 'prod-web-01', os: 'Ubuntu 22.04', ip: '10.0.1.15', status: 'healthy', cpu: 34, mem: 62, uptime: '45d 12h' },
    { hostname: 'prod-web-02', os: 'Ubuntu 22.04', ip: '10.0.1.16', status: 'healthy', cpu: 28, mem: 58, uptime: '45d 12h' },
    { hostname: 'prod-api-01', os: 'Amazon Linux 2', ip: '10.0.2.10', status: 'warning', cpu: 78, mem: 85, uptime: '12d 3h' },
    { hostname: 'prod-db-01', os: 'Ubuntu 20.04', ip: '10.0.3.5', status: 'healthy', cpu: 42, mem: 71, uptime: '90d 5h' },
    { hostname: 'prod-cache-01', os: 'Alpine 3.18', ip: '10.0.3.8', status: 'healthy', cpu: 15, mem: 45, uptime: '30d 8h' },
    { hostname: 'staging-web-01', os: 'Ubuntu 22.04', ip: '10.1.1.10', status: 'critical', cpu: 95, mem: 92, uptime: '5d 2h' },
    { hostname: 'prod-worker-01', os: 'Debian 12', ip: '10.0.4.20', status: 'healthy', cpu: 55, mem: 63, uptime: '20d 14h' },
    { hostname: 'prod-worker-02', os: 'Debian 12', ip: '10.0.4.21', status: 'healthy', cpu: 48, mem: 59, uptime: '20d 14h' },
  ];
  return hosts;
}

function generateProcesses() {
  return [
    { pid: 1234, name: 'nginx', cpu: 2.3, mem: 1.8, status: 'running' },
    { pid: 5678, name: 'python3 (gunicorn)', cpu: 15.7, mem: 8.4, status: 'running' },
    { pid: 9012, name: 'postgres', cpu: 8.2, mem: 12.1, status: 'running' },
    { pid: 3456, name: 'redis-server', cpu: 1.1, mem: 3.2, status: 'running' },
    { pid: 7890, name: 'node (frontend)', cpu: 4.5, mem: 5.6, status: 'running' },
    { pid: 2345, name: 'celery worker', cpu: 12.3, mem: 6.8, status: 'running' },
  ];
}

const STATUS_COLORS = { healthy: '#10b981', warning: '#f59e0b', critical: '#ef4444' };
const STATUS_ICONS = { healthy: CheckCircle2, warning: AlertTriangle, critical: XCircle };

export default function InfraMonitoring() {
  const [metrics, setMetrics] = useState(generateMetricsHistory);
  const [agents] = useState(generateAgents);
  const [processes] = useState(generateProcesses);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const currentMetrics = metrics[metrics.length - 1] || {};

  const refresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setMetrics(generateMetricsHistory());
      setLastUpdate(new Date());
      setRefreshing(false);
    }, 500);
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const iv = setInterval(refresh, 15000);
    return () => clearInterval(iv);
  }, [autoRefresh, refresh]);

  const healthyCount = agents.filter(a => a.status === 'healthy').length;
  const warningCount = agents.filter(a => a.status === 'warning').length;
  const criticalCount = agents.filter(a => a.status === 'critical').length;

  const pieData = [
    { name: 'Healthy', value: healthyCount, color: '#10b981' },
    { name: 'Warning', value: warningCount, color: '#f59e0b' },
    { name: 'Critical', value: criticalCount, color: '#ef4444' },
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
          <p className="text-sm text-text-muted mt-1">Real-time system metrics, agent health, and resource utilization</p>
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

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Connected Agents" value={agents.length} icon={Server} color="#6366f1" trend={12} sub={`${healthyCount} healthy, ${warningCount + criticalCount} issues`} />
        <StatCard label="Avg CPU Usage" value={`${currentMetrics.cpu || 0}%`} icon={Cpu} color="#06b6d4" trend={-5} sub="Across all hosts" />
        <StatCard label="Avg Memory" value={`${currentMetrics.memory || 0}%`} icon={MemoryStick} color="#8b5cf6" trend={3} sub="Total allocated" />
        <StatCard label="Network I/O" value={`${((currentMetrics.net_in || 0) / 1000).toFixed(1)} GB/s`} icon={Wifi} color="#10b981" trend={8} sub="Inbound + Outbound" />
      </div>

      {/* System Gauges */}
      <Card>
        <div className="flex items-center gap-2 mb-6">
          <Thermometer className="w-4 h-4 text-primary-light" />
          <h3 className="text-sm font-semibold text-text">System Resource Gauges</h3>
          <span className="text-[10px] text-text-muted ml-auto">Live</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>
        <div className="flex justify-around flex-wrap gap-6">
          <GaugeRing value={currentMetrics.cpu || 0} label="CPU Usage" icon={Cpu} color="#06b6d4" />
          <GaugeRing value={currentMetrics.memory || 0} label="Memory" icon={MemoryStick} color="#8b5cf6" />
          <GaugeRing value={72} label="Disk Usage" icon={HardDrive} color="#f59e0b" />
          <GaugeRing value={38} label="Swap" icon={Database} color="#ec4899" />
          <GaugeRing value={99.97} label="Uptime" icon={Activity} color="#10b981" max={100} />
        </div>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-sm font-semibold text-text mb-4 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" /> CPU & Memory Trend
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={metrics}>
              <defs>
                <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="memGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.06)" />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} unit="%" />
              <Tooltip {...CHART_TOOLTIP} />
              <Area type="monotone" dataKey="cpu" stroke="#06b6d4" fill="url(#cpuGrad)" strokeWidth={2} name="CPU" />
              <Area type="monotone" dataKey="memory" stroke="#8b5cf6" fill="url(#memGrad)" strokeWidth={2} name="Memory" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-text mb-4 flex items-center gap-2">
            <Wifi className="w-4 h-4 text-emerald-400" /> Network I/O
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={metrics}>
              <defs>
                <linearGradient id="netInGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="netOutGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.06)" />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} unit=" KB/s" />
              <Tooltip {...CHART_TOOLTIP} />
              <Area type="monotone" dataKey="net_in" stroke="#10b981" fill="url(#netInGrad)" strokeWidth={2} name="Inbound" />
              <Area type="monotone" dataKey="net_out" stroke="#f59e0b" fill="url(#netOutGrad)" strokeWidth={2} name="Outbound" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Agents Table + Agent Health Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <h3 className="text-sm font-semibold text-text mb-4 flex items-center gap-2">
              <Server className="w-4 h-4 text-primary-light" /> Connected Agents
              <span className="ml-auto text-xs text-text-muted">{agents.length} hosts</span>
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-text-muted text-xs border-b border-border/30">
                    <th className="text-left pb-3 font-medium">Host</th>
                    <th className="text-left pb-3 font-medium">OS</th>
                    <th className="text-left pb-3 font-medium">IP</th>
                    <th className="text-center pb-3 font-medium">CPU</th>
                    <th className="text-center pb-3 font-medium">Memory</th>
                    <th className="text-center pb-3 font-medium">Uptime</th>
                    <th className="text-center pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {agents.map((a, i) => {
                    const SIcon = STATUS_ICONS[a.status];
                    return (
                      <motion.tr
                        key={a.hostname}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="border-b border-border/10 hover:bg-white/[0.02]"
                      >
                        <td className="py-2.5 font-medium text-text">{a.hostname}</td>
                        <td className="py-2.5 text-text-muted">{a.os}</td>
                        <td className="py-2.5 text-text-muted font-mono text-xs">{a.ip}</td>
                        <td className="py-2.5 text-center">
                          <span className={`text-xs font-medium ${a.cpu > 80 ? 'text-red-400' : a.cpu > 60 ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {a.cpu}%
                          </span>
                        </td>
                        <td className="py-2.5 text-center">
                          <span className={`text-xs font-medium ${a.mem > 80 ? 'text-red-400' : a.mem > 60 ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {a.mem}%
                          </span>
                        </td>
                        <td className="py-2.5 text-center text-text-muted text-xs">{a.uptime}</td>
                        <td className="py-2.5 text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{ background: `${STATUS_COLORS[a.status]}15`, color: STATUS_COLORS[a.status] }}>
                            <SIcon className="w-3 h-3" />
                            {a.status}
                          </span>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <Card>
          <h3 className="text-sm font-semibold text-text mb-4">Agent Health</h3>
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
        </Card>
      </div>

      {/* Top Processes */}
      <Card>
        <h3 className="text-sm font-semibold text-text mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" /> Top Processes
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {processes.map(p => (
            <div key={p.pid} className="bg-surface/50 border border-border/20 rounded-lg p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-mono text-primary-light">
                {p.pid}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text truncate">{p.name}</p>
                <div className="flex gap-3 mt-0.5">
                  <span className="text-[10px] text-cyan-400">CPU {p.cpu}%</span>
                  <span className="text-[10px] text-violet-400">MEM {p.mem}%</span>
                </div>
              </div>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">{p.status}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Disk Partitions */}
      <Card>
        <h3 className="text-sm font-semibold text-text mb-4 flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-amber-400" /> Disk Partitions
        </h3>
        <div className="space-y-3">
          {[
            { mount: '/', total: '100 GB', used: '72 GB', pct: 72 },
            { mount: '/data', total: '500 GB', used: '215 GB', pct: 43 },
            { mount: '/var/log', total: '50 GB', used: '38 GB', pct: 76 },
            { mount: '/tmp', total: '20 GB', used: '2 GB', pct: 10 },
          ].map(d => (
            <div key={d.mount} className="flex items-center gap-4">
              <span className="text-xs font-mono text-text-muted w-20">{d.mount}</span>
              <div className="flex-1 h-2 bg-border/20 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: d.pct > 80 ? '#ef4444' : d.pct > 60 ? '#f59e0b' : '#10b981' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${d.pct}%` }}
                  transition={{ duration: 0.8 }}
                />
              </div>
              <span className="text-xs text-text-muted w-28 text-right">{d.used} / {d.total} ({d.pct}%)</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
