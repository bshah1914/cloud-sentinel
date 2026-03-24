import { useState, useEffect } from 'react';
import { getMultiCloudOverview } from '../../api';

export default function BigStat({ account, provider, metric = 'accounts' }) {
  const [value, setValue] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMultiCloudOverview()
      .then((d) => {
        const map = {
          accounts: d.total_accounts ?? (d.accounts || []).length,
          resources: d.total_resources ?? 0,
          findings: d.total_findings ?? 0,
          score: d.average_score ?? d.avg_score ?? 0,
        };
        setValue(map[metric] ?? map.accounts);
      })
      .catch(() => setValue(0))
      .finally(() => setLoading(false));
  }, [metric]);

  if (loading) return <div className="flex items-center justify-center h-full text-text-muted text-xs">Loading...</div>;

  const labels = { accounts: 'Total Accounts', resources: 'Total Resources', findings: 'Open Findings', score: 'Avg Score' };

  return (
    <div className="flex flex-col items-center justify-center h-full gap-1">
      <span className="text-3xl font-bold text-text">{value ?? 0}</span>
      <span className="text-xs text-text-muted uppercase tracking-wide">{labels[metric] || metric}</span>
    </div>
  );
}
