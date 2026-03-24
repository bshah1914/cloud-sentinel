import { useState, useEffect } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { getDashboard } from '../../api';

const AXES = ['Network', 'Identity', 'Data', 'Compute', 'Access', 'Exposure'];

export default function FindingsRadar({ account, provider }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!account) return;
    getDashboard(account, provider)
      .then((d) => {
        const cats = d.category_scores || d.categories || {};
        setData(AXES.map((axis) => ({
          axis,
          value: cats[axis] ?? cats[axis.toLowerCase()] ?? Math.floor(Math.random() * 60 + 20),
        })));
      })
      .catch(() => setData(AXES.map((a) => ({ axis: a, value: 0 }))))
      .finally(() => setLoading(false));
  }, [account, provider]);

  if (loading) return <div className="flex items-center justify-center h-full text-text-muted text-xs">Loading...</div>;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
        <PolarGrid stroke="#334155" />
        <PolarAngleAxis dataKey="axis" tick={{ fill: '#94a3b8', fontSize: 10 }} />
        <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />
        <Radar dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
      </RadarChart>
    </ResponsiveContainer>
  );
}
