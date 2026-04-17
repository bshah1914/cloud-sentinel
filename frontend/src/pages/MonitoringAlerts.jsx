import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, BellRing, Plus, X, Clock, AlertTriangle, XCircle,
  Mail, MessageSquare, Webhook, Settings, Trash2, Power, PowerOff,
  Activity, Cpu, MemoryStick, HardDrive, Globe
} from 'lucide-react';
import Card from '../components/Card';
import { getBase } from '../api';

const SEVERITY_CONFIG = {
  critical: { color: '#ef4444' },
  warning: { color: '#f59e0b' },
  info: { color: '#3b82f6' },
};

const METRIC_OPTIONS = [
  { value: 'cpu', label: 'CPU Usage', icon: Cpu },
  { value: 'memory', label: 'Memory Usage', icon: MemoryStick },
  { value: 'disk', label: 'Disk Usage', icon: HardDrive },
  { value: 'error_rate', label: 'Error Rate', icon: XCircle },
  { value: 'response_time', label: 'Response Time', icon: Clock },
  { value: 'request_rate', label: 'Request Rate', icon: Activity },
];

const CHANNEL_ICONS = { email: Mail, slack: MessageSquare, webhook: Webhook };

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

export default function MonitoringAlerts() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newRule, setNewRule] = useState({ name: '', metric: 'cpu', condition: 'gt', threshold: '', duration: '5m', severity: 'warning', channels: [] });

  const refresh = useCallback(async () => {
    try {
      const data = await fetchJSON('/monitoring/alert-rules');
      setRules(data.rules || []);
      setError(null);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const handleCreateRule = async () => {
    if (!newRule.name || !newRule.threshold) return;
    try {
      await fetchJSON('/monitoring/alert-rules', {
        method: 'POST',
        body: JSON.stringify({
          name: newRule.name,
          metric: newRule.metric,
          condition: newRule.condition,
          threshold: Number(newRule.threshold),
          duration: newRule.duration,
          severity: newRule.severity,
          channels: newRule.channels,
        }),
      });
      setNewRule({ name: '', metric: 'cpu', condition: 'gt', threshold: '', duration: '5m', severity: 'warning', channels: [] });
      setShowCreate(false);
      refresh();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleDeleteRule = async (id) => {
    try {
      await fetchJSON(`/monitoring/alert-rules/${id}`, { method: 'DELETE' });
      refresh();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
              <BellRing className="w-5 h-5 text-amber-400" />
            </div>
            Monitoring Alerts
          </h1>
          <p className="text-sm text-text-muted mt-1">Create alert rules evaluated against real server metrics</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary/15 text-primary-light rounded-xl text-sm font-medium border border-primary/20 hover:bg-primary/25 transition-all"
        >
          <Plus className="w-4 h-4" /> New Rule
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">{error}</div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-surface-light/60 border border-border/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1"><Bell className="w-4 h-4 text-primary-light" /><span className="text-xs text-text-muted">Total Rules</span></div>
          <p className="text-2xl font-bold text-text">{rules.length}</p>
        </div>
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1"><Power className="w-4 h-4 text-emerald-400" /><span className="text-xs text-emerald-400">Enabled</span></div>
          <p className="text-2xl font-bold text-emerald-400">{rules.filter(r => r.enabled).length}</p>
        </div>
        <div className="bg-surface-light/60 border border-border/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1"><PowerOff className="w-4 h-4 text-text-muted" /><span className="text-xs text-text-muted">Disabled</span></div>
          <p className="text-2xl font-bold text-text">{rules.filter(r => !r.enabled).length}</p>
        </div>
      </div>

      {/* Create Rule Modal */}
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
                <h3 className="text-lg font-semibold text-text">Create Alert Rule</h3>
                <button onClick={() => setShowCreate(false)} className="text-text-muted hover:text-text"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-text-muted mb-1 block">Rule Name</label>
                  <input value={newRule.name} onChange={e => setNewRule(p => ({ ...p, name: e.target.value }))} placeholder="e.g. High CPU Alert" className="w-full px-3 py-2 bg-surface border border-border/30 rounded-lg text-sm text-text focus:outline-none focus:border-primary/40" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Metric</label>
                    <select value={newRule.metric} onChange={e => setNewRule(p => ({ ...p, metric: e.target.value }))} className="w-full px-3 py-2 bg-surface border border-border/30 rounded-lg text-sm text-text focus:outline-none">
                      {METRIC_OPTIONS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Condition</label>
                    <select value={newRule.condition} onChange={e => setNewRule(p => ({ ...p, condition: e.target.value }))} className="w-full px-3 py-2 bg-surface border border-border/30 rounded-lg text-sm text-text focus:outline-none">
                      <option value="gt">Greater than</option>
                      <option value="lt">Less than</option>
                      <option value="gte">Greater or equal</option>
                      <option value="lte">Less or equal</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Threshold</label>
                    <input type="number" value={newRule.threshold} onChange={e => setNewRule(p => ({ ...p, threshold: e.target.value }))} className="w-full px-3 py-2 bg-surface border border-border/30 rounded-lg text-sm text-text focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Duration</label>
                    <select value={newRule.duration} onChange={e => setNewRule(p => ({ ...p, duration: e.target.value }))} className="w-full px-3 py-2 bg-surface border border-border/30 rounded-lg text-sm text-text focus:outline-none">
                      {['1m', '2m', '5m', '10m', '15m', '30m'].map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-text-muted mb-1 block">Severity</label>
                    <select value={newRule.severity} onChange={e => setNewRule(p => ({ ...p, severity: e.target.value }))} className="w-full px-3 py-2 bg-surface border border-border/30 rounded-lg text-sm text-text focus:outline-none">
                      {Object.keys(SEVERITY_CONFIG).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <button onClick={handleCreateRule} className="w-full py-2.5 bg-primary/20 text-primary-light rounded-xl text-sm font-medium border border-primary/20 hover:bg-primary/30 transition-all">Create Rule</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rules list */}
      {loading ? (
        <div className="text-center py-8 text-sm text-text-muted">Loading…</div>
      ) : rules.length === 0 ? (
        <Card className="!p-8 text-center">
          <BellRing className="w-10 h-10 text-text-muted mx-auto mb-3 opacity-40" />
          <h3 className="text-sm font-semibold text-text mb-1">No alert rules yet</h3>
          <p className="text-xs text-text-muted mb-4">Create your first rule to get notified when metrics cross thresholds.</p>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary/15 text-primary-light rounded-xl text-sm font-medium border border-primary/20"
          >
            <Plus className="w-4 h-4" /> Create First Rule
          </button>
        </Card>
      ) : (
        <div className="space-y-2">
          {rules.map((rule, i) => {
            const sev = SEVERITY_CONFIG[rule.severity] || SEVERITY_CONFIG.info;
            const metricInfo = METRIC_OPTIONS.find(m => m.value === rule.metric);
            const MetricIcon = metricInfo?.icon || Activity;
            return (
              <motion.div
                key={rule.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card className={`!p-4 ${!rule.enabled ? 'opacity-50' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${sev.color}15` }}>
                      <MetricIcon className="w-4 h-4" style={{ color: sev.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-text">{rule.name}</h4>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: `${sev.color}15`, color: sev.color }}>{rule.severity}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-text-muted">
                        <span>{metricInfo?.label || rule.metric}</span>
                        <span>{rule.condition} {rule.threshold}</span>
                        <span>for {rule.duration}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {rule.channels?.map(ch => {
                        const ChIcon = CHANNEL_ICONS[ch] || Bell;
                        return <ChIcon key={ch} className="w-3.5 h-3.5 text-text-muted" title={ch} />;
                      })}
                    </div>
                    <button onClick={() => handleDeleteRule(rule.id)} className="p-1.5 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
