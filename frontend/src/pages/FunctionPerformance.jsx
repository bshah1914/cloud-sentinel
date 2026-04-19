import { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Activity, AlertTriangle, RefreshCw, Clock } from 'lucide-react';
import Card from '../components/Card';
import { getBase } from '../api';

async function fetchJSON(path) {
  const token = localStorage.getItem('cm_token');
  const res = await fetch(`${getBase()}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

const STATUS_COLOR = { healthy: '#10b981', warning: '#f59e0b', critical: '#ef4444' };

export default function FunctionPerformance() {
  const ctx = useOutletContext() || {};
  const account = ctx.account;
  const [fns, setFns] = useState([]);
  const [stats, setStats] = useState({ total: 0, total_invocations: 0, total_errors: 0, error_rate: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!account) { setLoading(false); return; }
    try {
      const d = await fetchJSON(`/perf/functions?account=${encodeURIComponent(account)}`);
      setFns(d.functions || []);
      setStats({
        total: d.total || 0,
        total_invocations: d.total_invocations || 0,
        total_errors: d.total_errors || 0,
        error_rate: d.overall_error_rate_pct || 0,
      });
      setError(null);
    } catch (e) { setError(e.message); }
    setLoading(false);
  }, [account]);

  useEffect(() => { refresh(); }, [refresh]);

  if (!account) {
    return <Card className="!p-8 text-center">
      <Zap className="w-10 h-10 text-text-muted mx-auto mb-3 opacity-40" />
      <p className="text-sm text-text-muted">Select a cloud account to view function performance</p>
    </Card>;
  }

  const sorted = [...fns].sort((a, b) => (b.invocations || 0) - (a.invocations || 0));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-emerald-400" />
            </div>
            Function Performance
          </h1>
          <p className="text-sm text-text-muted mt-1">Serverless functions — invocations, errors, duration, throttles</p>
        </div>
        <button onClick={refresh} className="p-2 rounded-lg bg-surface-light border border-border/30">
          <RefreshCw className="w-4 h-4 text-text-muted" />
        </button>
      </div>

      {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">{error}</div>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface-light/60 border border-border/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1"><Zap className="w-4 h-4 text-emerald-400" /><span className="text-xs text-text-muted">Functions</span></div>
          <p className="text-2xl font-bold text-text">{stats.total}</p>
        </div>
        <div className="bg-surface-light/60 border border-border/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1"><Activity className="w-4 h-4 text-cyan-400" /><span className="text-xs text-text-muted">Invocations (1h)</span></div>
          <p className="text-2xl font-bold text-text">{stats.total_invocations.toLocaleString()}</p>
        </div>
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1"><AlertTriangle className="w-4 h-4 text-red-400" /><span className="text-xs text-red-400">Errors</span></div>
          <p className="text-2xl font-bold text-red-400">{stats.total_errors.toLocaleString()}</p>
        </div>
        <div className="bg-surface-light/60 border border-border/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1"><AlertTriangle className="w-4 h-4 text-amber-400" /><span className="text-xs text-text-muted">Error rate</span></div>
          <p className="text-2xl font-bold text-text">{stats.error_rate}%</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-sm text-text-muted">Loading...</div>
      ) : fns.length === 0 ? (
        <Card className="!p-8 text-center">
          <Zap className="w-10 h-10 text-text-muted mx-auto mb-3 opacity-40" />
          <p className="text-sm text-text-muted">No serverless functions found</p>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-text-muted text-xs border-b border-border/30">
                  <th className="text-left pb-3 font-medium">Function</th>
                  <th className="text-left pb-3 font-medium">Runtime</th>
                  <th className="text-left pb-3 font-medium">Region</th>
                  <th className="text-right pb-3 font-medium">Invocations</th>
                  <th className="text-right pb-3 font-medium">Errors</th>
                  <th className="text-right pb-3 font-medium">Duration</th>
                  <th className="text-right pb-3 font-medium">Throttles</th>
                  <th className="text-right pb-3 font-medium">Memory</th>
                  <th className="text-center pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((f, i) => (
                  <motion.tr key={f.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                    className="border-b border-border/10 hover:bg-white/[0.02]">
                    <td className="py-2.5 font-medium text-text">{f.name}</td>
                    <td className="py-2.5 text-text-muted text-xs">{f.runtime}</td>
                    <td className="py-2.5 text-text-muted text-xs">{f.region}</td>
                    <td className="py-2.5 text-right text-text">{(f.invocations || 0).toLocaleString()}</td>
                    <td className="py-2.5 text-right text-red-400">{f.errors || 0}</td>
                    <td className="py-2.5 text-right text-text">{f.avg_duration_ms ? `${f.avg_duration_ms}ms` : '—'}</td>
                    <td className="py-2.5 text-right text-amber-400">{f.throttles || 0}</td>
                    <td className="py-2.5 text-right text-text-muted text-xs">{f.memory_mb}MB</td>
                    <td className="py-2.5 text-center">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ background: `${STATUS_COLOR[f.perf_status]}15`, color: STATUS_COLOR[f.perf_status] }}>
                        {f.perf_status}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
