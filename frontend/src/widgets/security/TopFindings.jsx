import { useState, useEffect } from 'react';
import { getDashboard } from '../../api';

const SEV_STYLES = {
  CRITICAL: 'bg-red-500/20 text-red-400',
  HIGH: 'bg-orange-500/20 text-orange-400',
  MEDIUM: 'bg-yellow-500/20 text-yellow-400',
  LOW: 'bg-blue-500/20 text-blue-400',
};

export default function TopFindings({ account, provider }) {
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!account) return;
    getDashboard(account, provider)
      .then((d) => {
        const list = d.findings || d.top_findings || [];
        setFindings(list.slice(0, 8));
      })
      .catch(() => setFindings([]))
      .finally(() => setLoading(false));
  }, [account, provider]);

  if (loading) return <div className="flex items-center justify-center h-full text-text-muted text-xs">Loading...</div>;
  if (!findings.length) return <div className="flex items-center justify-center h-full text-text-muted text-xs">No findings</div>;

  return (
    <div className="space-y-2 overflow-auto">
      {findings.map((f, i) => {
        const sev = (f.severity || 'MEDIUM').toUpperCase();
        return (
          <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition">
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${SEV_STYLES[sev] || SEV_STYLES.MEDIUM}`}>{sev}</span>
            <div className="min-w-0">
              <p className="text-xs text-text truncate">{f.title || f.description || f.message || 'Finding'}</p>
              {f.resource && <p className="text-[10px] text-text-muted truncate">{f.resource}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
