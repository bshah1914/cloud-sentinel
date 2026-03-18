import { useState, useEffect } from 'react';
import { getClientProfile, getClientActivity } from '../api';

export default function ClientDashboard() {
  const [profile, setProfile] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [p, a] = await Promise.all([getClientProfile(), getClientActivity()]);
        setProfile(p);
        setActivity(a.activity || []);
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-full"><div className="text-gray-400">Loading...</div></div>;
  if (!profile) return <div className="p-6 text-gray-400">Unable to load client profile. Contact your administrator.</div>;

  const org = profile.organization;
  const plan = profile.plan;
  const score = org.security_score || 0;
  const scoreColor = score > 70 ? '#10b981' : score > 40 ? '#f59e0b' : '#ef4444';

  return (
    <div className="p-6 space-y-6 max-w-[1200px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">Welcome, {org.name}</h1>
        <p className="text-sm text-gray-400 mt-1">Your cloud security overview</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { l: 'Security Score', v: score || 'N/A', c: scoreColor, sub: score ? `${score > 70 ? 'Good' : score > 40 ? 'Needs Work' : 'Critical'}` : '' },
          { l: 'Resources Monitored', v: org.total_resources || 0, c: '#06b6d4', sub: '17 regions' },
          { l: 'Security Findings', v: org.total_findings || 0, c: '#ef4444', sub: 'Requires attention' },
          { l: 'Scans This Month', v: `${org.scans_this_month || 0}/${plan.max_scans_per_month === -1 ? '∞' : plan.max_scans_per_month}`, c: '#7c3aed', sub: `${plan.name} plan` },
        ].map((s, i) => (
          <div key={i} className="bg-[#1e1b4b]/60 border border-white/5 rounded-xl p-5">
            <p className="text-xs text-gray-400 mb-2">{s.l}</p>
            <p className="text-3xl font-bold" style={{ color: s.c }}>{s.v}</p>
            {s.sub && <p className="text-xs text-gray-500 mt-1">{s.sub}</p>}
          </div>
        ))}
      </div>

      {/* Security Score Ring + Quick Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#1e1b4b]/60 border border-white/5 rounded-xl p-6 flex flex-col items-center justify-center">
          <div className="relative w-32 h-32">
            <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke="#1e1b4b" strokeWidth="8" />
              <circle cx="60" cy="60" r="52" fill="none" stroke={scoreColor} strokeWidth="8"
                strokeDasharray={`${score * 3.27} 327`} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-white">{score}</span>
              <span className="text-xs text-gray-400">/ 100</span>
            </div>
          </div>
          <p className="text-sm font-medium mt-3" style={{ color: scoreColor }}>
            {score > 70 ? 'Good Health' : score > 40 ? 'Needs Improvement' : 'Critical - Action Required'}
          </p>
        </div>

        <div className="bg-[#1e1b4b]/60 border border-white/5 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-3">Quick Info</h3>
          <div className="space-y-3">
            {[
              { l: 'Plan', v: plan.name, c: '#7c3aed' },
              { l: 'Cloud Accounts', v: (org.cloud_accounts || []).length, c: '#06b6d4' },
              { l: 'Team Members', v: (profile.users || []).length, c: '#f59e0b' },
              { l: 'Support Level', v: (plan.support || 'community').charAt(0).toUpperCase() + (plan.support || 'community').slice(1), c: '#10b981' },
              { l: 'Last Scan', v: org.last_scan ? new Date(org.last_scan).toLocaleDateString() : 'Never', c: '#8b5cf6' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-1 border-b border-white/5">
                <span className="text-xs text-gray-400">{item.l}</span>
                <span className="text-sm font-medium" style={{ color: item.c }}>{item.v}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#1e1b4b]/60 border border-white/5 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-3">Cloud Accounts</h3>
          <div className="space-y-2">
            {(org.cloud_accounts || []).map((acc, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                <span className={`text-xs px-2 py-1 rounded font-bold ${acc.provider === 'aws' ? 'bg-orange-500/20 text-orange-400' : acc.provider === 'azure' ? 'bg-blue-500/20 text-blue-400' : 'bg-sky-500/20 text-sky-400'}`}>
                  {acc.provider?.toUpperCase()}
                </span>
                <div>
                  <p className="text-sm text-white font-medium">{acc.name}</p>
                  <p className="text-xs text-gray-500">{acc.id}</p>
                </div>
              </div>
            ))}
            {(!org.cloud_accounts || org.cloud_accounts.length === 0) && (
              <p className="text-sm text-gray-500">No cloud accounts linked. Contact your administrator.</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-[#1e1b4b]/60 border border-white/5 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-3">Recent Activity</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {activity.slice(0, 10).map((a, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-white/5">
              <span className="text-sm text-gray-300">{a.action}</span>
              <span className="text-gray-500 text-xs">{new Date(a.timestamp).toLocaleString()}</span>
            </div>
          ))}
          {activity.length === 0 && <p className="text-gray-500 text-sm">No activity yet. Run your first scan to get started.</p>}
        </div>
      </div>
    </div>
  );
}
