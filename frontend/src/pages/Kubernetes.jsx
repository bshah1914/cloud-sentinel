import { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Container, Shield, AlertTriangle, CheckCircle2, XCircle, RefreshCw, Lock, Globe, Eye } from 'lucide-react';
import Card from '../components/Card';
import { getBase } from '../api';

async function fetchJSON(path) {
  const token = localStorage.getItem('cm_token');
  const res = await fetch(`${getBase()}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

const SEV = { critical: '#ef4444', warning: '#f59e0b', info: '#3b82f6' };

export default function Kubernetes() {
  const ctx = useOutletContext() || {};
  const account = ctx.account;
  const [clusters, setClusters] = useState([]);
  const [meta, setMeta] = useState({ total: 0, avg_score: 0, critical_findings: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);

  const refresh = useCallback(async () => {
    if (!account) { setLoading(false); return; }
    try {
      const d = await fetchJSON(`/kubernetes/clusters?account=${encodeURIComponent(account)}`);
      setClusters(d.clusters || []);
      setMeta({ total: d.total || 0, avg_score: d.avg_score || 0, critical_findings: d.critical_findings || 0 });
      setError(null);
    } catch (e) { setError(e.message); }
    setLoading(false);
  }, [account]);

  useEffect(() => { refresh(); }, [refresh]);

  if (!account) {
    return <Card className="!p-8 text-center">
      <Container className="w-10 h-10 text-text-muted mx-auto mb-3 opacity-40" />
      <p className="text-sm text-text-muted">Select a cloud account to view Kubernetes clusters</p>
    </Card>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
              <Container className="w-5 h-5 text-blue-400" />
            </div>
            Kubernetes Security
          </h1>
          <p className="text-sm text-text-muted mt-1">Managed cluster posture (EKS / AKS / GKE) — cloud API based, no in-cluster agent</p>
        </div>
        <button onClick={refresh} className="p-2 rounded-lg bg-surface-light border border-border/30">
          <RefreshCw className="w-4 h-4 text-text-muted" />
        </button>
      </div>

      {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">{error}</div>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface-light/60 border border-border/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1"><Container className="w-4 h-4 text-blue-400" /><span className="text-xs text-text-muted">Clusters</span></div>
          <p className="text-2xl font-bold text-text">{meta.total}</p>
        </div>
        <div className="bg-surface-light/60 border border-border/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1"><Shield className="w-4 h-4 text-emerald-400" /><span className="text-xs text-text-muted">Avg Posture Score</span></div>
          <p className="text-2xl font-bold text-text">{meta.avg_score}/100</p>
        </div>
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1"><AlertTriangle className="w-4 h-4 text-red-400" /><span className="text-xs text-red-400">Critical findings</span></div>
          <p className="text-2xl font-bold text-red-400">{meta.critical_findings}</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-sm text-text-muted">Loading clusters...</div>
      ) : clusters.length === 0 ? (
        <Card className="!p-8 text-center">
          <Container className="w-10 h-10 text-text-muted mx-auto mb-3 opacity-40" />
          <p className="text-sm text-text-muted">No Kubernetes clusters found in this account</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {clusters.map((c, i) => {
            const scoreColor = c.score >= 80 ? '#10b981' : c.score >= 60 ? '#f59e0b' : '#ef4444';
            return (
              <motion.div key={c.id + i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Card className={`!p-4 cursor-pointer ${selected?.id === c.id ? 'ring-1 ring-primary/40' : ''}`} onClick={() => setSelected(c)}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Container className="w-5 h-5 text-primary-light" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-text">{c.name}</h3>
                      <p className="text-[10px] text-text-muted">{c.provider.toUpperCase()} · {c.region} · v{c.version}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold" style={{ color: scoreColor }}>{c.score}</p>
                      <p className="text-[10px] text-text-muted">posture</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {c.endpoint_public && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-400 flex items-center gap-1"><Globe className="w-3 h-3" />Public API</span>}
                    {c.endpoint_private && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center gap-1"><Lock className="w-3 h-3" />Private</span>}
                    {c.encryption_at_rest && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400">Encrypted</span>}
                    {c.logging_enabled?.length > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center gap-1"><Eye className="w-3 h-3" />{c.logging_enabled.length} log types</span>}
                  </div>
                  {c.findings?.length > 0 && (
                    <div className="space-y-1">
                      {c.findings.slice(0, 3).map((f, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs">
                          <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: SEV[f.severity] || SEV.info }} />
                          <span className="text-text-muted">{f.message}</span>
                        </div>
                      ))}
                      {c.findings.length > 3 && (
                        <p className="text-[10px] text-text-muted/60">+{c.findings.length - 3} more findings</p>
                      )}
                    </div>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
