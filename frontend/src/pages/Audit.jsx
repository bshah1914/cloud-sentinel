import { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  ShieldCheck, Play, Filter, ChevronDown, ChevronRight,
  AlertTriangle, Search, Download, FileText, Zap, Target
} from 'lucide-react';
import { runAudit, exportAudit } from '../api';
import { useToast } from '../components/Toast';
import Card from '../components/Card';
import StatusBadge from '../components/StatusBadge';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';

const SEV_COLORS = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#eab308',
  LOW: '#3b82f6',
  INFO: '#64748b',
};

const SEV_ICONS = {
  CRITICAL: '!!',
  HIGH: '!',
  MEDIUM: '~',
  LOW: 'i',
  INFO: '-',
};

const SEV_ORDER = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'];

export default function Audit() {
  const { account } = useOutletContext();
  const { addToast } = useToast();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState(new Set(SEV_ORDER));
  const [expandedRows, setExpandedRows] = useState(new Set());

  const handleRunAudit = async () => {
    if (!account) return;
    setLoading(true);
    setError(null);
    try {
      const res = await runAudit(account);
      setResults(res);
      addToast(`Audit complete: ${res.total} findings across ${Object.keys(res.summary).filter(k => res.summary[k] > 0).length} severity levels`, 'success', 5000);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  const toggleSeverity = (sev) => {
    setSeverityFilter((prev) => {
      const next = new Set(prev);
      next.has(sev) ? next.delete(sev) : next.add(sev);
      return next;
    });
  };

  const toggleRow = (i) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const filtered = useMemo(() => {
    if (!results) return [];
    return results.findings.filter((f) => {
      if (!severityFilter.has(f.severity)) return false;
      if (search) {
        const s = search.toLowerCase();
        return (
          (f.title || '').toLowerCase().includes(s) ||
          (f.issue || '').toLowerCase().includes(s) ||
          (f.region || '').toLowerCase().includes(s) ||
          (f.resource || '').toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [results, severityFilter, search]);

  const pieData = results
    ? SEV_ORDER.map((sev) => ({ name: sev, value: results.summary[sev] || 0 })).filter((d) => d.value > 0)
    : [];

  const exportCSV = () => {
    if (!filtered.length) { addToast('No findings to export', 'warning'); return; }
    const headers = 'Severity,Title,Issue,Region,Resource\n';
    const rows = filtered.map((f) =>
      [f.severity, f.title, f.issue, f.region || '', f.resource || ''].map((v) => `"${v}"`).join(',')
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-${account}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Audit CSV report downloaded successfully', 'success');
  };

  const handleExportPdf = async () => {
    try {
      await exportAudit(account, 'pdf');
      addToast('Audit PDF report downloaded successfully', 'success');
    } catch (e) {
      addToast(`PDF export failed: ${e.message}`, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/12 flex items-center justify-center">
              <ShieldCheck className="w-4.5 h-4.5 text-primary-light" />
            </div>
            Security Audit
          </h1>
          <p className="text-text-muted text-sm mt-1.5">Run security audits and review findings for <span className="text-accent font-medium">{account}</span></p>
        </div>
        <div className="flex items-center gap-2.5">
          {results && (
            <>
              <button onClick={exportCSV} className="flex items-center gap-2 px-3.5 py-2 bg-surface-lighter/50 hover:bg-surface-lighter border border-border/50 rounded-xl text-xs font-medium transition-all">
                <Download className="w-3.5 h-3.5" /> CSV
              </button>
              <button onClick={handleExportPdf} className="flex items-center gap-2 px-3.5 py-2 bg-surface-lighter/50 hover:bg-surface-lighter border border-border/50 rounded-xl text-xs font-medium transition-all">
                <FileText className="w-3.5 h-3.5" /> PDF
              </button>
            </>
          )}
          <button
            onClick={handleRunAudit}
            disabled={loading || !account}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary disabled:opacity-50 rounded-xl text-sm font-medium transition-all shadow-lg shadow-primary/15"
          >
            {loading ? (
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            {loading ? 'Running...' : 'Run Audit'}
          </button>
        </div>
      </motion.div>

      {error && (
        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/8 border border-red-500/15 rounded-xl p-4 text-red-400 text-sm flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
        </motion.div>
      )}

      {loading && <Loader text="Running security audit..." />}

      {results && !loading && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-7 gap-3">
            {/* Pie chart */}
            <Card delay={0} className="col-span-2 flex items-center justify-center" hover={false}>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value" animationDuration={800}>
                    {pieData.map((d) => <Cell key={d.name} fill={SEV_COLORS[d.name]} stroke="transparent" />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#111827', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '12px', color: '#f1f5f9', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
            {/* Severity counts */}
            {SEV_ORDER.map((sev, i) => (
              <motion.div
                key={sev}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * (i + 1) }}
                whileHover={{ scale: 1.03 }}
                onClick={() => toggleSeverity(sev)}
                className={`rounded-2xl bg-surface-light/80 border p-4 cursor-pointer transition-all text-center ${
                  severityFilter.has(sev) ? 'border-border/50 opacity-100' : 'border-border/20 opacity-40'
                }`}
              >
                <p className="text-3xl font-bold tabular-nums" style={{ color: SEV_COLORS[sev] }}>{results.summary[sev] || 0}</p>
                <p className="text-[10px] text-text-muted mt-1 uppercase tracking-wider font-medium">{sev}</p>
              </motion.div>
            ))}
          </div>

          {/* Search + Filters */}
          <Card delay={0.15} hover={false}>
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search findings by title, issue, region, or resource..."
                  className="w-full bg-surface/60 border border-border/50 rounded-xl pl-10 pr-3 py-2.5 text-sm text-text placeholder:text-text-muted/50 focus:outline-none focus:border-primary/40 transition-all"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-text-muted mr-1" />
                {SEV_ORDER.map((sev) => (
                  <button
                    key={sev}
                    onClick={() => toggleSeverity(sev)}
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all border ${
                      severityFilter.has(sev)
                        ? 'border-current/30 opacity-100'
                        : 'border-transparent opacity-30'
                    }`}
                    style={{ color: SEV_COLORS[sev] }}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Findings */}
          <Card delay={0.2} hover={false}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Target className="w-4 h-4 text-text-muted" />
                Findings
                <span className="text-xs text-text-muted font-normal">({filtered.length} of {results.total})</span>
              </h3>
            </div>
            <div className="space-y-0.5">
              {filtered.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.015, 0.4) }}
                >
                  <button
                    onClick={() => toggleRow(i)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/[0.02] transition-all text-left group"
                  >
                    <motion.div animate={{ rotate: expandedRows.has(i) ? 90 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronRight className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
                    </motion.div>
                    <StatusBadge status={f.severity} className="flex-shrink-0" />
                    <span className="text-sm flex-1 truncate group-hover:text-text transition-colors">{f.title || f.issue}</span>
                    {f.region && (
                      <span className="text-[10px] text-text-muted bg-surface-lighter/50 px-2 py-0.5 rounded-md">{f.region}</span>
                    )}
                  </button>
                  <AnimatePresence>
                    {expandedRows.has(i) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="ml-11 mr-4 mb-2 overflow-hidden"
                      >
                        <div className="bg-surface/40 rounded-xl p-4 space-y-3 text-sm border border-border/30">
                          {f.description && <p className="text-text-muted text-xs leading-relaxed">{f.description}</p>}
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="bg-surface-lighter/30 rounded-lg p-2.5">
                              <span className="text-text-muted text-[10px] uppercase tracking-wider">Issue ID</span>
                              <p className="font-mono text-text mt-0.5">{f.issue}</p>
                            </div>
                            <div className="bg-surface-lighter/30 rounded-lg p-2.5">
                              <span className="text-text-muted text-[10px] uppercase tracking-wider">Group</span>
                              <p className="text-text mt-0.5">{f.group}</p>
                            </div>
                            {f.resource && (
                              <div className="bg-surface-lighter/30 rounded-lg p-2.5">
                                <span className="text-text-muted text-[10px] uppercase tracking-wider">Resource</span>
                                <p className="font-mono text-accent text-xs mt-0.5 truncate">{f.resource}</p>
                              </div>
                            )}
                            {f.region && (
                              <div className="bg-surface-lighter/30 rounded-lg p-2.5">
                                <span className="text-text-muted text-[10px] uppercase tracking-wider">Region</span>
                                <p className="text-text mt-0.5">{f.region}</p>
                              </div>
                            )}
                          </div>
                          {f.details && (
                            <pre className="text-[11px] bg-surface rounded-xl p-3.5 overflow-x-auto text-text-muted mt-2 border border-border/30 leading-relaxed">
                              {typeof f.details === 'string' ? f.details : JSON.stringify(f.details, null, 2)}
                            </pre>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
              {filtered.length === 0 && (
                <EmptyState title="No findings match" description="Try adjusting your search or filters" />
              )}
            </div>
          </Card>
        </>
      )}

      {!results && !loading && (
        <EmptyState
          icon={ShieldCheck}
          title="No audit results yet"
          description="Click 'Run Audit' to scan your cloud account for security issues, misconfigurations, and compliance violations."
        />
      )}
    </div>
  );
}
