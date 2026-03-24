import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { getScanHistory } from '../../api';

export default function TrendAreaChart({ account, provider }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getScanHistory()
      .then((d) => {
        const scans = (d.scans || d.history || d || [])
          .filter((s) => !account || s.account_name === account || s.account === account)
          .slice(-12)
          .map((s) => ({
            date: (s.completed_at || s.date || '').slice(0, 10),
            score: s.security_score ?? s.score ?? 0,
          }));
        setData(scans);
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [account, provider]);

  if (loading) return <div className="flex items-center justify-center h-full text-text-muted text-xs">Loading...</div>;
  if (!data.length) return <div className="flex items-center justify-center h-full text-text-muted text-xs">No scan history</div>;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 9 }} />
        <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
        <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, fontSize: 12 }} />
        <Area type="monotone" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
