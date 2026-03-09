import { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import {
  Cloud, Shield, Server, AlertTriangle, Globe, Plus, Layers,
  CheckCircle2, XCircle, ArrowRight
} from 'lucide-react';
import { getMultiCloudOverview } from '../api';
import Card from '../components/Card';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import SecurityScore from '../components/SecurityScore';

const PROVIDER_META = {
  aws: { name: 'Amazon Web Services', short: 'AWS', color: '#FF9900', icon: '☁️' },
  azure: { name: 'Microsoft Azure', short: 'Azure', color: '#0078D4', icon: '🔷' },
  gcp: { name: 'Google Cloud Platform', short: 'GCP', color: '#4285F4', icon: '🔵' },
};

export default function Overview() {
  const { accounts } = useOutletContext();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMultiCloudOverview()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader text="Loading multi-cloud overview..." />;

  if (!data || data.total_accounts === 0) {
    return (
      <EmptyState
        icon={Plus}
        title="No cloud accounts configured"
        description="Add an AWS, Azure, or GCP account to get started."
        action={
          <Link to="/accounts" className="px-5 py-2.5 bg-primary hover:bg-primary-dark rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Account
          </Link>
        }
      />
    );
  }

  const providerPie = Object.entries(data.providers).map(([pid, p]) => ({
    name: p.short_name, value: p.total_resources,
    color: PROVIDER_META[pid]?.color || '#6366f1',
  })).filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Globe className="w-6 h-6 text-primary" /> Multi-Cloud Overview
        </h1>
        <p className="text-text-muted text-sm mt-1">
          {data.total_accounts} account(s) across {Object.keys(data.providers).length} cloud provider(s)
        </p>
      </motion.div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}
          className="bg-gradient-to-br from-indigo-500/20 to-indigo-600/5 border border-indigo-500/20 rounded-xl p-5">
          <p className="text-text-muted text-sm">Total Accounts</p>
          <p className="text-3xl font-bold text-text mt-1">{data.total_accounts}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/5 border border-cyan-500/20 rounded-xl p-5">
          <p className="text-text-muted text-sm">Total Resources</p>
          <p className="text-3xl font-bold text-text mt-1">{data.total_resources}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-amber-500/20 to-amber-600/5 border border-amber-500/20 rounded-xl p-5">
          <p className="text-text-muted text-sm">Security Findings</p>
          <p className="text-3xl font-bold text-text mt-1">{data.total_findings}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/5 border border-emerald-500/20 rounded-xl p-5">
          <p className="text-text-muted text-sm">Avg Security Score</p>
          <p className="text-3xl font-bold text-text mt-1">{data.avg_security_score}/100</p>
        </motion.div>
      </div>

      {/* Provider cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {Object.entries(PROVIDER_META).map(([pid, meta]) => {
          const provider = data.providers[pid];
          const hasAccounts = provider && provider.accounts && provider.accounts.length > 0;

          return (
            <Card key={pid} delay={0.1}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{meta.icon}</span>
                  <div>
                    <h3 className="text-sm font-semibold">{meta.short}</h3>
                    <p className="text-xs text-text-muted">{meta.name}</p>
                  </div>
                </div>
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ background: hasAccounts ? meta.color : '#4b5563' }}
                />
              </div>

              {hasAccounts ? (
                <div className="space-y-3">
                  {provider.accounts.map((acct) => (
                    <div key={acct.name} className="bg-surface/50 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{acct.name}</span>
                        <span className={`text-xs font-bold ${
                          acct.security_score >= 80 ? 'text-emerald-400' :
                          acct.security_score >= 50 ? 'text-amber-400' : 'text-red-400'
                        }`}>
                          {acct.security_score}/100
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1.5 text-xs text-text-muted">
                        <span>{acct.total_resources} resources</span>
                        <span>{acct.total_findings} findings</span>
                        <span>{acct.regions_scanned} regions</span>
                      </div>
                    </div>
                  ))}
                  <p className="text-xs text-text-muted text-center mt-2">
                    {provider.total_resources} total resources
                  </p>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm text-text-muted mb-3">No {meta.short} accounts</p>
                  <Link
                    to="/accounts"
                    className="text-xs text-primary hover:text-primary-light transition-colors inline-flex items-center gap-1"
                  >
                    Add Account <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Resource distribution pie */}
      {providerPie.length > 0 && (
        <Card delay={0.2}>
          <h3 className="text-sm font-semibold text-text-muted mb-4">Resources by Provider</h3>
          <div className="flex items-center justify-center gap-8">
            <ResponsiveContainer width={200} height={200}>
              <PieChart>
                <Pie data={providerPie} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {providerPie.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3">
              {providerPie.map((d) => (
                <div key={d.name} className="flex items-center gap-3 text-sm">
                  <span className="w-3 h-3 rounded-full" style={{ background: d.color }} />
                  <span className="text-text-muted">{d.name}</span>
                  <span className="text-text font-semibold">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
