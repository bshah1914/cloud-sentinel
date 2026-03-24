import { useState, useEffect } from 'react';
import { Server, Database, HardDrive, Cloud, Cpu, Globe } from 'lucide-react';
import { getDashboard } from '../../api';

const ICONS = { EC2: Server, S3: HardDrive, RDS: Database, Lambda: Cloud, VPC: Globe, Total: Cpu };

export default function ResourceStatGrid({ account, provider }) {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!account) return;
    getDashboard(account, provider)
      .then((d) => {
        const t = d.totals || d.resource_counts || d.resources || {};
        const entries = Object.entries(t).filter(([, v]) => typeof v === 'number');
        setStats(entries.length ? entries.map(([k, v]) => ({ name: k, count: v })) : []);
      })
      .catch(() => setStats([]))
      .finally(() => setLoading(false));
  }, [account, provider]);

  if (loading) return <div className="flex items-center justify-center h-full text-text-muted text-xs">Loading...</div>;
  if (!stats.length) return <div className="flex items-center justify-center h-full text-text-muted text-xs">No resource data</div>;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
      {stats.map((s) => {
        const Icon = ICONS[s.name] || Server;
        return (
          <div key={s.name} className="flex flex-col items-center gap-1 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition">
            <Icon className="w-4 h-4 text-primary-light" />
            <span className="text-lg font-bold text-text">{s.count}</span>
            <span className="text-[10px] text-text-muted uppercase">{s.name}</span>
          </div>
        );
      })}
    </div>
  );
}
