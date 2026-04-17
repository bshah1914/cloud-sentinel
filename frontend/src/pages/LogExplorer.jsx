import { useState, useEffect, useMemo, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import {
  Search, Clock, AlertTriangle, Info, XCircle, Bug,
  ChevronRight, RefreshCw, Terminal, FileText,
  ArrowUp, ArrowDown
} from 'lucide-react';
import Card from '../components/Card';
import { getBase } from '../api';

const CHART_TOOLTIP = {
  contentStyle: { background: '#1a2332', border: '1px solid rgba(99,102,241,0.12)', borderRadius: '12px', color: '#eef2ff', fontSize: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' },
};

const LOG_LEVELS = {
  ERROR: { color: '#ef4444', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: XCircle },
  WARN: { color: '#f59e0b', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: AlertTriangle },
  INFO: { color: '#3b82f6', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: Info },
  DEBUG: { color: '#8b5cf6', bg: 'bg-violet-500/10', border: 'border-violet-500/20', icon: Bug },
};

async function fetchJSON(path) {
  const token = localStorage.getItem('cm_token');
  const res = await fetch(`${getBase()}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export default function LogExplorer() {
  const ctx = useOutletContext() || {};
  const account = ctx.account;
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('ALL');
  const [serviceFilter, setServiceFilter] = useState('ALL');
  const [expandedLog, setExpandedLog] = useState(null);
  const [sortDir, setSortDir] = useState('desc');
  const [error, setError] = useState(null);
  const [groupsScanned, setGroupsScanned] = useState(0);

  const refresh = useCallback(async () => {
    if (!account) { setLoading(false); return; }
    setRefreshing(true);
    setError(null);
    try {
      const params = new URLSearchParams({ account, level: levelFilter, service: serviceFilter, limit: '200' });
      const data = await fetchJSON(`/monitoring/app-logs?${params}`);
      setLogs(data.logs || []);
      setGroupsScanned(data.groups_scanned || 0);
    } catch (e) {
      setError(e.message);
      setLogs([]);
    }
    setLoading(false);
    setRefreshing(false);
  }, [account, levelFilter, serviceFilter]);

  useEffect(() => { refresh(); }, [refresh]);

  const services = useMemo(() => [...new Set(logs.map(l => l.service))].sort(), [logs]);

  const filtered = useMemo(() => {
    let result = logs;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(l => l.message.toLowerCase().includes(q) || l.service.toLowerCase().includes(q));
    }
    if (sortDir === 'asc') result = [...result].reverse();
    return result;
  }, [logs, search, sortDir]);

  const levelCounts = useMemo(() => {
    const counts = { ERROR: 0, WARN: 0, INFO: 0, DEBUG: 0 };
    logs.forEach(l => { if (counts[l.level] !== undefined) counts[l.level]++; });
    return counts;
  }, [logs]);

  // Build hourly histogram from real logs
  const histogram = useMemo(() => {
    const buckets = {};
    logs.forEach(l => {
      const d = new Date(l.timestamp);
      const key = `${String(d.getHours()).padStart(2, '0')}:00`;
      if (!buckets[key]) buckets[key] = { hour: key, ERROR: 0, WARN: 0, INFO: 0, DEBUG: 0 };
      buckets[key][l.level] = (buckets[key][l.level] || 0) + 1;
    });
    return Object.values(buckets).sort((a, b) => a.hour.localeCompare(b.hour));
  }, [logs]);

  if (!account) {
    return (
      <Card className="!p-8 text-center">
        <Terminal className="w-10 h-10 text-text-muted mx-auto mb-3 opacity-40" />
        <h3 className="text-sm font-semibold text-text mb-1">Select a cloud account</h3>
        <p className="text-xs text-text-muted">Choose an AWS account from the top bar to view cloud logs.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
              <Terminal className="w-5 h-5 text-emerald-400" />
            </div>
            Log Explorer
          </h1>
          <p className="text-sm text-text-muted mt-1">cloud logs from your AWS account ({groupsScanned} log groups scanned)</p>
        </div>
        <button onClick={refresh} className="px-3 py-1.5 rounded-lg bg-surface-light border border-border/30 text-xs text-text-muted hover:text-text transition-all flex items-center gap-1.5">
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          Error loading logs: {error}
        </div>
      )}

      {/* Level summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(LOG_LEVELS).map(([level, config]) => {
          const Icon = config.icon;
          return (
            <button
              key={level}
              onClick={() => setLevelFilter(levelFilter === level ? 'ALL' : level)}
              className={`p-3 rounded-xl border transition-all text-left ${levelFilter === level ? `${config.bg} ${config.border} border` : 'bg-surface-light/60 border-border/30 hover:bg-white/[0.03]'}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-4 h-4" style={{ color: config.color }} />
                <span className="text-xs font-medium text-text-muted uppercase">{level}</span>
              </div>
              <p className="text-xl font-bold text-text">{levelCounts[level] || 0}</p>
            </button>
          );
        })}
      </div>

      {/* Histogram */}
      {histogram.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold text-text mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary-light" /> Log Volume by Hour
          </h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={histogram}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.06)" />
              <XAxis dataKey="hour" tick={{ fontSize: 9, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
              <Tooltip {...CHART_TOOLTIP} />
              <Bar dataKey="ERROR" stackId="a" fill="#ef4444" />
              <Bar dataKey="WARN" stackId="a" fill="#f59e0b" />
              <Bar dataKey="INFO" stackId="a" fill="#3b82f6" />
              <Bar dataKey="DEBUG" stackId="a" fill="#8b5cf6" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Search & Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[300px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder='Search logs...'
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface-light border border-border/30 rounded-xl text-sm text-text placeholder:text-text-muted/50 focus:outline-none focus:border-primary/40"
          />
        </div>
        <select
          value={serviceFilter}
          onChange={e => setServiceFilter(e.target.value)}
          className="px-3 py-2.5 bg-surface-light border border-border/30 rounded-xl text-sm text-text focus:outline-none focus:border-primary/40"
        >
          <option value="ALL">All Log Files</option>
          <option value="access">access.log</option>
          <option value="auth">auth.log</option>
          <option value="app">app.log</option>
          <option value="security">security.log</option>
        </select>
        <button
          onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
          className="px-3 py-2.5 bg-surface-light border border-border/30 rounded-xl text-sm text-text-muted hover:text-text transition-all flex items-center gap-1.5"
        >
          <Clock className="w-3.5 h-3.5" />
          {sortDir === 'desc' ? <ArrowDown className="w-3.5 h-3.5" /> : <ArrowUp className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Log Entries */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-text">{filtered.length} log entries</h3>
          {(levelFilter !== 'ALL' || serviceFilter !== 'ALL' || search) && (
            <button
              onClick={() => { setLevelFilter('ALL'); setServiceFilter('ALL'); setSearch(''); }}
              className="text-xs text-primary-light hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
        {loading ? (
          <div className="text-center py-8 text-sm text-text-muted">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-sm text-text-muted">No log entries match the filters.</div>
        ) : (
          <div className="space-y-1 max-h-[600px] overflow-y-auto">
            {filtered.slice(0, 100).map(log => {
              const config = LOG_LEVELS[log.level] || LOG_LEVELS.INFO;
              const Icon = config.icon;
              const expanded = expandedLog === log.id;
              return (
                <motion.div
                  key={log.id}
                  layout
                  className={`border rounded-lg transition-all cursor-pointer ${expanded ? `${config.bg} ${config.border}` : 'border-border/10 hover:border-border/30 hover:bg-white/[0.01]'}`}
                  onClick={() => setExpandedLog(expanded ? null : log.id)}
                >
                  <div className="flex items-start gap-2 px-3 py-2">
                    <Icon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: config.color }} />
                    <span className="text-[10px] text-text-muted font-mono w-[155px] flex-shrink-0 mt-0.5">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded flex-shrink-0"
                      style={{ background: `${config.color}15`, color: config.color }}>
                      {log.level}
                    </span>
                    <span className="text-[10px] text-cyan-400 font-medium flex-shrink-0">{log.service}</span>
                    <span className="text-xs text-text truncate flex-1 font-mono">{log.message}</span>
                    <ChevronRight className={`w-3.5 h-3.5 text-text-muted flex-shrink-0 transition-transform ${expanded ? 'rotate-90' : ''}`} />
                  </div>
                  <AnimatePresence>
                    {expanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-3 pb-3 pt-1 border-t border-border/10 ml-5">
                          <div className="mt-2 p-2 bg-surface/80 rounded-lg">
                            <p className="text-xs text-text font-mono whitespace-pre-wrap break-all">{log.message}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
        {filtered.length > 100 && (
          <p className="text-center text-xs text-text-muted mt-4">Showing 100 of {filtered.length} entries. Use filters to narrow.</p>
        )}
      </Card>
    </div>
  );
}
