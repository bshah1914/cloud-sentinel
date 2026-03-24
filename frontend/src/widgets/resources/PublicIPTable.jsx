import { useState, useEffect } from 'react';
import { getDashboard } from '../../api';

export default function PublicIPTable({ account, provider }) {
  const [ips, setIps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!account) return;
    getDashboard(account, provider)
      .then((d) => setIps(d.public_ips || d.publicIps || []))
      .catch(() => setIps([]))
      .finally(() => setLoading(false));
  }, [account, provider]);

  if (loading) return <div className="flex items-center justify-center h-full text-text-muted text-xs">Loading...</div>;
  if (!ips.length) return <div className="flex items-center justify-center h-full text-text-muted text-xs">No public IPs found</div>;

  return (
    <div className="overflow-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-text-muted border-b border-border/20">
            <th className="pb-2 pr-3">IP Address</th>
            <th className="pb-2 pr-3">Resource</th>
            <th className="pb-2 pr-3">Type</th>
            <th className="pb-2">Region</th>
          </tr>
        </thead>
        <tbody>
          {ips.map((ip, i) => (
            <tr key={i} className="border-b border-border/10 hover:bg-white/5 transition">
              <td className="py-1.5 pr-3 font-mono text-primary-light">{ip.ip || ip.address || ip}</td>
              <td className="py-1.5 pr-3 text-text truncate max-w-[120px]">{ip.resource || ip.instance_id || '-'}</td>
              <td className="py-1.5 pr-3 text-text-muted">{ip.type || ip.resource_type || '-'}</td>
              <td className="py-1.5 text-text-muted">{ip.region || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
