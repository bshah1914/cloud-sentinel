import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import {
  Search, Filter, Clock, AlertTriangle, Info, XCircle, Bug,
  ChevronDown, ChevronRight, Download, RefreshCw, Terminal, FileText,
  ArrowUp, ArrowDown
} from 'lucide-react';
import Card from '../components/Card';

const CHART_TOOLTIP = {
  contentStyle: { background: '#1a2332', border: '1px solid rgba(99,102,241,0.12)', borderRadius: '12px', color: '#eef2ff', fontSize: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' },
};

const LOG_LEVELS = {
  ERROR: { color: '#ef4444', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: XCircle },
  WARN: { color: '#f59e0b', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: AlertTriangle },
  INFO: { color: '#3b82f6', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: Info },
  DEBUG: { color: '#8b5cf6', bg: 'bg-violet-500/10', border: 'border-violet-500/20', icon: Bug },
};

function generateLogs(count = 100) {
  const services = ['api-gateway', 'auth-service', 'user-service', 'payment-service', 'notification-svc', 'scheduler', 'web-frontend'];
  const hosts = ['prod-web-01', 'prod-web-02', 'prod-api-01', 'prod-db-01', 'staging-web-01'];
  const levels = ['ERROR', 'WARN', 'INFO', 'INFO', 'INFO', 'DEBUG', 'INFO', 'WARN'];
  const messages = {
    ERROR: [
      'Connection refused to database replica db-read-02:5432',
      'OutOfMemoryError: Java heap space exceeded 2048MB limit',
      'TLS handshake failed: certificate expired for *.internal.svc',
      'Request timeout after 30s: POST /api/v2/payments/process',
      'Unhandled exception in worker thread pool-3-thread-7',
      'FATAL: password authentication failed for user "app_readonly"',
    ],
    WARN: [
      'High memory usage detected: 89% of 8GB allocated',
      'Slow query detected: SELECT * FROM orders WHERE... (3.2s)',
      'Rate limit approaching: 450/500 requests per minute',
      'Certificate expiring in 7 days for api.cloudsentrix.io',
      'Retry attempt 3/5 for upstream service payment-gateway',
      'Connection pool near capacity: 48/50 active connections',
    ],
    INFO: [
      'Request completed: GET /api/v1/users/profile (142ms)',
      'User login successful: user_id=usr_8x92k email=admin@corp.io',
      'Background job completed: daily-report-generation (45s)',
      'Health check passed: all 5 dependencies healthy',
      'Cache invalidated: 234 keys in namespace user-sessions',
      'Deployment v3.2.1 rolling update: 3/5 pods ready',
      'Metric export completed: 12,847 data points to Prometheus',
      'Webhook delivered: event=payment.succeeded to https://hooks.stripe.com',
    ],
    DEBUG: [
      'SQL query executed: SELECT id, email FROM users WHERE active=true (2ms)',
      'Redis GET cache:user:8x92k => HIT (0.3ms)',
      'HTTP client request: GET https://api.stripe.com/v1/charges (89ms)',
      'JWT token validated: sub=usr_8x92k exp=2026-04-08T12:00:00Z',
    ],
  };

  const now = Date.now();
  return Array.from({ length: count }, (_, i) => {
    const level = levels[Math.floor(Math.random() * levels.length)];
    const msgs = messages[level];
    return {
      id: `log-${count - i}`,
      timestamp: new Date(now - i * (Math.random() * 30000 + 5000)).toISOString(),
      level,
      service: services[Math.floor(Math.random() * services.length)],
      hostname: hosts[Math.floor(Math.random() * hosts.length)],
      message: msgs[Math.floor(Math.random() * msgs.length)],
      traceId: `trace-${Math.random().toString(36).slice(2, 14)}`,
    };
  });
}

function generateHistogram() {
  return Array.from({ length: 24 }, (_, i) => ({
    hour: `${String(i).padStart(2, '0')}:00`,
    error: Math.floor(Math.random() * 15),
    warn: Math.floor(Math.random() * 30 + 5),
    info: Math.floor(Math.random() * 200 + 50),
    debug: Math.floor(Math.random() * 100 + 20),
  }));
}

export default function LogExplorer() {
  const [logs] = useState(generateLogs);
  const [histogram] = useState(generateHistogram);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('ALL');
  const [serviceFilter, setServiceFilter] = useState('ALL');
  const [expandedLog, setExpandedLog] = useState(null);
  const [sortDir, setSortDir] = useState('desc');

  const services = useMemo(() => [...new Set(logs.map(l => l.service))].sort(), [logs]);

  const filtered = useMemo(() => {
    let result = logs;
    if (levelFilter !== 'ALL') result = result.filter(l => l.level === levelFilter);
    if (serviceFilter !== 'ALL') result = result.filter(l => l.service === serviceFilter);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(l => l.message.toLowerCase().includes(q) || l.service.toLowerCase().includes(q) || l.hostname.toLowerCase().includes(q));
    }
    if (sortDir === 'asc') result = [...result].reverse();
    return result;
  }, [logs, levelFilter, serviceFilter, search, sortDir]);

  const levelCounts = useMemo(() => {
    const counts = { ERROR: 0, WARN: 0, INFO: 0, DEBUG: 0 };
    logs.forEach(l => counts[l.level]++);
    return counts;
  }, [logs]);

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
          <p className="text-sm text-text-muted mt-1">Search, filter, and analyze application logs across all services</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 rounded-lg bg-surface-light border border-border/30 text-xs text-text-muted hover:text-text transition-all flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          <button className="px-3 py-1.5 rounded-lg bg-surface-light border border-border/30 text-xs text-text-muted hover:text-text transition-all flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* Level summary cards */}
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
              <p className="text-xl font-bold text-text">{levelCounts[level]}</p>
            </button>
          );
        })}
      </div>

      {/* Histogram */}
      <Card>
        <h3 className="text-sm font-semibold text-text mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary-light" /> Log Volume (24h)
        </h3>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={histogram}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.06)" />
            <XAxis dataKey="hour" tick={{ fontSize: 9, fill: '#64748b' }} interval={2} />
            <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
            <Tooltip {...CHART_TOOLTIP} />
            <Bar dataKey="error" stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} />
            <Bar dataKey="warn" stackId="a" fill="#f59e0b" />
            <Bar dataKey="info" stackId="a" fill="#3b82f6" />
            <Bar dataKey="debug" stackId="a" fill="#8b5cf6" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Search & Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[300px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder='Search logs... (e.g. "timeout", "payment", hostname)'
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
          <option value="ALL">All Services</option>
          {services.map(s => <option key={s} value={s}>{s}</option>)}
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
        <div className="space-y-1 max-h-[600px] overflow-y-auto">
          {filtered.slice(0, 50).map(log => {
            const config = LOG_LEVELS[log.level];
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
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                          <div><span className="text-text-muted">Hostname:</span> <span className="text-text font-mono">{log.hostname}</span></div>
                          <div><span className="text-text-muted">Service:</span> <span className="text-text">{log.service}</span></div>
                          <div><span className="text-text-muted">Trace ID:</span> <span className="text-text font-mono">{log.traceId}</span></div>
                          <div><span className="text-text-muted">Level:</span> <span style={{ color: config.color }}>{log.level}</span></div>
                        </div>
                        <div className="mt-2 p-2 bg-surface/80 rounded-lg">
                          <p className="text-xs text-text font-mono whitespace-pre-wrap">{log.message}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
        {filtered.length > 50 && (
          <p className="text-center text-xs text-text-muted mt-4">Showing 50 of {filtered.length} entries. Use filters to narrow results.</p>
        )}
      </Card>
    </div>
  );
}
