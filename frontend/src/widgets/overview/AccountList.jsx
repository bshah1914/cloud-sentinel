import { useState, useEffect } from 'react';
import { getMultiCloudOverview } from '../../api';

export default function AccountList() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMultiCloudOverview()
      .then((d) => setAccounts(d.accounts || []))
      .catch(() => setAccounts([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-full text-text-muted text-xs">Loading...</div>;
  if (!accounts.length) return <div className="flex items-center justify-center h-full text-text-muted text-xs">No accounts</div>;

  return (
    <div className="space-y-2 overflow-auto">
      {accounts.map((a, i) => {
        const score = a.security_score ?? a.score ?? null;
        const color = score === null ? 'text-text-muted' : score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-yellow-400' : 'text-red-400';
        return (
          <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition">
            <div className="min-w-0">
              <p className="text-xs font-medium text-text truncate">{a.name || a.account_name}</p>
              <p className="text-[10px] text-text-muted">{(a.provider || 'aws').toUpperCase()}</p>
            </div>
            {score !== null && <span className={`text-sm font-bold ${color}`}>{score}</span>}
          </div>
        );
      })}
    </div>
  );
}
