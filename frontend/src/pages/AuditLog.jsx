import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileText, User, Clock, Shield, Server, ScanLine, Download,
  LogIn, LogOut, AlertTriangle, Settings, Eye, Filter, Search
} from 'lucide-react';
import { api } from '../api';
import Loader from '../components/Loader';

const ACTION_ICONS = {
  'login': LogIn, 'logout': LogOut, 'scan.started': ScanLine,
  'scan.completed': Shield, 'account.created': Server,
  'export': Download, 'remediation.executed': AlertTriangle,
  'schedule.created': Clock, 'settings.updated': Settings,
};
const ACTION_COLORS = {
  'login': 'text-emerald-400 bg-emerald-500/10', 'scan.started': 'text-cyan-400 bg-cyan-500/10',
  'scan.completed': 'text-violet-400 bg-violet-500/10', 'account.created': 'text-blue-400 bg-blue-500/10',
  'export': 'text-amber-400 bg-amber-500/10', 'remediation.executed': 'text-red-400 bg-red-500/10',
};

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const params = filter ? `?action=${filter}&limit=200` : '?limit=200';
    api.get(`/api/v2/audit-logs${params}`)
      .then(r => { setLogs(r.data.logs || []); setTotal(r.data.total || 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter]);

  if (loading) return <Loader text="Loading audit logs..." />;

  const filtered = search
    ? logs.filter(l => l.action?.includes(search) || l.username?.includes(search) || JSON.stringify(l.details).includes(search))
    : logs;

  const actions = [...new Set(logs.map(l => l.action))].sort();

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <FileText className="w-5 h-5 text-text" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text">Audit Log</h1>
            <p className="text-text-muted/70 text-xs">{total} events tracked</p>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted/70" />
          <input type="text" placeholder="Search logs..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface-light/80 border border-border/30 rounded-xl text-sm text-text placeholder-slate-500 focus:border-violet-500/30 focus:outline-none" />
        </div>
        <div className="flex items-center gap-1 bg-white/[0.03] p-1 rounded-xl border border-border/30">
          <button onClick={() => setFilter('')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all ${!filter ? 'bg-violet-600 text-text' : 'text-text-muted hover:text-text'}`}>
            All
          </button>
          {actions.slice(0, 6).map(a => (
            <button key={a} onClick={() => setFilter(a)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all ${filter === a ? 'bg-violet-600 text-text' : 'text-text-muted hover:text-text'}`}>
              {a.replace('.', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Log entries */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-text-muted/70">
            <Eye className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No audit log entries yet</p>
            <p className="text-xs mt-1">Actions like logins, scans, and exports will appear here</p>
          </div>
        ) : filtered.map((log, i) => {
          const Icon = ACTION_ICONS[log.action] || FileText;
          const color = ACTION_COLORS[log.action] || 'text-text-muted bg-slate-500/10';
          return (
            <motion.div key={log.id || i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.02 }}
              className="bg-surface-light/80 backdrop-blur-xl border border-border/30 rounded-xl p-4 hover:border-border/60 transition-all flex items-center gap-4">
              <div className={`w-9 h-9 rounded-lg ${color.split(' ')[1]} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-4.5 h-4.5 ${color.split(' ')[0]}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text font-medium">{log.action?.replace('.', ' → ')}</p>
                <div className="flex items-center gap-3 mt-1 text-[10px] text-text-muted/70">
                  {log.username && <span className="flex items-center gap-1"><User className="w-3 h-3" />{log.username}</span>}
                  {log.resource_type && <span>{log.resource_type}: {log.resource_id?.slice(0, 12)}</span>}
                  {log.ip_address && <span>{log.ip_address}</span>}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-[10px] text-text-muted/70">{log.created_at ? new Date(log.created_at).toLocaleString() : ''}</p>
              </div>
              {log.details && Object.keys(log.details).length > 0 && (
                <div className="text-[10px] text-slate-600 bg-surface/30 rounded-lg px-2 py-1 max-w-[200px] truncate">
                  {JSON.stringify(log.details)}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
