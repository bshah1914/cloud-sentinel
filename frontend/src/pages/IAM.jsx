import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  KeyRound, Users, ShieldCheck, FileText, ChevronDown,
  ChevronRight, Search, UserCheck, UserX
} from 'lucide-react';
import { getIAM } from '../api';
import Card from '../components/Card';
import StatCard from '../components/StatCard';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';

const TOOLTIP_STYLE = {
  background: '#111827', border: '1px solid rgba(99,102,241,0.15)',
  borderRadius: '12px', color: '#f1f5f9', fontSize: '12px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
};

export default function IAM() {
  const { account } = useOutletContext();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('users');
  const [search, setSearch] = useState('');
  const [expandedRows, setExpandedRows] = useState(new Set());

  useEffect(() => {
    if (!account) return;
    setLoading(true);
    getIAM(account)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [account]);

  if (loading) return <Loader text="Loading IAM data..." />;
  if (error) return <EmptyState title="Error" description={error} />;
  if (!data) return <EmptyState title="No data" />;

  const { users, roles, policies, summary } = data;

  const toggleRow = (i) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const filterItems = (items) => {
    if (!search) return items;
    const s = search.toLowerCase();
    return items.filter((item) =>
      (item.name || '').toLowerCase().includes(s) ||
      (item.arn || '').toLowerCase().includes(s)
    );
  };

  const summaryChart = [
    { name: 'Users', count: summary.Users || 0, fill: '#7c3aed' },
    { name: 'Roles', count: summary.Roles || 0, fill: '#06b6d4' },
    { name: 'Groups', count: summary.Groups || 0, fill: '#10b981' },
    { name: 'Policies', count: summary.Policies || 0, fill: '#f59e0b' },
  ];

  const tabs = [
    { key: 'users', label: 'Users', icon: Users, count: users.length },
    { key: 'roles', label: 'Roles', icon: ShieldCheck, count: roles.length },
    { key: 'policies', label: 'Policies', icon: FileText, count: policies.length },
  ];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent/12 flex items-center justify-center">
            <KeyRound className="w-4.5 h-4.5 text-accent-light" />
          </div>
          IAM Report
        </h1>
        <p className="text-text-muted text-sm mt-1.5">Identity and Access Management for <span className="text-accent font-medium">{account}</span></p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Users} label="Users" value={summary.Users || 0} color="primary" delay={0} />
        <StatCard icon={ShieldCheck} label="Roles" value={summary.Roles || 0} color="accent" delay={0.03} />
        <StatCard icon={Users} label="Groups" value={summary.Groups || 0} color="success" delay={0.06} />
        <StatCard icon={FileText} label="Policies" value={summary.Policies || 0} color="warning" delay={0.09} />
      </div>

      {/* Chart */}
      <Card delay={0.1} hover={false}>
        <h3 className="text-xs font-semibold text-text-muted mb-4 uppercase tracking-wider">IAM Overview</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={summaryChart}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.06)" />
            <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Bar dataKey="count" radius={[8, 8, 0, 0]}>
              {summaryChart.map((entry, i) => (
                <motion.rect key={i} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Tabs + Search */}
      <div className="flex items-center gap-2 flex-wrap">
        {tabs.map(({ key, label, icon: Icon, count }) => (
          <button key={key} onClick={() => { setActiveTab(key); setExpandedRows(new Set()); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition-all border ${
              activeTab === key
                ? 'bg-primary/10 text-primary-light border-primary/15'
                : 'bg-surface-light/50 text-text-muted border-border/30 hover:text-text hover:border-border/50'
            }`}>
            <Icon className="w-3.5 h-3.5" /> {label}
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-surface-lighter/50 font-semibold">{count}</span>
          </button>
        ))}
        <div className="ml-auto relative max-w-xs flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..."
            className="w-full bg-surface-light/50 border border-border/50 rounded-xl pl-10 pr-3 py-2.5 text-sm text-text placeholder:text-text-muted/50 focus:outline-none focus:border-primary/40 transition-all" />
        </div>
      </div>

      {/* Users */}
      {activeTab === 'users' && (
        <Card delay={0.2} hover={false}>
          <div className="space-y-0.5">
            {filterItems(users).map((user, i) => (
              <div key={i}>
                <button onClick={() => toggleRow(i)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/[0.02] transition-all text-left">
                  <motion.div animate={{ rotate: expandedRows.has(i) ? 90 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronRight className="w-3.5 h-3.5 text-text-muted" />
                  </motion.div>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${user.mfa_devices?.length > 0 ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
                    {user.mfa_devices?.length > 0 ? <UserCheck className="w-4 h-4 text-emerald-400" /> : <UserX className="w-4 h-4 text-amber-400" />}
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-medium">{user.name}</span>
                    <p className="text-[10px] text-text-muted font-mono truncate">{user.arn}</p>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-text-muted">
                    <span className="bg-surface-lighter/30 px-2 py-0.5 rounded-md">{user.policies.length} policies</span>
                    <span className="bg-surface-lighter/30 px-2 py-0.5 rounded-md">{user.groups?.length || 0} groups</span>
                  </div>
                </button>
                <AnimatePresence>
                  {expandedRows.has(i) && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="ml-16 mr-4 mb-2 overflow-hidden">
                      <div className="bg-surface/40 rounded-xl p-4 space-y-3 text-sm border border-border/20">
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="bg-surface-lighter/20 rounded-lg p-2.5">
                            <span className="text-[10px] text-text-muted uppercase tracking-wider">Created</span>
                            <p className="text-text mt-0.5">{user.created || '-'}</p>
                          </div>
                          <div className="bg-surface-lighter/20 rounded-lg p-2.5">
                            <span className="text-[10px] text-text-muted uppercase tracking-wider">MFA</span>
                            <p className={`mt-0.5 font-medium ${user.mfa_devices?.length > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {user.mfa_devices?.length > 0 ? 'Enabled' : 'Disabled'}
                            </p>
                          </div>
                        </div>
                        {user.policies.length > 0 && (
                          <div>
                            <p className="text-[10px] text-text-muted mb-1.5 uppercase tracking-wider">Attached Policies</p>
                            <div className="flex flex-wrap gap-1.5">
                              {user.policies.map((p) => (
                                <span key={p} className="px-2 py-0.5 rounded-md bg-primary/8 text-primary-light text-[10px] border border-primary/10">{p}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {user.groups?.length > 0 && (
                          <div>
                            <p className="text-[10px] text-text-muted mb-1.5 uppercase tracking-wider">Groups</p>
                            <div className="flex flex-wrap gap-1.5">
                              {user.groups.map((g) => (
                                <span key={g} className="px-2 py-0.5 rounded-md bg-accent/8 text-accent text-[10px] border border-accent/10">{g}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
            {filterItems(users).length === 0 && <EmptyState title="No users found" />}
          </div>
        </Card>
      )}

      {/* Roles */}
      {activeTab === 'roles' && (
        <Card delay={0.2} hover={false}>
          <div className="space-y-0.5">
            {filterItems(roles).map((role, i) => (
              <div key={i}>
                <button onClick={() => toggleRow(i)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/[0.02] transition-all text-left">
                  <motion.div animate={{ rotate: expandedRows.has(i) ? 90 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronRight className="w-3.5 h-3.5 text-text-muted" />
                  </motion.div>
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-medium">{role.name}</span>
                    <p className="text-[10px] text-text-muted font-mono truncate">{role.arn}</p>
                  </div>
                  <span className="text-[10px] text-text-muted bg-surface-lighter/30 px-2 py-0.5 rounded-md">{role.policies.length} policies</span>
                </button>
                <AnimatePresence>
                  {expandedRows.has(i) && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="ml-16 mr-4 mb-2 overflow-hidden">
                      <div className="bg-surface/40 rounded-xl p-4 space-y-3 text-sm border border-border/20">
                        <div className="text-xs text-text-muted">Created: {role.created || '-'}</div>
                        {role.policies.length > 0 && (
                          <div>
                            <p className="text-[10px] text-text-muted mb-1.5 uppercase tracking-wider">Policies</p>
                            <div className="flex flex-wrap gap-1.5">
                              {role.policies.map((p) => <span key={p} className="px-2 py-0.5 rounded-md bg-primary/8 text-primary-light text-[10px] border border-primary/10">{p}</span>)}
                            </div>
                          </div>
                        )}
                        {role.trust_policy && (
                          <div>
                            <p className="text-[10px] text-text-muted mb-1.5 uppercase tracking-wider">Trust Policy</p>
                            <pre className="text-[11px] bg-surface rounded-xl p-3.5 overflow-x-auto text-text-muted border border-border/20 leading-relaxed">
                              {JSON.stringify(role.trust_policy, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
            {filterItems(roles).length === 0 && <EmptyState title="No roles found" />}
          </div>
        </Card>
      )}

      {/* Policies */}
      {activeTab === 'policies' && (
        <Card delay={0.2} hover={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-text-muted text-left border-b border-border/50">
                  {['Policy Name', 'ARN', 'Attachments', 'Attachable'].map((h) => (
                    <th key={h} className="pb-3.5 font-medium text-[10px] uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filterItems(policies).map((p, i) => (
                  <motion.tr key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.015, 0.4) }}
                    className="border-b border-border/15 hover:bg-white/[0.015] transition-all">
                    <td className="py-3 font-medium text-text">{p.name}</td>
                    <td className="py-3 font-mono text-[10px] text-text-muted truncate max-w-[300px]">{p.arn}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${p.attachment_count > 0 ? 'bg-primary/10 text-primary-light' : 'bg-surface-lighter/50 text-text-muted'}`}>
                        {p.attachment_count}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`text-xs font-medium ${p.is_attachable ? 'text-emerald-400' : 'text-text-muted'}`}>
                        {p.is_attachable ? 'Yes' : 'No'}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            {filterItems(policies).length === 0 && <EmptyState title="No policies found" />}
          </div>
        </Card>
      )}
    </div>
  );
}
