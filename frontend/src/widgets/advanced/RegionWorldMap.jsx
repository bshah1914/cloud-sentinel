import { useState, useEffect } from 'react';
import { getDashboard } from '../../api';

const REGION_COORDS = {
  'us-east-1': [75, 38], 'us-east-2': [72, 36], 'us-west-1': [22, 37], 'us-west-2': [20, 33],
  'eu-west-1': [145, 28], 'eu-west-2': [148, 26], 'eu-central-1': [155, 27],
  'ap-southeast-1': [230, 52], 'ap-southeast-2': [250, 72], 'ap-northeast-1': [255, 35],
  'ap-south-1': [210, 45], 'sa-east-1': [95, 68], 'ca-central-1': [65, 28],
  'me-south-1': [190, 42], 'af-south-1': [165, 65],
};

export default function RegionWorldMap({ account, provider }) {
  const [regions, setRegions] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!account) return;
    getDashboard(account, provider)
      .then((d) => setRegions(d.regions || d.resources_by_region || {}))
      .catch(() => setRegions({}))
      .finally(() => setLoading(false));
  }, [account, provider]);

  if (loading) return <div className="flex items-center justify-center h-full text-text-muted text-xs">Loading...</div>;

  return (
    <div className="flex items-center justify-center h-full">
      <svg viewBox="0 0 300 100" className="w-full max-h-full">
        {/* Simple world outline */}
        <rect x="0" y="0" width="300" height="100" fill="none" />
        <ellipse cx="150" cy="50" rx="140" ry="45" fill="none" stroke="#334155" strokeWidth="0.5" />
        <line x1="10" y1="50" x2="290" y2="50" stroke="#334155" strokeWidth="0.3" strokeDasharray="2" />
        <line x1="150" y1="5" x2="150" y2="95" stroke="#334155" strokeWidth="0.3" strokeDasharray="2" />
        {/* Region dots */}
        {Object.entries(regions).map(([region, count]) => {
          const coords = REGION_COORDS[region];
          if (!coords) return null;
          const size = Math.min(6, Math.max(2, typeof count === 'number' ? Math.sqrt(count) : 2));
          return (
            <g key={region}>
              <circle cx={coords[0]} cy={coords[1]} r={size} fill="#6366f1" fillOpacity={0.6} stroke="#6366f1" strokeWidth="0.5" />
              <circle cx={coords[0]} cy={coords[1]} r={size + 2} fill="#6366f1" fillOpacity={0.15} />
              <text x={coords[0]} y={coords[1] - size - 2} textAnchor="middle" fill="#94a3b8" fontSize="3.5">{region}</text>
            </g>
          );
        })}
        {!Object.keys(regions).length && (
          <text x="150" y="52" textAnchor="middle" fill="#64748b" fontSize="6">No region data available</text>
        )}
      </svg>
    </div>
  );
}
