import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import { getScanHistory } from '../../api';

const STATUS_ICON = {
  completed: CheckCircle2,
  failed: XCircle,
  running: Clock,
};

export default function RecentScans({ account, provider }) {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getScanHistory()
      .then((d) => {
        const list = (d.scans || d.history || d || []).slice(-8).reverse();
        setScans(list);
      })
      .catch(() => setScans([]))
      .finally(() => setLoading(false));
  }, [account, provider]);

  if (loading) return <div className="flex items-center justify-center h-full text-text-muted text-xs">Loading...</div>;
  if (!scans.length) return <div className="flex items-center justify-center h-full text-text-muted text-xs">No recent scans</div>;

  return (
    <div className="space-y-2 overflow-auto">
      {scans.map((s, i) => {
        const status = (s.status || 'completed').toLowerCase();
        const Icon = STATUS_ICON[status] || Clock;
        const iconColor = status === 'completed' ? 'text-emerald-400' : status === 'failed' ? 'text-red-400' : 'text-yellow-400';
        return (
          <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition">
            <Icon className={`w-4 h-4 shrink-0 ${iconColor}`} />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-text truncate">{s.account_name || s.account || 'Scan'}</p>
              <p className="text-[10px] text-text-muted">{(s.completed_at || s.date || '').slice(0, 16).replace('T', ' ')}</p>
            </div>
            {(s.security_score ?? s.score) != null && (
              <span className="text-xs font-bold text-text">{s.security_score ?? s.score}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
