import { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts';
import {
  Shield, ShieldCheck, Key, AlertTriangle, CheckCircle2, XCircle,
  Copy, Plus, Trash2, Clock, Activity, Ban, KeyRound, RefreshCw
} from 'lucide-react';
import Card from '../components/Card';
import { getBase } from '../api';

const SEVERITY_COLORS = { critical: '#ef4444', warning: '#f59e0b', info: '#3b82f6' };
const STATUS_COLORS = { blocked: '#ef4444', throttled: '#f59e0b', rejected: '#f59e0b', accepted: '#10b981' };

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

export default function SecurityCenter() {
  const ctx = useOutletContext() || {};
  const account = ctx.account;
  const [posture, setPosture] = useState(null);
  const [events, setEvents] = useState([]);
  const [apiKeys, setApiKeys] = useState([]);
  const [newKey, setNewKey] = useState(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const accountQuery = account ? `?account=${encodeURIComponent(account)}` : '';
      const [p, e, k] = await Promise.all([
        fetchJSON(`/security/posture${accountQuery}`),
        fetchJSON(`/security/events${accountQuery}`),
        fetchJSON('/security/api-keys'),
      ]);
      setPosture(p);
      setEvents(e.events || []);
      setApiKeys(k.keys || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh, account]);

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) return;
    try {
      const result = await fetchJSON('/security/api-keys', {
        method: 'POST',
        body: JSON.stringify({ name: newKeyName, permissions: ['read'] }),
      });
      setNewKey(result);
      setNewKeyName('');
      refresh();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleRevokeKey = async (id) => {
    try {
      await fetchJSON(`/security/api-keys/${id}`, { method: 'DELETE' });
      refresh();
    } catch (e) {
      setError(e.message);
    }
  };

  const overallScore = posture?.overall_score ?? 0;
  const totalFindings = posture?.total_findings ?? 0;
  const categories = posture?.categories ?? [];
  const criticalEvents = events.filter(e => e.severity === 'critical').length;
  const blockedEvents = events.filter(e => e.status === 'blocked' || e.status === 'throttled').length;
  const scoreColor = overallScore >= 90 ? '#10b981' : overallScore >= 70 ? '#f59e0b' : '#ef4444';

  const pieData = [
    { name: 'Secure', value: overallScore, color: scoreColor },
    { name: 'Gaps', value: 100 - overallScore, color: '#1e293b' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            Security Center
          </h1>
          <p className="text-sm text-text-muted mt-1">Real-time posture from runtime checks, security events from auth logs, and API key management</p>
        </div>
        <button onClick={refresh} className="p-2 rounded-lg bg-surface-light border border-border/30 hover:bg-white/[0.05]">
          <RefreshCw className="w-4 h-4 text-text-muted" />
        </button>
      </div>

      {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">{error}</div>}

      {/* Top Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface-light/60 border border-border/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1"><Shield className="w-4 h-4" style={{ color: scoreColor }} /><span className="text-xs text-text-muted">Security Score</span></div>
          <p className="text-2xl font-bold" style={{ color: scoreColor }}>{overallScore}/100</p>
        </div>
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1"><AlertTriangle className="w-4 h-4 text-red-400" /><span className="text-xs text-red-400">Critical Events</span></div>
          <p className="text-2xl font-bold text-red-400">{criticalEvents}</p>
        </div>
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1"><Ban className="w-4 h-4 text-emerald-400" /><span className="text-xs text-emerald-400">Blocked / Throttled</span></div>
          <p className="text-2xl font-bold text-emerald-400">{blockedEvents}</p>
        </div>
        <div className="bg-surface-light/60 border border-border/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1"><Key className="w-4 h-4 text-cyan-400" /><span className="text-xs text-text-muted">Active API Keys</span></div>
          <p className="text-2xl font-bold text-text">{apiKeys.filter(k => k.status === 'active').length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-light/40 p-1 rounded-xl w-fit border border-border/20">
        {[
          { id: 'overview', label: 'Security Posture', icon: Shield },
          { id: 'events', label: 'Threat Events', icon: AlertTriangle },
          { id: 'api-keys', label: 'API Keys', icon: Key },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all ${tab === t.id ? 'bg-primary/15 text-primary-light' : 'text-text-muted hover:text-text'}`}
          >
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <h3 className="text-sm font-semibold text-text mb-4">Overall Security Score</h3>
            <div className="flex justify-center">
              <div className="relative w-40 h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={70} startAngle={90} endAngle={-270} dataKey="value" paddingAngle={0}>
                      {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold" style={{ color: scoreColor }}>{overallScore}</span>
                  <span className="text-[10px] text-text-muted">out of 100</span>
                </div>
              </div>
            </div>
            <p className="text-center text-xs text-text-muted mt-2">{totalFindings} findings to address</p>
          </Card>

          <div className="lg:col-span-2">
            <Card>
              <h3 className="text-sm font-semibold text-text mb-4">Category Breakdown (Live Checks)</h3>
              <div className="space-y-3">
                {categories.map(cat => {
                  const catColor = cat.score >= 90 ? '#10b981' : cat.score >= 70 ? '#f59e0b' : '#ef4444';
                  return (
                    <div key={cat.category}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-text">{cat.category}</span>
                        <div className="flex items-center gap-2">
                          {cat.findings > 0 && <span className="text-[10px] text-amber-400">{cat.findings} finding{cat.findings > 1 ? 's' : ''}</span>}
                          <span className="text-xs font-bold" style={{ color: catColor }}>{cat.score}%</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-border/20 rounded-full overflow-hidden">
                        <motion.div className="h-full rounded-full" style={{ background: catColor }} initial={{ width: 0 }} animate={{ width: `${cat.score}%` }} transition={{ duration: 0.8 }} />
                      </div>
                      {cat.details && cat.details.length > 0 && (
                        <ul className="mt-1.5 ml-1 text-[10px] text-text-muted/80 space-y-0.5">
                          {cat.details.map((d, i) => <li key={i}>• {d}</li>)}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Events Tab */}
      {tab === 'events' && (
        <div className="space-y-2">
          {loading ? (
            <div className="text-center py-8 text-sm text-text-muted">Loading…</div>
          ) : events.length === 0 ? (
            <Card className="!p-8 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3 opacity-60" />
              <h3 className="text-sm font-semibold text-text mb-1">No security events</h3>
              <p className="text-xs text-text-muted">No failed logins, blocked accounts, or rate limit hits detected in recent logs.</p>
            </Card>
          ) : (
            events.map((evt, i) => (
              <motion.div key={evt.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                <Card className="!p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${SEVERITY_COLORS[evt.severity]}15` }}>
                      <AlertTriangle className="w-4 h-4" style={{ color: SEVERITY_COLORS[evt.severity] }} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-semibold text-text capitalize">{evt.type.replace(/_/g, ' ')}</h4>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: `${SEVERITY_COLORS[evt.severity]}15`, color: SEVERITY_COLORS[evt.severity] }}>{evt.severity}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: `${STATUS_COLORS[evt.status] || '#3b82f6'}15`, color: STATUS_COLORS[evt.status] || '#3b82f6' }}>{evt.status}</span>
                      </div>
                      <p className="text-xs text-text-muted">{evt.detail}</p>
                      <div className="flex gap-4 mt-1.5 text-[10px] text-text-muted">
                        <span>Source: <span className="font-mono text-text">{evt.source}</span></span>
                        <span>Target: <span className="font-mono text-text">{evt.target}</span></span>
                        {evt.count > 1 && <span>Count: <span className="text-text font-medium">{evt.count}</span></span>}
                        <span>{new Date(evt.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* API Keys Tab */}
      {tab === 'api-keys' && (
        <div className="space-y-4">
          {newKey && (
            <Card className="!p-4 border border-emerald-500/30 bg-emerald-500/5">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-emerald-400 mb-1">API Key Created</h4>
                  <p className="text-xs text-text-muted mb-2">Copy this key now. You won't see it again.</p>
                  <div className="flex gap-2">
                    <code className="flex-1 px-3 py-2 bg-surface font-mono text-xs text-text rounded-lg border border-border/30 break-all">{newKey.key}</code>
                    <button onClick={() => { navigator.clipboard.writeText(newKey.key); }} className="px-3 py-2 bg-primary/15 text-primary-light rounded-lg text-xs font-medium border border-primary/20">
                      <Copy className="w-4 h-4" />
                    </button>
                    <button onClick={() => setNewKey(null)} className="px-3 py-2 bg-surface-light text-text-muted rounded-lg text-xs font-medium border border-border/30">
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={newKeyName}
              onChange={e => setNewKeyName(e.target.value)}
              placeholder="Key name (e.g. 'Production CI/CD')"
              className="flex-1 px-3 py-2 bg-surface-light border border-border/30 rounded-xl text-sm text-text focus:outline-none focus:border-primary/40"
            />
            <button onClick={handleCreateKey} className="flex items-center gap-2 px-4 py-2 bg-primary/15 text-primary-light rounded-xl text-sm font-medium border border-primary/20 hover:bg-primary/25 transition-all">
              <Plus className="w-4 h-4" /> Generate
            </button>
          </div>

          {apiKeys.length === 0 ? (
            <Card className="!p-8 text-center">
              <Key className="w-10 h-10 text-text-muted mx-auto mb-3 opacity-40" />
              <p className="text-sm text-text-muted">No API keys yet. Generate your first key above.</p>
            </Card>
          ) : (
            apiKeys.map(key => (
              <Card key={key.id} className={`!p-4 ${key.status === 'revoked' ? 'opacity-50' : ''}`}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <KeyRound className="w-5 h-5 text-primary-light" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-text">{key.name}</h4>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${key.status === 'active' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                        {key.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-text-muted">
                      <span className="font-mono">{key.prefix}</span>
                      <span>Created: {new Date(key.created).toLocaleDateString()}</span>
                      {key.last_used && <span>Last used: {new Date(key.last_used).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  {key.status === 'active' && (
                    <button onClick={() => handleRevokeKey(key.id)} className="p-2 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-all" title="Revoke key">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
