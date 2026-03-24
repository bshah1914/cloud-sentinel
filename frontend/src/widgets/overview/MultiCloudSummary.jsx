import { useState, useEffect } from 'react';
import { Cloud } from 'lucide-react';
import { getMultiCloudOverview } from '../../api';

const PROVIDER_COLORS = { aws: '#f59e0b', azure: '#3b82f6', gcp: '#ef4444' };

export default function MultiCloudSummary() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMultiCloudOverview()
      .then((d) => {
        const list = d.providers || d.clouds || [];
        setProviders(Array.isArray(list) ? list : Object.entries(list).map(([k, v]) => ({ provider: k, ...v })));
      })
      .catch(() => setProviders([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-full text-text-muted text-xs">Loading...</div>;
  if (!providers.length) return <div className="flex items-center justify-center h-full text-text-muted text-xs">No cloud accounts</div>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 h-full">
      {providers.map((p) => {
        const name = p.provider || p.name || 'unknown';
        const color = PROVIDER_COLORS[name.toLowerCase()] || '#6366f1';
        return (
          <div key={name} className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition">
            <Cloud className="w-6 h-6" style={{ color }} />
            <span className="text-sm font-bold text-text uppercase">{name}</span>
            <span className="text-lg font-bold text-text">{p.account_count ?? p.accounts ?? 0}</span>
            <span className="text-[10px] text-text-muted">accounts</span>
          </div>
        );
      })}
    </div>
  );
}
