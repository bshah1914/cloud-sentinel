import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { getDashboard } from '../../api';

export default function ResourceBarChart({ account, provider }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!account) return;
    getDashboard(account, provider)
      .then((d) => {
        const regions = d.regions || d.resources_by_region || {};
        setData(
          Object.entries(regions).map(([region, count]) => ({
            region: region.replace(/-/g, '-\u200B'),
            count: typeof count === 'number' ? count : Object.keys(count).length,
          }))
        );
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [account, provider]);

  if (loading) return <div className="flex items-center justify-center h-full text-text-muted text-xs">Loading...</div>;
  if (!data.length) return <div className="flex items-center justify-center h-full text-text-muted text-xs">No region data</div>;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis dataKey="region" tick={{ fill: '#94a3b8', fontSize: 9 }} angle={-30} textAnchor="end" height={50} />
        <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
        <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, fontSize: 12 }} />
        <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
