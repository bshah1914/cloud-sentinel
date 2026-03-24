import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import { getDashboard } from '../../api';

const COLORS = { CRITICAL: '#ef4444', HIGH: '#f97316', MEDIUM: '#f59e0b', LOW: '#3b82f6' };

export default function SeverityPieChart({ account, provider }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!account) return;
    getDashboard(account, provider)
      .then((d) => {
        const s = d.findings_summary || d.severity_counts || {};
        setData(
          Object.entries(COLORS).map(([key]) => ({
            name: key,
            value: s[key] ?? s[key.toLowerCase()] ?? 0,
          })).filter((i) => i.value > 0)
        );
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [account, provider]);

  if (loading) return <div className="flex items-center justify-center h-full text-text-muted text-xs">Loading...</div>;
  if (!data.length) return <div className="flex items-center justify-center h-full text-text-muted text-xs">No findings</div>;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={3}>
          {data.map((d) => <Cell key={d.name} fill={COLORS[d.name]} />)}
        </Pie>
        <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, fontSize: 12 }} />
        <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
