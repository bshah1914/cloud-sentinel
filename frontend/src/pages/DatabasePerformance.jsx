import { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Database, RefreshCw, Lock, Globe, AlertTriangle } from 'lucide-react';
import Card from '../components/Card';
import { getBase } from '../api';

async function fetchJSON(path) {
  const token = localStorage.getItem('cm_token');
  const res = await fetch(`${getBase()}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

const STATUS_COLOR = { healthy: '#10b981', warning: '#f59e0b', critical: '#ef4444' };

export default function DatabasePerformance() {
  const ctx = useOutletContext() || {};
  const account = ctx.account;
  const [dbs, setDbs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!account) { setLoading(false); return; }
    try {
      const d = await fetchJSON(`/perf/databases?account=${encodeURIComponent(account)}`);
      setDbs(d.databases || []);
      setError(null);
    } catch (e) { setError(e.message); }
    setLoading(false);
  }, [account]);

  useEffect(() => { refresh(); }, [refresh]);

  if (!account) {
    return <Card className="!p-8 text-center">
      <Database className="w-10 h-10 text-text-muted mx-auto mb-3 opacity-40" />
      <p className="text-sm text-text-muted">Select a cloud account to view database performance</p>
    </Card>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-pink-500/20 flex items-center justify-center">
              <Database className="w-5 h-5 text-violet-400" />
            </div>
            Database Performance
          </h1>
          <p className="text-sm text-text-muted mt-1">Managed databases — CPU, connections, storage, IOPS</p>
        </div>
        <button onClick={refresh} className="p-2 rounded-lg bg-surface-light border border-border/30">
          <RefreshCw className="w-4 h-4 text-text-muted" />
        </button>
      </div>

      {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">{error}</div>}

      {loading ? (
        <div className="text-center py-8 text-sm text-text-muted">Loading...</div>
      ) : dbs.length === 0 ? (
        <Card className="!p-8 text-center">
          <Database className="w-10 h-10 text-text-muted mx-auto mb-3 opacity-40" />
          <p className="text-sm text-text-muted">No databases found</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dbs.map((db, i) => (
            <motion.div key={db.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Card className="!p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Database className="w-5 h-5 text-primary-light" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-text">{db.name}</h3>
                    <p className="text-[10px] text-text-muted">{db.engine} {db.engine_version} · {db.class} · {db.region}</p>
                  </div>
                  <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{ background: `${STATUS_COLOR[db.perf_status]}15`, color: STATUS_COLOR[db.perf_status] }}>
                    {db.perf_status}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="p-2 rounded bg-surface/50">
                    <p className="text-[10px] text-text-muted uppercase">CPU</p>
                    <p className="text-lg font-bold text-text">{db.cpu_pct !== null ? `${db.cpu_pct}%` : '—'}</p>
                  </div>
                  <div className="p-2 rounded bg-surface/50">
                    <p className="text-[10px] text-text-muted uppercase">Connections</p>
                    <p className="text-lg font-bold text-text">{db.connections ?? '—'}</p>
                  </div>
                  <div className="p-2 rounded bg-surface/50">
                    <p className="text-[10px] text-text-muted uppercase">Free GB</p>
                    <p className="text-lg font-bold text-text">{db.free_storage_gb ?? '—'}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {db.public ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-400 flex items-center gap-1"><Globe className="w-3 h-3" />Public</span>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center gap-1"><Lock className="w-3 h-3" />Private</span>
                  )}
                  {db.encrypted && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400">Encrypted</span>}
                  {db.multi_az && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">Multi-AZ</span>}
                  {db.read_iops > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-surface text-text-muted">R {db.read_iops.toFixed(0)} IOPS</span>}
                  {db.write_iops > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-surface text-text-muted">W {db.write_iops.toFixed(0)} IOPS</span>}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
