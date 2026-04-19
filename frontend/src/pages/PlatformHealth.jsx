import { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, XCircle, RefreshCw, Activity, Download } from 'lucide-react';
import Card from '../components/Card';
import { getBase } from '../api';

async function fetchJSON(path) {
  const token = localStorage.getItem('cm_token');
  const res = await fetch(`${getBase()}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export default function PlatformHealth() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const d = await fetchJSON('/enterprise/platform-health');
      setHealth(d);
      setError(null);
    } catch (e) { setError(e.message); }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const iv = setInterval(refresh, 30000);
    return () => clearInterval(iv);
  }, [refresh]);

  const exportAudit = async (fmt) => {
    const token = localStorage.getItem('cm_token');
    const url = `${getBase()}/enterprise/audit-log/export?fmt=${fmt}&limit=5000`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.${fmt}`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center">
              <Activity className="w-5 h-5 text-emerald-400" />
            </div>
            Platform Health
          </h1>
          <p className="text-sm text-text-muted mt-1">Status of CloudSentrix background services and data integrity</p>
        </div>
        <button onClick={refresh} className="p-2 rounded-lg bg-surface-light border border-border/30">
          <RefreshCw className="w-4 h-4 text-text-muted" />
        </button>
      </div>

      {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">{error}</div>}

      {loading ? <div className="text-center py-8 text-sm text-text-muted">Loading...</div> : health && (
        <>
          <Card className="!p-4">
            <div className="flex items-center gap-3">
              {health.overall === 'healthy' ?
                <CheckCircle2 className="w-8 h-8 text-emerald-400" /> :
                <XCircle className="w-8 h-8 text-red-400" />}
              <div>
                <h3 className="text-lg font-semibold text-text">Overall: {health.overall === 'healthy' ? 'All Systems Operational' : 'Degraded'}</h3>
                <p className="text-xs text-text-muted">Last check: {new Date(health.timestamp).toLocaleString()}</p>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(health.services || []).map(s => (
              <Card key={s.name} className="!p-4">
                <div className="flex items-center gap-3">
                  {s.running ?
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" /> :
                    <XCircle className="w-5 h-5 text-red-400" />}
                  <div>
                    <h4 className="text-sm font-semibold text-text">{s.name}</h4>
                    <p className={`text-xs ${s.running ? 'text-emerald-400' : 'text-red-400'}`}>
                      {s.running ? 'running' : 'not running'}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-text">Audit Log Export</h3>
            <p className="text-xs text-text-muted mt-1">Export recent audit log entries for SIEM ingestion</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => exportAudit('json')} className="flex items-center gap-2 px-3 py-2 bg-surface-light border border-border/30 rounded-lg text-xs text-text-muted hover:text-text">
              <Download className="w-3.5 h-3.5" /> JSON
            </button>
            <button onClick={() => exportAudit('csv')} className="flex items-center gap-2 px-3 py-2 bg-surface-light border border-border/30 rounded-lg text-xs text-text-muted hover:text-text">
              <Download className="w-3.5 h-3.5" /> CSV
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
