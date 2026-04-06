import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, BellRing, Plus, X, Clock, CheckCircle2, AlertTriangle, XCircle,
  Zap, Mail, MessageSquare, Webhook, Settings, Trash2, Power, PowerOff,
  TrendingUp, Activity, Cpu, MemoryStick, HardDrive, Globe
} from 'lucide-react';
import Card from '../components/Card';

const SEVERITY_CONFIG = {
  critical: { color: '#ef4444', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: XCircle },
  warning: { color: '#f59e0b', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: AlertTriangle },
  info: { color: '#3b82f6', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: Bell },
};

const METRIC_OPTIONS = [
  { value: 'cpu_usage', label: 'CPU Usage', icon: Cpu },
  { value: 'memory_usage', label: 'Memory Usage', icon: MemoryStick },
  { value: 'disk_usage', label: 'Disk Usage', icon: HardDrive },
  { value: 'error_rate', label: 'Error Rate', icon: XCircle },
  { value: 'response_time', label: 'Response Time', icon: Clock },
  { value: 'request_rate', label: 'Request Rate', icon: Activity },
  { value: 'network_io', label: 'Network I/O', icon: Globe },
];

const CHANNEL_ICONS = { email: Mail, slack: MessageSquare, webhook: Webhook, telegram: MessageSquare };

function generateAlertRules() {
  return [
    { id: 'rule-1', name: 'High CPU Usage', metric: 'cpu_usage', condition: 'gt', threshold: 85, duration: '5m', severity: 'critical', enabled: true, channels: ['slack', 'email'], lastTriggered: '2026-04-07T10:30:00Z', firingCount: 3 },
    { id: 'rule-2', name: 'Memory Pressure', metric: 'memory_usage', condition: 'gt', threshold: 90, duration: '3m', severity: 'critical', enabled: true, channels: ['slack', 'email', 'webhook'], lastTriggered: '2026-04-07T09:15:00Z', firingCount: 1 },
    { id: 'rule-3', name: 'Disk Space Low', metric: 'disk_usage', condition: 'gt', threshold: 80, duration: '10m', severity: 'warning', enabled: true, channels: ['email'], lastTriggered: '2026-04-06T18:00:00Z', firingCount: 0 },
    { id: 'rule-4', name: 'High Error Rate', metric: 'error_rate', condition: 'gt', threshold: 5, duration: '2m', severity: 'critical', enabled: true, channels: ['slack', 'email'], lastTriggered: '2026-04-07T11:00:00Z', firingCount: 2 },
    { id: 'rule-5', name: 'Slow Response Time', metric: 'response_time', condition: 'gt', threshold: 2000, duration: '5m', severity: 'warning', enabled: true, channels: ['slack'], lastTriggered: null, firingCount: 0 },
    { id: 'rule-6', name: 'Low Request Rate', metric: 'request_rate', condition: 'lt', threshold: 10, duration: '15m', severity: 'info', enabled: false, channels: ['email'], lastTriggered: null, firingCount: 0 },
    { id: 'rule-7', name: 'Network Anomaly', metric: 'network_io', condition: 'anomaly', threshold: 3, duration: '10m', severity: 'warning', enabled: true, channels: ['slack', 'webhook'], lastTriggered: '2026-04-07T08:45:00Z', firingCount: 1 },
  ];
}

function generateAlertEvents() {
  return [
    { id: 'evt-1', ruleId: 'rule-1', ruleName: 'High CPU Usage', severity: 'critical', status: 'firing', host: 'staging-web-01', value: 95.2, threshold: 85, timestamp: '2026-04-07T11:30:00Z', message: 'CPU usage at 95.2% on staging-web-01 (threshold: 85%)' },
    { id: 'evt-2', ruleId: 'rule-4', ruleName: 'High Error Rate', severity: 'critical', status: 'firing', host: 'prod-api-01', value: 8.5, threshold: 5, timestamp: '2026-04-07T11:00:00Z', message: 'Error rate at 8.5% on prod-api-01 (threshold: 5%)' },
    { id: 'evt-3', ruleId: 'rule-2', ruleName: 'Memory Pressure', severity: 'critical', status: 'firing', host: 'prod-api-01', value: 92.1, threshold: 90, timestamp: '2026-04-07T09:15:00Z', message: 'Memory usage at 92.1% on prod-api-01 (threshold: 90%)' },
    { id: 'evt-4', ruleId: 'rule-7', ruleName: 'Network Anomaly', severity: 'warning', status: 'resolved', host: 'prod-web-01', value: 3.5, threshold: 3, timestamp: '2026-04-07T08:45:00Z', resolvedAt: '2026-04-07T09:00:00Z', message: 'Network I/O anomaly detected on prod-web-01 (z-score: 3.5)' },
    { id: 'evt-5', ruleId: 'rule-1', ruleName: 'High CPU Usage', severity: 'critical', status: 'resolved', host: 'prod-worker-01', value: 88.3, threshold: 85, timestamp: '2026-04-07T07:30:00Z', resolvedAt: '2026-04-07T07:45:00Z', message: 'CPU usage at 88.3% on prod-worker-01 (threshold: 85%)' },
    { id: 'evt-6', ruleId: 'rule-3', ruleName: 'Disk Space Low', severity: 'warning', status: 'resolved', host: 'prod-db-01', value: 82.5, threshold: 80, timestamp: '2026-04-06T18:00:00Z', resolvedAt: '2026-04-06T19:30:00Z', message: 'Disk usage at 82.5% on prod-db-01 (threshold: 80%)' },
    { id: 'evt-7', ruleId: 'rule-1', ruleName: 'High CPU Usage', severity: 'critical', status: 'resolved', host: 'staging-web-01', value: 91.7, threshold: 85, timestamp: '2026-04-06T14:00:00Z', resolvedAt: '2026-04-06T14:20:00Z', message: 'CPU usage at 91.7% on staging-web-01 (threshold: 85%)' },
  ];
}

function generateChannels() {
  return [
    { id: 'ch-1', type: 'slack', name: '#ops-alerts', config: 'webhook://hooks.slack.com/...', enabled: true },
    { id: 'ch-2', type: 'email', name: 'ops-team@company.com', config: 'ops-team@company.com', enabled: true },
    { id: 'ch-3', type: 'webhook', name: 'PagerDuty', config: 'https://events.pagerduty.com/...', enabled: true },
    { id: 'ch-4', type: 'telegram', name: 'Ops Channel', config: 'chat_id: -100123456', enabled: false },
  ];
}

export default function MonitoringAlerts() {
  const [rules, setRules] = useState(generateAlertRules);
  const [events] = useState(generateAlertEvents);
  const [channels] = useState(generateChannels);
  const [tab, setTab] = useState('rules');
  const [showCreate, setShowCreate] = useState(false);
  const [newRule, setNewRule] = useState({ name: '', metric: 'cpu_usage', condition: 'gt', threshold: '', duration: '5m', severity: 'warning', channels: [] });

  const firingCount = events.filter(e => e.status === 'firing').length;
  const resolvedCount = events.filter(e => e.status === 'resolved').length;
  const criticalFiring = events.filter(e => e.status === 'firing' && e.severity === 'critical').length;

  const handleToggleRule = (id) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const handleDeleteRule = (id) => {
    setRules(prev => prev.filter(r => r.id !== id));
  };

  const handleCreateRule = () => {
    if (!newRule.name || !newRule.threshold) return;
    setRules(prev => [...prev, {
      ...newRule,
      id: `rule-${Date.now()}`,
      threshold: Number(newRule.threshold),
      enabled: true,
      lastTriggered: null,
      firingCount: 0,
    }]);
    setNewRule({ name: '', metric: 'cpu_usage', condition: 'gt', threshold: '', duration: '5m', severity: 'warning', channels: [] });
    setShowCreate(false);
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
          <p className="text-sm text-text-muted mt-1">Configure alert rules, notification channels, and view alert history</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary/15 text-primary-light rounded-xl text-sm font-medium border border-primary/20 hover:bg-primary/25 transition-all"
        >
          <Plus className="w-4 h-4" /> New Rule
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface-light/60 border border-border/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1"><Bell className="w-4 h-4 text-primary-light" /><span className="text-xs text-text-muted">Active Rules</span></div>
          <p className="text-2xl font-bold text-text">{rules.filter(r => r.enabled).length}<span className="text-sm text-text-muted font-normal">/{rules.length}</span></p>
        </div>
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1"><XCircle className="w-4 h-4 text-red-400" /><span className="text-xs text-red-400">Firing</span></div>
          <p className="text-2xl font-bold text-red-400">{firingCount}</p>
        </div>
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1"><CheckCircle2 className="w-4 h-4 text-emerald-400" /><span className="text-xs text-emerald-400">Resolved</span></div>
          <p className="text-2xl font-bold text-emerald-400">{resolvedCount}</p>
        </div>
        <div className="bg-surface-light/60 border border-border/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1"><MessageSquare className="w-4 h-4 text-cyan-400" /><span className="text-xs text-text-muted">Channels</span></div>
          <p className="text-2xl font-bold text-text">{channels.filter(c => c.enabled).length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-light/40 p-1 rounded-xl w-fit border border-border/20">
        {[
          { id: 'rules', label: 'Alert Rules', icon: Settings },
          { id: 'events', label: 'Alert History', icon: Clock },
          { id: 'channels', label: 'Notification Channels', icon: MessageSquare },
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
                      <option value="anomaly">Anomaly (z-score)</option>
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

      {/* Tab Content */}
      {tab === 'rules' && (
        <div className="space-y-2">
          {rules.map((rule, i) => {
            const sev = SEVERITY_CONFIG[rule.severity];
            const SevIcon = sev.icon;
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
                      <SevIcon className="w-4 h-4" style={{ color: sev.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-text">{rule.name}</h4>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: `${sev.color}15`, color: sev.color }}>{rule.severity}</span>
                        {rule.firingCount > 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400 font-medium animate-pulse">FIRING ({rule.firingCount})</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-text-muted">
                        <span className="flex items-center gap-1"><MetricIcon className="w-3 h-3" /> {metricInfo?.label}</span>
                        <span>{rule.condition === 'anomaly' ? `z-score > ${rule.threshold}` : `${rule.condition} ${rule.threshold}`}</span>
                        <span>for {rule.duration}</span>
                        {rule.lastTriggered && (
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Last: {new Date(rule.lastTriggered).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {rule.channels.map(ch => {
                        const ChIcon = CHANNEL_ICONS[ch] || Bell;
                        return <ChIcon key={ch} className="w-3.5 h-3.5 text-text-muted" title={ch} />;
                      })}
                    </div>
                    <button onClick={() => handleToggleRule(rule.id)} className={`p-1.5 rounded-lg transition-all ${rule.enabled ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-text-muted hover:bg-white/[0.05]'}`}>
                      {rule.enabled ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                    </button>
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

      {tab === 'events' && (
        <div className="space-y-2">
          {events.map((evt, i) => {
            const sev = SEVERITY_CONFIG[evt.severity];
            const firing = evt.status === 'firing';
            return (
              <motion.div key={evt.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                <Card className={`!p-4 ${firing ? `${sev.bg} border ${sev.border}` : ''}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${firing ? 'animate-pulse' : ''}`} style={{ background: firing ? sev.color : '#10b981' }} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-text">{evt.ruleName}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: firing ? `${sev.color}20` : '#10b98120', color: firing ? sev.color : '#10b981' }}>
                          {firing ? 'FIRING' : 'RESOLVED'}
                        </span>
                        <span className="text-[10px] text-text-muted font-mono">{evt.host}</span>
                      </div>
                      <p className="text-xs text-text-muted">{evt.message}</p>
                      <div className="flex gap-3 mt-1.5 text-[10px] text-text-muted">
                        <span>Triggered: {new Date(evt.timestamp).toLocaleString()}</span>
                        {evt.resolvedAt && <span>Resolved: {new Date(evt.resolvedAt).toLocaleString()}</span>}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {tab === 'channels' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {channels.map(ch => {
            const ChIcon = CHANNEL_ICONS[ch.type] || Bell;
            return (
              <Card key={ch.id} className="!p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <ChIcon className="w-5 h-5 text-primary-light" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-text">{ch.name}</h4>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${ch.enabled ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                        {ch.enabled ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                    <p className="text-xs text-text-muted mt-0.5 capitalize">{ch.type}</p>
                  </div>
                </div>
              </Card>
            );
          })}
          <Card className="!p-4 border-dashed border-2 border-border/30 flex items-center justify-center cursor-pointer hover:bg-white/[0.02] transition-all">
            <div className="text-center">
              <Plus className="w-6 h-6 text-text-muted mx-auto mb-1" />
              <p className="text-xs text-text-muted">Add Channel</p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
