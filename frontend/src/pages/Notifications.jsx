import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Bell, Slack, Mail, Webhook, Plus, Trash2, Send, Check, X } from 'lucide-react';
import Card from '../components/Card';
import { getBase } from '../api';

async function fetchJSON(path, opts = {}) {
  const token = localStorage.getItem('cm_token');
  const res = await fetch(`${getBase()}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(opts.headers || {}) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
    throw new Error(err.detail);
  }
  return res.json();
}

const ICONS = { slack: Slack, email: Mail, webhook: Webhook };

export default function Notifications() {
  const [channels, setChannels] = useState([]);
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ type: 'slack', name: '', config: {}, enabled: true });
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const [c, l] = await Promise.all([fetchJSON('/notifications/channels'), fetchJSON('/notifications/log?limit=30')]);
      setChannels(c.channels || []);
      setLog(l.log || []);
    } catch (e) { setError(e.message); }
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const handleCreate = async () => {
    try {
      const config = form.type === 'slack' ? { webhook_url: form.webhook_url || '' }
        : form.type === 'email' ? { to: form.to || '' }
        : { url: form.url || '' };
      await fetchJSON('/notifications/channels', {
        method: 'POST',
        body: JSON.stringify({ type: form.type, name: form.name, config, enabled: true }),
      });
      setForm({ type: 'slack', name: '', config: {}, enabled: true });
      setShowCreate(false);
      refresh();
    } catch (e) { setError(e.message); }
  };

  const handleTest = async (id) => {
    try {
      const r = await fetchJSON(`/notifications/channels/${id}/test`, { method: 'POST' });
      alert(r.results?.[0]?.ok ? 'Test sent successfully' : `Test failed: ${r.results?.[0]?.error}`);
    } catch (e) { setError(e.message); }
  };

  const handleDelete = async (id) => {
    try {
      await fetchJSON(`/notifications/channels/${id}`, { method: 'DELETE' });
      refresh();
    } catch (e) { setError(e.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-pink-500/20 flex items-center justify-center">
              <Bell className="w-5 h-5 text-violet-400" />
            </div>
            Notifications
          </h1>
          <p className="text-sm text-text-muted mt-1">Slack / email / webhook channels for alert delivery</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-primary/15 text-primary-light rounded-xl text-sm font-medium border border-primary/20">
          <Plus className="w-4 h-4" /> Add Channel
        </button>
      </div>

      {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">{error}</div>}

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-surface-light border border-border/30 rounded-2xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-text">Add Notification Channel</h3>
              <button onClick={() => setShowCreate(false)}><X className="w-5 h-5 text-text-muted" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-text-muted mb-1 block">Type</label>
                <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                  className="w-full px-3 py-2 bg-surface border border-border/30 rounded-lg text-sm text-text">
                  <option value="slack">Slack webhook</option>
                  <option value="email">Email (SMTP)</option>
                  <option value="webhook">Generic webhook</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-text-muted mb-1 block">Name</label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="#ops-alerts" className="w-full px-3 py-2 bg-surface border border-border/30 rounded-lg text-sm text-text" />
              </div>
              {form.type === 'slack' && (
                <div>
                  <label className="text-xs text-text-muted mb-1 block">Webhook URL</label>
                  <input value={form.webhook_url || ''} onChange={e => setForm(p => ({ ...p, webhook_url: e.target.value }))}
                    placeholder="https://hooks.slack.com/..." className="w-full px-3 py-2 bg-surface border border-border/30 rounded-lg text-sm text-text font-mono" />
                </div>
              )}
              {form.type === 'email' && (
                <div>
                  <label className="text-xs text-text-muted mb-1 block">Recipient</label>
                  <input value={form.to || ''} onChange={e => setForm(p => ({ ...p, to: e.target.value }))}
                    placeholder="ops@company.com" className="w-full px-3 py-2 bg-surface border border-border/30 rounded-lg text-sm text-text" />
                  <p className="text-[10px] text-text-muted mt-1">SMTP creds configured via server env vars (SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM)</p>
                </div>
              )}
              {form.type === 'webhook' && (
                <div>
                  <label className="text-xs text-text-muted mb-1 block">URL</label>
                  <input value={form.url || ''} onChange={e => setForm(p => ({ ...p, url: e.target.value }))}
                    placeholder="https://my-app.com/hooks/alert" className="w-full px-3 py-2 bg-surface border border-border/30 rounded-lg text-sm text-text font-mono" />
                </div>
              )}
              <button onClick={handleCreate} className="w-full py-2.5 bg-primary/20 text-primary-light rounded-xl text-sm font-medium border border-primary/20">Create Channel</button>
            </div>
          </div>
        </div>
      )}

      {loading ? <div className="text-center py-8 text-sm text-text-muted">Loading...</div> :
        channels.length === 0 ? (
          <Card className="!p-8 text-center">
            <Bell className="w-10 h-10 text-text-muted mx-auto mb-3 opacity-40" />
            <p className="text-sm text-text-muted">No channels configured — alert rules will fire events but no notifications will be sent.</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {channels.map(c => {
              const Icon = ICONS[c.type] || Bell;
              return (
                <Card key={c.id} className="!p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-primary-light" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-text">{c.name}</h4>
                      <p className="text-xs text-text-muted">
                        {c.type} · {Object.values(c.config || {}).filter(v => typeof v === 'string').slice(0, 1).join(' ') || '-'}
                      </p>
                    </div>
                    <button onClick={() => handleTest(c.id)} className="flex items-center gap-1 px-3 py-1.5 bg-surface-light rounded-lg text-xs text-text-muted hover:text-text">
                      <Send className="w-3 h-3" /> Test
                    </button>
                    <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-lg text-text-muted hover:text-red-400">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

      <Card>
        <h3 className="text-sm font-semibold text-text mb-3">Recent Delivery Log</h3>
        {log.length === 0 ? (
          <p className="text-xs text-text-muted text-center py-4">No deliveries yet</p>
        ) : (
          <div className="space-y-1 max-h-[300px] overflow-y-auto">
            {log.slice(0, 30).map((e, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/[0.02] text-xs">
                <span className="text-text-muted font-mono w-40">{new Date(e.timestamp).toLocaleString()}</span>
                <span className="text-text flex-1 truncate">{e.subject}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-surface" style={{ color: e.severity === 'critical' ? '#ef4444' : e.severity === 'warning' ? '#f59e0b' : '#3b82f6' }}>{e.severity}</span>
                {(e.results || []).map((r, ri) => r.ok ?
                  <Check key={ri} className="w-3 h-3 text-emerald-400" /> :
                  <X key={ri} className="w-3 h-3 text-red-400" />)}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
