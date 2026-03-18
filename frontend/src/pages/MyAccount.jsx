import { useState, useEffect } from 'react';
import { getClientProfile, getClientInvoices } from '../api';

export default function MyAccount() {
  const [profile, setProfile] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [tab, setTab] = useState('plan');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [p, i] = await Promise.all([getClientProfile(), getClientInvoices()]);
        setProfile(p);
        setInvoices(i.invoices || []);
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-full"><div className="text-gray-400">Loading...</div></div>;
  if (!profile) return <div className="p-6 text-gray-400">Unable to load account. Contact your administrator.</div>;

  const org = profile.organization;
  const plan = profile.plan;

  return (
    <div className="p-6 space-y-6 max-w-[1200px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">My Account</h1>
        <p className="text-sm text-gray-400 mt-1">{org.name} - Account settings and billing</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#1e1b4b]/50 p-1 rounded-lg w-fit">
        {[
          { id: 'plan', label: 'My Plan' },
          { id: 'team', label: 'Team' },
          { id: 'billing', label: 'Billing' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${tab === t.id ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-white'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Plan Tab */}
      {tab === 'plan' && (
        <div className="space-y-4">
          <div className="bg-[#1e1b4b]/60 border border-white/5 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-white">Current Plan: <span className="text-violet-400">{plan.name}</span></h3>
                <p className="text-sm text-gray-400 mt-1">{plan.price === 0 ? 'Free forever' : `$${plan.price}/month`}</p>
              </div>
              <span className={`text-xs px-3 py-1.5 rounded-full font-semibold ${org.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                {org.status}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { l: 'Cloud Accounts', v: plan.max_accounts === -1 ? 'Unlimited' : plan.max_accounts, used: (org.cloud_accounts || []).length },
                { l: 'Scans / Month', v: plan.max_scans_per_month === -1 ? 'Unlimited' : plan.max_scans_per_month, used: org.scans_this_month || 0 },
                { l: 'Team Members', v: plan.max_users === -1 ? 'Unlimited' : plan.max_users, used: (profile.users || []).length },
                { l: 'Compliance Frameworks', v: plan.compliance_frameworks },
                { l: 'Support Level', v: (plan.support || '').charAt(0).toUpperCase() + (plan.support || '').slice(1) },
                { l: 'Member Since', v: new Date(org.created).toLocaleDateString() },
              ].map((s, i) => (
                <div key={i} className="bg-[#0f0a2a]/50 rounded-lg p-4">
                  <p className="text-xs text-gray-400 mb-1">{s.l}</p>
                  <p className="text-lg font-bold text-white">{s.v}</p>
                  {s.used !== undefined && <p className="text-xs text-gray-500 mt-1">{s.used} used</p>}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#1e1b4b]/60 border border-white/5 rounded-xl p-6">
            <h3 className="text-sm font-semibold text-white mb-3">Included Features</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {(plan.features || []).map(f => (
                <div key={f} className="flex items-center gap-2 py-1.5">
                  <span className="text-emerald-400 text-sm">&#10003;</span>
                  <span className="text-sm text-gray-300 capitalize">{f.replace(/_/g, ' ')}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-4 border-t border-white/5 pt-3">Need more features? Contact your administrator to upgrade.</p>
          </div>
        </div>
      )}

      {/* Team Tab */}
      {tab === 'team' && (
        <div className="bg-[#1e1b4b]/60 border border-white/5 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">
              Team Members ({(profile.users || []).length}/{plan.max_users === -1 ? '∞' : plan.max_users})
            </h3>
          </div>
          <div className="space-y-2">
            {(profile.users || []).map(u => (
              <div key={u.id} className="flex items-center justify-between p-3 rounded-lg bg-[#0f0a2a]/50 border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-violet-600/30 flex items-center justify-center">
                    <span className="text-sm font-bold text-violet-300">{u.username[0].toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium">{u.username}</p>
                    <p className="text-xs text-gray-500">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs px-2 py-1 rounded bg-violet-600/20 text-violet-300 capitalize">{u.role.replace('_', ' ')}</span>
                  <span className={`text-xs ${u.status === 'active' ? 'text-emerald-400' : 'text-red-400'}`}>{u.status}</span>
                  <span className="text-xs text-gray-500">{u.last_login ? `Last: ${new Date(u.last_login).toLocaleDateString()}` : 'Never logged in'}</span>
                </div>
              </div>
            ))}
            {(!profile.users || profile.users.length === 0) && (
              <p className="text-gray-500 text-sm py-4 text-center">No team members. Contact your administrator to add users.</p>
            )}
          </div>
        </div>
      )}

      {/* Billing Tab */}
      {tab === 'billing' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#1e1b4b]/60 border border-white/5 rounded-xl p-5">
              <p className="text-xs text-gray-400 mb-1">Monthly Cost</p>
              <p className="text-2xl font-bold text-emerald-400">{plan.price === 0 ? 'Free' : `$${plan.price}`}</p>
              <p className="text-xs text-gray-500 mt-1">per month</p>
            </div>
            <div className="bg-[#1e1b4b]/60 border border-white/5 rounded-xl p-5">
              <p className="text-xs text-gray-400 mb-1">Annual Cost</p>
              <p className="text-2xl font-bold text-violet-400">{plan.price === 0 ? 'Free' : `$${plan.price * 12}`}</p>
              <p className="text-xs text-gray-500 mt-1">per year</p>
            </div>
            <div className="bg-[#1e1b4b]/60 border border-white/5 rounded-xl p-5">
              <p className="text-xs text-gray-400 mb-1">Payment Method</p>
              <p className="text-lg font-bold text-gray-300">{org.billing?.payment_method || 'Not set'}</p>
              <p className="text-xs text-gray-500 mt-1">Contact admin to update</p>
            </div>
          </div>

          <div className="bg-[#1e1b4b]/60 border border-white/5 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Invoices</h3>
            {invoices.length > 0 ? (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    {['Invoice ID', 'Amount', 'Description', 'Status', 'Date'].map(h => (
                      <th key={h} className="text-left text-xs text-gray-400 font-medium px-3 py-2">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {invoices.map(inv => (
                    <tr key={inv.id} className="border-b border-white/5">
                      <td className="px-3 py-3 text-sm text-white font-mono">{inv.id}</td>
                      <td className="px-3 py-3 text-sm text-emerald-400 font-medium">${inv.amount}</td>
                      <td className="px-3 py-3 text-sm text-gray-300">{inv.description}</td>
                      <td className="px-3 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${inv.status === 'paid' ? 'bg-emerald-600/20 text-emerald-400' : inv.status === 'overdue' ? 'bg-red-600/20 text-red-400' : 'bg-yellow-600/20 text-yellow-400'}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-500">{new Date(inv.created).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-500 text-sm py-4 text-center">No invoices yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
