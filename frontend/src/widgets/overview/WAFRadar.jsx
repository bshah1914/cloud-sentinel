import { useState, useEffect } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { getWafReport } from '../../api';

const PILLARS = ['Security', 'Reliability', 'Performance', 'Cost Optimization', 'Operational Excellence', 'Sustainability'];

export default function WAFRadar({ account }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!account) return;
    getWafReport(account)
      .then((d) => {
        const scores = d.pillar_scores || d.pillars || d.scores || {};
        setData(PILLARS.map((p) => ({
          pillar: p.length > 12 ? p.slice(0, 10) + '...' : p,
          score: scores[p] ?? scores[p.toLowerCase()] ?? 0,
        })));
      })
      .catch(() => setData(PILLARS.map((p) => ({ pillar: p.slice(0, 10), score: 0 }))))
      .finally(() => setLoading(false));
  }, [account]);

  if (loading) return <div className="flex items-center justify-center h-full text-text-muted text-xs">Loading...</div>;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart data={data} cx="50%" cy="50%" outerRadius="65%">
        <PolarGrid stroke="#334155" />
        <PolarAngleAxis dataKey="pillar" tick={{ fill: '#94a3b8', fontSize: 9 }} />
        <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />
        <Radar dataKey="score" stroke="#10b981" fill="#10b981" fillOpacity={0.25} />
      </RadarChart>
    </ResponsiveContainer>
  );
}
