import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Bell, Plus, Shield, AlertTriangle, TrendingDown, Zap,
  Slack, Mail, Globe, ToggleLeft, ToggleRight, Clock, Hash
} from 'lucide-react';
import { api } from '../api';
import { useToast } from '../components/Toast';
import Loader from '../components/Loader';

const CONDITION_TYPES = [
  { id: 'severity_threshold', label: 'Severity Threshold', icon: AlertTriangle, desc: 'Alert when findings of a severity are detected' },
  { id: 'score_drop', label: 'Score Drop', icon: TrendingDown, desc: 'Alert when security score drops by X points' },
  { id: 'new_finding', label: 'New Findings', icon: Zap, desc: 'Alert when any new findings are detected' },
];

const CHANNEL_OPTIONS = [
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'slack', label: 'Slack', icon: Slack },
  { id: 'webhook', label: 'Webhook', icon: Globe },
];

export default function AlertRules() {
  const { addToast } = useToast();
  const [rules, setRules] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [tab, setTab] = useState('rules');
  const [form, setForm] = useState({
    name: '', description: '', condition_type: 'severity_threshold',
    condition_value: { severity: 'CRITICAL', min_count: 1 }, channels: ['email'],
  });

  useEffect(() => {
    Promise.all([
      api.get('/api/v2/alert-rules').then(r => setRules(r.data.rules || [])),
      api.get('/api/v2/alert-history').then(r => setHistory(r.data.alerts || [])),
    ]).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const createRule = async () => {
    try {
      await api.post('/api/v2/alert-rules', form);
      addToast('Alert rule created', 'success');
      setShowCreate(false);
      const r = await api.get('/api/v2/alert-rules');
      setRules(r.data.rules || []);
    } catch (e) {
      addToast('Failed to create rule', 'error');
    }
  };

  if (loading) return <Loader text="Loading alerts..." />;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Bell className="w-5 h-5 text-text" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text">Alert Rules</h1>
            <p className="text-text-muted/70 text-xs">{rules.length} rules • {history.length} alerts sent</p>
          </div>
        </div>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl text-xs font-medium shadow-lg shadow-violet-500/20">
          <Plus className="w-3.5 h-3.5" /> New Rule
        </motion.button>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface/40 p-1 rounded-xl border border-border/30 w-fit">
        <button onClick={() => setTab('rules')}
          className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${tab === 'rules' ? 'bg-violet-600 text-text' : 'text-text-muted hover:text-text'}`}>
          <Shield className="w-3.5 h-3.5 inline mr-1.5" />Rules ({rules.length})
        </button>
        <button onClick={() => setTab('history')}
          className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${tab === 'history' ? 'bg-violet-600 text-text' : 'text-text-muted hover:text-text'}`}>
          <Clock className="w-3.5 h-3.5 inline mr-1.5" />History ({history.length})
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
          className="bg-surface-light/80 backdrop-blur-xl border border-border/30 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-semibold text-text">Create Alert Rule</h3>
          <input type="text" placeholder="Rule name..." value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
            className="w-full px-4 py-2.5 bg-surface/50 border border-border/30 rounded-xl text-sm text-text placeholder-slate-500 focus:border-violet-500/30 focus:outline-none" />
          <input type="text" placeholder="Description..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
            className="w-full px-4 py-2.5 bg-surface/50 border border-border/30 rounded-xl text-sm text-text placeholder-slate-500 focus:border-violet-500/30 focus:outline-none" />

          <div>
            <p className="text-[10px] text-text-muted uppercase tracking-widest mb-2">Condition</p>
            <div className="grid grid-cols-3 gap-2">
              {CONDITION_TYPES.map(ct => (
                <button key={ct.id} onClick={() => setForm({ ...form, condition_type: ct.id })}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    form.condition_type === ct.id ? 'border-violet-500/30 bg-violet-500/10' : 'border-border/30 bg-surface/30 hover:border-border/60'
                  }`}>
                  <ct.icon className={`w-4 h-4 mb-1 ${form.condition_type === ct.id ? 'text-violet-400' : 'text-text-muted'}`} />
                  <p className="text-xs font-medium text-text">{ct.label}</p>
                  <p className="text-[10px] text-text-muted/70 mt-0.5">{ct.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] text-text-muted uppercase tracking-widest mb-2">Channels</p>
            <div className="flex gap-2">
              {CHANNEL_OPTIONS.map(ch => (
                <button key={ch.id} onClick={() => {
                  const channels = form.channels.includes(ch.id)
                    ? form.channels.filter(c => c !== ch.id)
                    : [...form.channels, ch.id];
                  setForm({ ...form, channels });
                }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs transition-all ${
                    form.channels.includes(ch.id) ? 'border-violet-500/30 bg-violet-500/10 text-violet-400' : 'border-border/30 text-text-muted hover:border-border/60'
                  }`}>
                  <ch.icon className="w-3.5 h-3.5" /> {ch.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={() => setShowCreate(false)}
              className="px-4 py-2 text-xs text-text-muted hover:text-text transition-all">Cancel</button>
            <button onClick={createRule} disabled={!form.name}
              className="px-5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl text-xs font-medium disabled:opacity-50">
              Create Rule
            </button>
          </div>
        </motion.div>
      )}

      {/* Rules List */}
      {tab === 'rules' && (
        <div className="space-y-2">
          {rules.length === 0 ? (
            <div className="text-center py-16 text-text-muted/70">
              <Bell className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No alert rules configured</p>
              <p className="text-xs mt-1">Create a rule to get notified about security events</p>
            </div>
          ) : (rules || []).map((rule, i) => (
            <motion.div key={rule.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="bg-surface-light/80 backdrop-blur-xl border border-border/30 rounded-xl p-4 hover:border-border/60 transition-all flex items-center gap-4">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${rule.is_active ? 'bg-emerald-500/10' : 'bg-slate-500/10'}`}>
                {rule.is_active ? <ToggleRight className="w-5 h-5 text-emerald-400" /> : <ToggleLeft className="w-5 h-5 text-text-muted/70" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-text">{rule.name}</p>
                <p className="text-[10px] text-text-muted/70 mt-0.5">{rule.description || rule.condition_type.replace('_', ' ')}</p>
              </div>
              <div className="flex items-center gap-2">
                {(rule.channels || []).map(ch => {
                  const C = CHANNEL_OPTIONS.find(c => c.id === ch);
                  return C ? <C.icon key={ch} className="w-3.5 h-3.5 text-text-muted" /> : null;
                })}
              </div>
              <div className="text-right">
                <p className="text-xs text-text-muted flex items-center gap-1"><Hash className="w-3 h-3" />{rule.trigger_count} triggers</p>
                {rule.last_triggered_at && <p className="text-[10px] text-text-muted/70 mt-0.5">{new Date(rule.last_triggered_at).toLocaleDateString()}</p>}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Alert History */}
      {tab === 'history' && (
        <div className="space-y-2">
          {history.length === 0 ? (
            <div className="text-center py-16 text-text-muted/70">
              <Clock className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No alerts sent yet</p>
            </div>
          ) : (history || []).map((alert, i) => (
            <motion.div key={alert.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
              className="bg-surface-light/80 border border-border/30 rounded-xl p-4 flex items-center gap-4">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                alert.status === 'sent' ? 'bg-emerald-500/10' : 'bg-red-500/10'
              }`}>
                {alert.channel === 'slack' ? <Slack className="w-4 h-4 text-slate-300" /> :
                 alert.channel === 'email' ? <Mail className="w-4 h-4 text-slate-300" /> :
                 <Globe className="w-4 h-4 text-slate-300" />}
              </div>
              <div className="flex-1">
                <p className="text-sm text-text">{alert.title}</p>
                <p className="text-[10px] text-text-muted/70">{alert.message?.slice(0, 100)}</p>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                alert.status === 'sent' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
              }`}>{alert.status}</span>
              <span className="text-[10px] text-text-muted/70">{alert.sent_at ? new Date(alert.sent_at).toLocaleString() : ''}</span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
