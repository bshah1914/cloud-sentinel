import { useState, useEffect } from 'react';
import { getDashboard } from '../../api';

export default function SecurityScoreRing({ account, provider }) {
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

  const pct = Math.min(100, Math.max(0, score));
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  const color = pct >= 80 ? '#10b981' : pct >= 60 ? '#f59e0b' : pct >= 40 ? '#f97316' : '#ef4444';

  return (
    <div className="flex flex-col items-center justify-center h-full gap-2">
      <svg width="140" height="140" viewBox="0 0 128 128">
        <circle cx="64" cy="64" r={radius} fill="none" stroke="currentColor" strokeWidth="10" className="text-white/5" />
        <circle
          cx="64" cy="64" r={radius} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 64 64)"
          className="transition-all duration-700"
        />
        <text x="64" y="58" textAnchor="middle" className="fill-text" fontSize="28" fontWeight="bold">{pct}</text>
        <text x="64" y="78" textAnchor="middle" className="fill-text-muted" fontSize="11">/100</text>
      </svg>
      <span className="text-xs text-text-muted">Security Score</span>
    </div>
  );
}
