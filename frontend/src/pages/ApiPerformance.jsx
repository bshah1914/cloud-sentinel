import { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Activity, AlertTriangle, RefreshCw, TrendingUp } from 'lucide-react';
import Card from '../components/Card';
import { getBase } from '../api';

async function fetchJSON(path) {
  const token = localStorage.getItem('cm_token');
  const res = await fetch(`${getBase()}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

const STATUS_COLOR = { healthy: '#10b981', warning: '#f59e0b', critical: '#ef4444' };

export default function ApiPerformance() {
  const ctx = useOutletContext() || {};
  const account = ctx.account;
  const [lbs, setLbs] = useState([]);
  const [stats, setStats] = useState({ total: 0, total_requests: 0, total_5xx: 0, error_rate: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!account) { setLoading(false); return; }
    try {
      const d = await fetchJSON(`/perf/api-endpoints?account=${encodeURIComponent(account)}`);
      setLbs(d.load_balancers || []);
      setStats({
        total: d.total || 0, total_requests: d.total_requests || 0,
        total_5xx: d.total_5xx || 0, error_rate: d.overall_error_rate_pct || 0,
      });
      setError(null);
    } catch (e) { setError(e.message); }
    setLoading(false);
  }, [account]);

  useEffect(() => { refresh(); }, [refresh]);

  if (!account) {
    return <Card className="!p-8 text-center">
      <Zap className="w-10 h-10 text-text-muted mx-auto mb-3 opacity-40" />
      <p className="text-sm text-text-muted">Select a cloud account to view API performance</p>
    </Card>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-amber-400" />
            </div>
            API Performance
          </h1>
          <p className="text-sm text-text-muted mt-1">Latency, throughput, error rate for all application load balancers</p>
        </div>
        <button onClick={refresh} className="p-2 rounded-lg bg-surface-light border border-border/30">
          <RefreshCw className="w-4 h-4 text-text-muted" />
        </button>
      </div>

      {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">{error}</div>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface-light/60 border border-border/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1"><Activity className="w-4 h-4 text-primary-light" /><span className="text-xs text-text-muted">Load Balancers</span></div>
          <p className="text-2xl font-bold text-text">{stats.total}</p>
        </div>
        <div className="bg-surface-light/60 border border-border/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1"><TrendingUp className="w-4 h-4 text-cyan-400" /><span className="text-xs text-text-muted">Requests (10m)</span></div>
          <p className="text-2xl font-bold text-text">{stats.total_requests.toLocaleString()}</p>
        </div>
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1"><AlertTriangle className="w-4 h-4 text-red-400" /><span className="text-xs text-red-400">5xx errors</span></div>
          <p className="text-2xl font-bold text-red-400">{stats.total_5xx.toLocaleString()}</p>
        </div>
        <div className="bg-surface-light/60 border border-border/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1"><AlertTriangle className="w-4 h-4 text-amber-400" /><span className="text-xs text-text-muted">Error rate</span></div>
          <p className="text-2xl font-bold text-text">{stats.error_rate}%</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-sm text-text-muted">Loading...</div>
      ) : lbs.length === 0 ? (
        <Card className="!p-8 text-center">
          <Zap className="w-10 h-10 text-text-muted mx-auto mb-3 opacity-40" />
          <p className="text-sm text-text-muted">No load balancers found in this account</p>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-text-muted text-xs border-b border-border/30">
                  <th className="text-left pb-3 font-medium">Load Balancer</th>
                  <th className="text-left pb-3 font-medium">Region</th>
                  <th className="text-right pb-3 font-medium">Requests</th>
                  <th className="text-right pb-3 font-medium">Latency (P95)</th>
                  <th className="text-right pb-3 font-medium">4xx</th>
                  <th className="text-right pb-3 font-medium">5xx</th>
                  <th className="text-right pb-3 font-medium">Error %</th>
                  <th className="text-center pb-3 font-medium">Hosts</th>
                  <th className="text-center pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {lbs.map((lb, i) => (
                  <motion.tr key={lb.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className="border-b border-border/10 hover:bg-white/[0.02]">
                    <td className="py-2.5 font-medium text-text">{lb.name}</td>
                    <td className="py-2.5 text-text-muted text-xs">{lb.region}</td>
                    <td className="py-2.5 text-right text-text">{(lb.request_count || 0).toLocaleString()}</td>
                    <td className="py-2.5 text-right text-text">{lb.latency_ms !== null ? `${lb.latency_ms}ms` : '—'}</td>
                    <td className="py-2.5 text-right text-amber-400">{lb.error_4xx || 0}</td>
                    <td className="py-2.5 text-right text-red-400">{lb.error_5xx || 0}</td>
                    <td className="py-2.5 text-right text-text">{lb.error_rate_pct}%</td>
                    <td className="py-2.5 text-center text-xs">
                      <span className="text-emerald-400">{lb.healthy_hosts !== null ? lb.healthy_hosts : '—'}</span>
                      {lb.unhealthy_hosts > 0 && <span className="text-red-400 ml-1">/ {lb.unhealthy_hosts}</span>}
                    </td>
                    <td className="py-2.5 text-center">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ background: `${STATUS_COLOR[lb.status]}15`, color: STATUS_COLOR[lb.status] }}>
                        {lb.status}
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
