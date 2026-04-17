import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Globe, Plus, X, Trash2, CheckCircle2, XCircle, AlertTriangle,
  Clock, Shield, RefreshCw, Play, Activity
} from 'lucide-react';
import Card from '../components/Card';
import { getBase } from '../api';

const CHART_TOOLTIP = {
  contentStyle: { background: '#1a2332', border: '1px solid rgba(99,102,241,0.12)', borderRadius: '12px', color: '#eef2ff', fontSize: '12px' },
};

async function fetchJSON(path, opts = {}) {
  const token = localStorage.getItem('cm_token');
  const res = await fetch(`${getBase()}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
    throw new Error(err.detail);
  }
  return res.json();
}

function UptimeBadge({ pct }) {
  if (pct === null || pct === undefined) return <span className="text-xs text-text-muted">No data</span>;
  const color = pct >= 99 ? '#10b981' : pct >= 95 ? '#f59e0b' : '#ef4444';
  return <span className="text-xs font-bold" style={{ color }}>{pct}%</span>;
}

function SSLBadge({ ssl }) {
  if (!ssl) return null;
  if (!ssl.valid) return <span className="text-[10px] text-red-400 flex items-center gap-1"><XCircle className="w-3 h-3" /> SSL invalid</span>;
  const days = ssl.days_left;
  if (days === null || days === undefined) return <span className="text-[10px] text-emerald-400 flex items-center gap-1"><Shield className="w-3 h-3" /> SSL ok</span>;
  const color = days > 30 ? '#10b981' : days > 7 ? '#f59e0b' : '#ef4444';
  return <span className="text-[10px] flex items-center gap-1" style={{ color }}><Shield className="w-3 h-3" /> {days}d left</span>;
}

export default function AvailabilityMonitoring() {
  const [monitors, setMonitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState(null);
  const [checks, setChecks] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [newMon, setNewMon] = useState({
    name: '', url: '', method: 'GET', expected_status: 200,
    expected_body: '', interval_seconds: 60,
  });

  const refresh = useCallback(async () => {
    try {
      const data = await fetchJSON('/availability/monitors');
      setMonitors(data.monitors || []);
      setError(null);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    if (!autoRefreshEnabled) return;
    const iv = setInterval(refresh, 30000);
    return () => clearInterval(iv);
    // eslint-disable-next-line
  }, [refresh]);

  // (auto-refresh flag — we use a constant true so the interval runs)
  const autoRefreshEnabled = true;

  const loadChecks = async (monitor) => {
    setSelected(monitor);
    try {
      const data = await fetchJSON(`/availability/monitors/${monitor.id}/checks?hours=24`);
      setChecks(data.checks || []);
      setStats(data.stats || null);
    } catch (e) {
      setError(e.message);
    }
  };

  const handleCreate = async () => {
    if (!newMon.name || !newMon.url) return;
    try {
      await fetchJSON('/availability/monitors', {
        method: 'POST',
        body: JSON.stringify(newMon),
      });
      setNewMon({ name: '', url: '', method: 'GET', expected_status: 200, expected_body: '', interval_seconds: 60 });
      setShowCreate(false);
      refresh();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await fetchJSON(`/availability/monitors/${id}`, { method: 'DELETE' });
      if (selected?.id === id) { setSelected(null); setChecks([]); setStats(null); }
      refresh();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleRunNow = async (id) => {
    try {
      await fetchJSON(`/availability/monitors/${id}/run`, { method: 'POST' });
      refresh();
      if (selected?.id === id) loadChecks(selected);
    } catch (e) {
      setError(e.message);
    }
  };

  // Build chart data from checks (reversed so oldest is left)
  const chartData = [...checks].reverse().map(c => ({
    time: new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    response: c.response_time_ms,
    ok: c.ok ? 1 : 0,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center">
              <Globe className="w-5 h-5 text-emerald-400" />
            </div>
            Availability Monitoring
          </h1>
          <p className="text-sm text-text-muted mt-1">Real HTTP pings from the backend — tracks uptime, response time, SSL expiry, content integrity</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary/15 text-primary-light rounded-xl text-sm font-medium border border-primary/20 hover:bg-primary/25"
        >
          <Plus className="w-4 h-4" /> Add Monitor
        </button>
      </div>

      {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">{error}</div>}

      {/* Create modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowCreate(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-surface-light border border-border/30 rounded-2xl p-6 w-full max-w-lg"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-text">New Availability Monitor</h3>
                <button onClick={() => setShowCreate(false)}><X className="w-5 h-5 text-text-muted" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-text-muted mb-1 block">Name</label>
                  <input value={newMon.name} onChange={e => setNewMon(p => ({ ...p, name: e.target.value }))}
                    placeholder="Production API" className="w-full px-3 py-2 bg-surface border border-border/30 rounded-lg text-sm text-text focus:outline-none focus:border-primary/40" />
                </div>
                <div>
                  <label className="text-xs text-text-muted mb-1 block">URL</label>
                  <input value={newMon.url} onChange={e => setNewMon(p => ({ ...p, url: e.target.value }))}
                    placeholder="https://api.example.com/health" className="w-full px-3 py-2 bg-surface border border-border/30 rounded-lg text-sm text-text focus:outline-none focus:border-primary/40" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Method</label>
                    <select value={newMon.method} onChange={e => setNewMon(p => ({ ...p, method: e.target.value }))}
                      className="w-full px-3 py-2 bg-surface border border-border/30 rounded-lg text-sm text-text focus:outline-none">
                      {['GET', 'HEAD', 'POST'].map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Expected Status</label>
                    <input type="number" value={newMon.expected_status}
                      onChange={e => setNewMon(p => ({ ...p, expected_status: parseInt(e.target.value) || 200 }))}
                      className="w-full px-3 py-2 bg-surface border border-border/30 rounded-lg text-sm text-text focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Interval (sec)</label>
                    <input type="number" value={newMon.interval_seconds}
                      onChange={e => setNewMon(p => ({ ...p, interval_seconds: parseInt(e.target.value) || 60 }))}
                      className="w-full px-3 py-2 bg-surface border border-border/30 rounded-lg text-sm text-text focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-text-muted mb-1 block">Expected body contains (optional)</label>
                  <input value={newMon.expected_body} onChange={e => setNewMon(p => ({ ...p, expected_body: e.target.value }))}
                    placeholder='e.g. "status":"ok"' className="w-full px-3 py-2 bg-surface border border-border/30 rounded-lg text-sm text-text focus:outline-none focus:border-primary/40" />
                </div>
                <button onClick={handleCreate}
                  className="w-full py-2.5 bg-primary/20 text-primary-light rounded-xl text-sm font-medium border border-primary/20 hover:bg-primary/30">
                  Create Monitor
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Monitors list */}
      {loading ? (
        <div className="text-center py-8 text-sm text-text-muted">Loading…</div>
      ) : monitors.length === 0 ? (
        <Card className="!p-8 text-center">
          <Globe className="w-10 h-10 text-text-muted mx-auto mb-3 opacity-40" />
          <h3 className="text-sm font-semibold text-text mb-1">No monitors yet</h3>
          <p className="text-xs text-text-muted mb-4">Add a URL to start tracking its availability, response time, and SSL status.</p>
          <button onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary/15 text-primary-light rounded-xl text-sm font-medium border border-primary/20">
            <Plus className="w-4 h-4" /> Add First Monitor
          </button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Monitor list */}
          <div className="lg:col-span-1 space-y-2">
            {monitors.map(m => {
              const last = m.last_check;
              const up = last?.ok;
              const isSelected = selected?.id === m.id;
              return (
                <motion.div
                  key={m.id}
                  onClick={() => loadChecks(m)}
                  whileHover={{ scale: 1.01 }}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${isSelected ? 'border-primary/40 bg-primary/5' : 'border-border/30 bg-surface-light/60 hover:bg-white/[0.03]'}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {last === null || last === undefined ? (
                      <div className="w-2 h-2 rounded-full bg-text-muted/50" />
                    ) : up ? (
                      <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                    )}
                    <h4 className="text-sm font-semibold text-text flex-1 truncate">{m.name}</h4>
                    <UptimeBadge pct={m.stats_24h?.uptime_pct} />
                  </div>
                  <p className="text-[10px] text-text-muted font-mono truncate">{m.url}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-[10px] text-text-muted">
                    {last?.response_time_ms !== undefined && last?.response_time_ms !== null && (
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {last.response_time_ms}ms</span>
                    )}
                    {last?.ssl && <SSLBadge ssl={last.ssl} />}
                    <button onClick={(e) => { e.stopPropagation(); handleRunNow(m.id); }}
                      className="ml-auto text-primary-light hover:text-primary"
                      title="Run check now"
                    >
                      <Play className="w-3 h-3" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(m.id); }}
                      className="text-text-muted hover:text-red-400" title="Delete">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Detail panel */}
          <div className="lg:col-span-2">
            {selected ? (
              <div className="space-y-4">
                <Card className="!p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-text">{selected.name}</h3>
                      <p className="text-xs text-text-muted font-mono">{selected.url}</p>
                    </div>
                    <button onClick={() => handleRunNow(selected.id)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-primary/15 text-primary-light rounded-lg text-xs font-medium border border-primary/20">
                      <Play className="w-3.5 h-3.5" /> Run Now
                    </button>
                  </div>
                  {stats && (
                    <div className="grid grid-cols-4 gap-3 mt-3">
                      <div className="p-2 rounded-lg bg-surface/50">
                        <p className="text-[10px] text-text-muted uppercase">Uptime 24h</p>
                        <p className="text-lg font-bold text-text"><UptimeBadge pct={stats.uptime_pct} /></p>
                      </div>
                      <div className="p-2 rounded-lg bg-surface/50">
                        <p className="text-[10px] text-text-muted uppercase">Total checks</p>
                        <p className="text-lg font-bold text-text">{stats.total}</p>
                      </div>
                      <div className="p-2 rounded-lg bg-surface/50">
                        <p className="text-[10px] text-text-muted uppercase">Down events</p>
                        <p className={`text-lg font-bold ${stats.down > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{stats.down}</p>
                      </div>
                      <div className="p-2 rounded-lg bg-surface/50">
                        <p className="text-[10px] text-text-muted uppercase">Avg response</p>
                        <p className="text-lg font-bold text-text">{stats.avg_response_ms !== null && stats.avg_response_ms !== undefined ? `${stats.avg_response_ms}ms` : '—'}</p>
                      </div>
                    </div>
                  )}
                </Card>

                {chartData.length > 1 && (
                  <Card>
                    <h4 className="text-sm font-semibold text-text mb-2 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-cyan-400" /> Response Time
                    </h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="rtGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.06)" />
                        <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#64748b' }} />
                        <YAxis tick={{ fontSize: 10, fill: '#64748b' }} unit="ms" />
                        <Tooltip {...CHART_TOOLTIP} />
                        <Area type="monotone" dataKey="response" stroke="#06b6d4" fill="url(#rtGrad)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </Card>
                )}

                <Card>
                  <h4 className="text-sm font-semibold text-text mb-2">Recent Checks</h4>
                  {checks.length === 0 ? (
                    <p className="text-xs text-text-muted text-center py-4">No checks yet — click "Run Now" to record the first one.</p>
                  ) : (
                    <div className="space-y-1 max-h-[400px] overflow-y-auto">
                      {checks.slice(0, 30).map((c, i) => (
                        <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.02] text-xs">
                          {c.ok ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" /> : <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />}
                          <span className="text-text-muted font-mono w-36">{new Date(c.timestamp).toLocaleString()}</span>
                          <span className={`font-medium w-12 ${c.status >= 200 && c.status < 300 ? 'text-emerald-400' : 'text-amber-400'}`}>{c.status || '—'}</span>
                          <span className="text-text-muted w-20">{c.response_time_ms !== null ? `${c.response_time_ms}ms` : '—'}</span>
                          {c.error && <span className="text-red-400 flex-1 truncate">{c.error}</span>}
                          {!c.error && c.content_match === false && <span className="text-amber-400">Content mismatch</span>}
                          {c.ssl && c.ssl.days_left !== null && c.ssl.days_left !== undefined && (
                            <span className="ml-auto text-text-muted">SSL: {c.ssl.days_left}d</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            ) : (
              <Card className="!p-8 text-center">
                <AlertTriangle className="w-10 h-10 text-text-muted mx-auto mb-3 opacity-40" />
                <p className="text-sm text-text-muted">Select a monitor on the left to see details</p>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
