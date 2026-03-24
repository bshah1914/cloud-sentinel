import { useState, useEffect } from 'react';
import { getDashboard } from '../../api';

function getRisk(score) {
  if (score >= 80) return { label: 'LOW', color: 'text-emerald-400', bg: 'bg-emerald-500/15', bar: 'bg-emerald-500' };
  if (score >= 60) return { label: 'MEDIUM', color: 'text-yellow-400', bg: 'bg-yellow-500/15', bar: 'bg-yellow-500' };
  if (score >= 40) return { label: 'HIGH', color: 'text-orange-400', bg: 'bg-orange-500/15', bar: 'bg-orange-500' };
  return { label: 'CRITICAL', color: 'text-red-400', bg: 'bg-red-500/15', bar: 'bg-red-500' };
}

export default function RiskGauge({ account, provider }) {
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!account) return;
    getDashboard(account, provider)
      .then((d) => setScore(d.security_score ?? d.score ?? 0))
      .catch(() => setScore(0))
      .finally(() => setLoading(false));
  }, [account, provider]);

  if (loading) return <div className="flex items-center justify-center h-full text-text-muted text-xs">Loading...</div>;

  const risk = getRisk(score);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-3">
      <div className={`px-4 py-2 rounded-xl ${risk.bg}`}>
        <span className={`text-lg font-bold ${risk.color}`}>{risk.label}</span>
      </div>
      <div className="w-full max-w-[120px] h-2 rounded-full bg-white/10">
        <div className={`h-full rounded-full ${risk.bar} transition-all duration-500`} style={{ width: `${100 - score}%` }} />
      </div>
      <span className="text-[10px] text-text-muted">Risk Level</span>
    </div>
  );
}
