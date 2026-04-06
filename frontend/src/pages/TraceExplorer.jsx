import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Clock, ChevronRight, AlertTriangle, CheckCircle2, XCircle,
  GitBranch, Layers, Activity, Zap, ArrowRight, Filter
} from 'lucide-react';
import Card from '../components/Card';

const SERVICES = [
  { id: 'api-gateway', color: '#6366f1' },
  { id: 'auth-service', color: '#06b6d4' },
  { id: 'user-service', color: '#10b981' },
  { id: 'payment-service', color: '#f59e0b' },
  { id: 'notification-svc', color: '#ec4899' },
  { id: 'database', color: '#8b5cf6' },
  { id: 'cache', color: '#ef4444' },
  { id: 'external-api', color: '#64748b' },
];

const SERVICE_MAP_EDGES = [
  { from: 'api-gateway', to: 'auth-service' },
  { from: 'api-gateway', to: 'user-service' },
  { from: 'api-gateway', to: 'payment-service' },
  { from: 'user-service', to: 'database' },
  { from: 'user-service', to: 'cache' },
  { from: 'payment-service', to: 'external-api' },
  { from: 'payment-service', to: 'database' },
  { from: 'auth-service', to: 'cache' },
  { from: 'auth-service', to: 'database' },
  { from: 'payment-service', to: 'notification-svc' },
];

function generateTraces(count = 30) {
  const endpoints = [
    'POST /api/v1/auth/login', 'GET /api/v1/users/profile', 'POST /api/v1/payments/process',
    'GET /api/v1/users/list', 'PUT /api/v1/users/update', 'POST /api/v1/notifications/send',
    'GET /api/v1/health', 'DELETE /api/v1/sessions/revoke', 'POST /api/v1/webhooks/stripe',
    'GET /api/v1/dashboard/metrics',
  ];
  const statuses = ['ok', 'ok', 'ok', 'ok', 'error', 'ok', 'ok', 'slow'];
  const now = Date.now();

  return Array.from({ length: count }, (_, i) => {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const spanCount = Math.floor(Math.random() * 8) + 3;
    const baseDuration = status === 'error' ? Math.random() * 500 + 100 : status === 'slow' ? Math.random() * 3000 + 1500 : Math.random() * 400 + 20;
    const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];

    const spans = [];
    let cursor = 0;
    const totalDuration = baseDuration;

    for (let s = 0; s < spanCount; s++) {
      const svc = SERVICES[Math.floor(Math.random() * SERVICES.length)];
      const spanDur = Math.random() * (totalDuration / spanCount) * 2;
      const spanStart = cursor;
      cursor += spanDur * 0.7;
      spans.push({
        id: `span-${i}-${s}`,
        service: svc.id,
        color: svc.color,
        operation: s === 0 ? endpoint : ['db.query', 'cache.get', 'http.request', 'auth.validate', 'serialize', 'queue.publish'][Math.floor(Math.random() * 6)],
        duration: Math.round(spanDur * 100) / 100,
        startOffset: Math.round(spanStart * 100) / 100,
        status: s === 0 && status === 'error' ? 'error' : Math.random() > 0.92 ? 'error' : 'ok',
      });
    }

    return {
      id: `trace-${Math.random().toString(36).slice(2, 14)}`,
      timestamp: new Date(now - i * (Math.random() * 60000 + 10000)).toISOString(),
      endpoint,
      duration: Math.round(baseDuration * 100) / 100,
      spans,
      spanCount,
      status,
      rootService: 'api-gateway',
    };
  });
}

function ServiceMap() {
  const positions = {
    'api-gateway': { x: 300, y: 40 },
    'auth-service': { x: 100, y: 140 },
    'user-service': { x: 300, y: 140 },
    'payment-service': { x: 500, y: 140 },
    'database': { x: 200, y: 250 },
    'cache': { x: 100, y: 250 },
    'notification-svc': { x: 500, y: 250 },
    'external-api': { x: 400, y: 250 },
  };

  return (
    <svg viewBox="0 0 620 300" className="w-full h-auto">
      {SERVICE_MAP_EDGES.map((edge, i) => {
        const from = positions[edge.from];
        const to = positions[edge.to];
        if (!from || !to) return null;
        return (
          <motion.line
            key={i}
            x1={from.x} y1={from.y + 16} x2={to.x} y2={to.y - 16}
            stroke="rgba(99,102,241,0.2)" strokeWidth="1.5" strokeDasharray="4 4"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: i * 0.05 }}
          />
        );
      })}
      {SERVICES.map(svc => {
        const pos = positions[svc.id];
        if (!pos) return null;
        return (
          <g key={svc.id}>
            <motion.rect
              x={pos.x - 55} y={pos.y - 16} width="110" height="32" rx="8"
              fill={`${svc.color}15`} stroke={`${svc.color}40`} strokeWidth="1"
              initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1 }}
            />
            <text x={pos.x} y={pos.y + 1} textAnchor="middle" dominantBaseline="middle"
              fill={svc.color} fontSize="10" fontWeight="600" fontFamily="monospace">
              {svc.id.replace('-', '\u2011')}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function SpanTimeline({ spans, totalDuration }) {
  return (
    <div className="space-y-1.5 mt-3">
      {spans.map(span => {
        const leftPct = (span.startOffset / totalDuration) * 100;
        const widthPct = Math.max((span.duration / totalDuration) * 100, 2);
        return (
          <div key={span.id} className="flex items-center gap-2 group">
            <span className="text-[10px] text-text-muted font-mono w-28 truncate flex-shrink-0">{span.service}</span>
            <div className="flex-1 relative h-5 bg-border/10 rounded">
              <motion.div
                className="absolute top-0 h-full rounded flex items-center px-1.5"
                style={{ left: `${leftPct}%`, width: `${widthPct}%`, background: `${span.color}30`, borderLeft: `2px solid ${span.color}` }}
                initial={{ scaleX: 0, originX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.3 }}
              >
                <span className="text-[9px] text-text truncate">{span.operation}</span>
              </motion.div>
            </div>
            <span className={`text-[10px] font-mono w-16 text-right flex-shrink-0 ${span.status === 'error' ? 'text-red-400' : 'text-text-muted'}`}>
              {span.duration.toFixed(1)}ms
            </span>
            {span.status === 'error' && <XCircle className="w-3 h-3 text-red-400 flex-shrink-0" />}
          </div>
        );
      })}
    </div>
  );
}

const STATUS_CONFIG = {
  ok: { color: '#10b981', icon: CheckCircle2, label: 'OK' },
  error: { color: '#ef4444', icon: XCircle, label: 'Error' },
  slow: { color: '#f59e0b', icon: AlertTriangle, label: 'Slow' },
};

export default function TraceExplorer() {
  const [traces] = useState(generateTraces);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [expandedTrace, setExpandedTrace] = useState(null);
  const [tab, setTab] = useState('traces');

  const filtered = useMemo(() => {
    let result = traces;
    if (statusFilter !== 'ALL') result = result.filter(t => t.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(t => t.endpoint.toLowerCase().includes(q) || t.id.includes(q));
    }
    return result;
  }, [traces, statusFilter, search]);

  const stats = useMemo(() => {
    const ok = traces.filter(t => t.status === 'ok').length;
    const err = traces.filter(t => t.status === 'error').length;
    const slow = traces.filter(t => t.status === 'slow').length;
    const avgDuration = traces.reduce((a, t) => a + t.duration, 0) / traces.length;
    const p99 = [...traces].sort((a, b) => b.duration - a.duration)[Math.floor(traces.length * 0.01)]?.duration || 0;
    return { ok, err, slow, avgDuration, p99 };
  }, [traces]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
            <GitBranch className="w-5 h-5 text-violet-400" />
          </div>
          Distributed Tracing
        </h1>
        <p className="text-sm text-text-muted mt-1">Trace requests across microservices with span-level latency analysis</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total Traces', value: traces.length, color: '#6366f1', icon: Layers },
          { label: 'Successful', value: stats.ok, color: '#10b981', icon: CheckCircle2 },
          { label: 'Errors', value: stats.err, color: '#ef4444', icon: XCircle },
          { label: 'Avg Latency', value: `${stats.avgDuration.toFixed(0)}ms`, color: '#06b6d4', icon: Clock },
          { label: 'P99 Latency', value: `${stats.p99.toFixed(0)}ms`, color: '#f59e0b', icon: Zap },
        ].map(s => (
          <div key={s.label} className="bg-surface-light/60 border border-border/30 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <s.icon className="w-3.5 h-3.5" style={{ color: s.color }} />
              <span className="text-[10px] text-text-muted uppercase tracking-wide">{s.label}</span>
            </div>
            <p className="text-xl font-bold text-text">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-light/40 p-1 rounded-xl w-fit border border-border/20">
        {[{ id: 'traces', label: 'Traces', icon: Activity }, { id: 'service-map', label: 'Service Map', icon: GitBranch }].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all ${tab === t.id ? 'bg-primary/15 text-primary-light' : 'text-text-muted hover:text-text'}`}
          >
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'service-map' ? (
        <Card>
          <h3 className="text-sm font-semibold text-text mb-4">Service Dependency Map</h3>
          <ServiceMap />
          <div className="flex flex-wrap gap-3 mt-4 justify-center">
            {SERVICES.map(s => (
              <div key={s.id} className="flex items-center gap-1.5 text-xs text-text-muted">
                <span className="w-2.5 h-2.5 rounded" style={{ background: s.color }} />
                {s.id}
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <>
          {/* Search & Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[250px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search by endpoint or trace ID..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-surface-light border border-border/30 rounded-xl text-sm text-text placeholder:text-text-muted/50 focus:outline-none focus:border-primary/40"
              />
            </div>
            <div className="flex gap-1.5">
              {['ALL', 'ok', 'error', 'slow'].map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${statusFilter === s ? 'bg-primary/15 text-primary-light border border-primary/20' : 'bg-surface-light border border-border/30 text-text-muted hover:text-text'}`}
                >
                  {s === 'ALL' ? 'All' : STATUS_CONFIG[s]?.label}
                </button>
              ))}
            </div>
          </div>

          {/* Trace List */}
          <div className="space-y-2">
            {filtered.map(trace => {
              const config = STATUS_CONFIG[trace.status];
              const Icon = config.icon;
              const expanded = expandedTrace === trace.id;
              return (
                <motion.div key={trace.id} layout>
                  <Card className="!p-0 overflow-hidden">
                    <button
                      onClick={() => setExpandedTrace(expanded ? null : trace.id)}
                      className="w-full flex items-center gap-3 p-3 text-left hover:bg-white/[0.02] transition-all"
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" style={{ color: config.color }} />
                      <span className="text-xs font-mono text-text-muted w-[140px] flex-shrink-0">
                        {new Date(trace.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                      <span className="text-sm font-medium text-text flex-1 truncate">{trace.endpoint}</span>
                      <span className="text-xs text-text-muted">{trace.spanCount} spans</span>
                      <span className={`text-xs font-mono font-medium ${trace.duration > 1000 ? 'text-red-400' : trace.duration > 300 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {trace.duration.toFixed(1)}ms
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: `${config.color}15`, color: config.color }}>
                        {config.label}
                      </span>
                      <ChevronRight className={`w-4 h-4 text-text-muted transition-transform ${expanded ? 'rotate-90' : ''}`} />
                    </button>
                    <AnimatePresence>
                      {expanded && (
                        <motion.div
                          initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 border-t border-border/10">
                            <div className="flex gap-4 mt-3 mb-2 text-xs text-text-muted">
                              <span>Trace: <span className="font-mono text-text">{trace.id}</span></span>
                              <span>Root: <span className="text-text">{trace.rootService}</span></span>
                              <span>Duration: <span className="text-text">{trace.duration.toFixed(1)}ms</span></span>
                            </div>
                            <SpanTimeline spans={trace.spans} totalDuration={trace.duration} />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
