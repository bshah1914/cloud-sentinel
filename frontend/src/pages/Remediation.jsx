import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, CheckCircle2, XCircle, Clock, Play, AlertTriangle,
  ChevronDown, ChevronRight, Terminal, User, Calendar, Filter,
  RefreshCw, Zap, Lock, ThumbsUp, ThumbsDown, Loader2
} from 'lucide-react';
import { getBase } from '../api';
import Card from '../components/Card';

const STATUS_CONFIG = {
  pending_approval: { label: 'Pending Approval', color: 'text-amber-400', bg: 'bg-amber-400/10', icon: Clock },
  approved: { label: 'Approved', color: 'text-blue-400', bg: 'bg-blue-400/10', icon: ThumbsUp },
  rejected: { label: 'Rejected', color: 'text-red-400', bg: 'bg-red-400/10', icon: ThumbsDown },
  in_progress: { label: 'In Progress', color: 'text-cyan-400', bg: 'bg-cyan-400/10', icon: Loader2 },
  completed: { label: 'Completed', color: 'text-emerald-400', bg: 'bg-emerald-400/10', icon: CheckCircle2 },
  failed: { label: 'Failed', color: 'text-red-400', bg: 'bg-red-400/10', icon: XCircle },
};

const SEVERITY_COLORS = {
  CRITICAL: 'text-red-400 bg-red-400/10',
  HIGH: 'text-orange-400 bg-orange-400/10',
  MEDIUM: 'text-amber-400 bg-amber-400/10',
  LOW: 'text-blue-400 bg-blue-400/10',
};

const RISK_COLORS = {
  high: 'text-red-400',
  medium: 'text-amber-400',
  low: 'text-emerald-400',
};

export default function Remediation() {
  const { token } = useOutletContext();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(null);

  const fetchTasks = async () => {
    try {
      const url = filter === 'all' ? '/api/v2/remediation-tasks' : `/api/v2/remediation-tasks?status=${filter}`;
      const res = await fetch(getBase() + url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch { setTasks([]); }
    setLoading(false);
  };

  useEffect(() => { fetchTasks(); }, [filter]);

  const handleApprove = async (taskId) => {
    setActionLoading(taskId);
    try {
      await fetch(getBase() + `/api/v2/remediation/${taskId}/approve`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      await fetchTasks();
    } catch {}
    setActionLoading(null);
  };

  const handleReject = async (taskId) => {
    setActionLoading(taskId);
    try {
      await fetch(getBase() + `/api/v2/remediation/${taskId}/reject`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason }),
      });
      setShowRejectModal(null);
      setRejectReason('');
      await fetchTasks();
    } catch {}
    setActionLoading(null);
  };

  const handleExecute = async (taskId) => {
    setActionLoading(taskId);
    try {
      await fetch(getBase() + `/api/v2/remediation/${taskId}/execute`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      await fetchTasks();
    } catch {}
    setActionLoading(null);
  };

  const pendingCount = tasks.filter(t => t.status === 'pending_approval').length;
  const approvedCount = tasks.filter(t => t.status === 'approved').length;
  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const rejectedCount = tasks.filter(t => t.status === 'rejected').length;

  const filters = [
    { key: 'all', label: 'All', count: tasks.length },
    { key: 'pending_approval', label: 'Pending', count: pendingCount },
    { key: 'approved', label: 'Approved', count: approvedCount },
    { key: 'completed', label: 'Completed', count: completedCount },
    { key: 'rejected', label: 'Rejected', count: rejectedCount },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20">
              <Shield className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text">Remediation Center</h1>
              <p className="text-sm text-text-muted">All remediation actions require owner approval</p>
            </div>
          </div>
        </div>
        <button onClick={fetchTasks} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-light hover:bg-surface-lighter text-text-muted text-sm transition-colors">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Pending Approval', count: pendingCount, color: 'amber', icon: Clock },
          { label: 'Approved', count: approvedCount, color: 'blue', icon: ThumbsUp },
          { label: 'Completed', count: completedCount, color: 'emerald', icon: CheckCircle2 },
          { label: 'Rejected', count: rejectedCount, color: 'red', icon: XCircle },
        ].map(s => (
          <Card key={s.label} hover={false}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wider">{s.label}</p>
                <p className={`text-2xl font-bold mt-1 text-${s.color}-400`}>{s.count}</p>
              </div>
              <div className={`p-2 rounded-lg bg-${s.color}-400/10`}>
                <s.icon className={`w-5 h-5 text-${s.color}-400`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {filters.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5
              ${filter === f.key ? 'bg-primary/20 text-primary-light' : 'bg-surface-light text-text-muted hover:bg-surface-lighter'}`}>
            {f.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${filter === f.key ? 'bg-primary/30' : 'bg-surface-lighter'}`}>
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {/* Task List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary-light animate-spin" />
        </div>
      ) : tasks.length === 0 ? (
        <Card hover={false}>
          <div className="text-center py-16">
            <Shield className="w-12 h-12 text-text-muted/30 mx-auto mb-3" />
            <p className="text-text-muted">No remediation tasks found</p>
            <p className="text-xs text-text-muted/60 mt-1">
              Remediation requests will appear here when users request fixes for security findings
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {tasks.map((task, i) => {
            const statusConf = STATUS_CONFIG[task.status] || STATUS_CONFIG.pending_approval;
            const StatusIcon = statusConf.icon;
            const isExpanded = expanded === task.id;
            const isLoading = actionLoading === task.id;

            return (
              <motion.div key={task.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}>
                <Card hover={false}>
                  {/* Main row */}
                  <div className="flex items-center gap-4 cursor-pointer" onClick={() => setExpanded(isExpanded ? null : task.id)}>
                    <div className={`p-2 rounded-lg ${statusConf.bg}`}>
                      <StatusIcon className={`w-5 h-5 ${statusConf.color} ${task.status === 'in_progress' ? 'animate-spin' : ''}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text truncate">{task.title}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-text-muted">
                        {task.finding?.severity && (
                          <span className={`px-1.5 py-0.5 rounded ${SEVERITY_COLORS[task.finding.severity] || ''}`}>
                            {task.finding.severity}
                          </span>
                        )}
                        {task.finding?.category && <span>{task.finding.category}</span>}
                        {task.finding?.region && <span>{task.finding.region}</span>}
                        {task.risk && (
                          <span className={`flex items-center gap-1 ${RISK_COLORS[task.risk] || ''}`}>
                            <AlertTriangle className="w-3 h-3" /> {task.risk} risk
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${statusConf.bg} ${statusConf.color}`}>
                        {statusConf.label}
                      </span>

                      {/* Action buttons — owner only */}
                      {task.status === 'pending_approval' && (
                        <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
                          <button onClick={() => handleApprove(task.id)} disabled={isLoading}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs font-medium transition-colors disabled:opacity-50">
                            {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <ThumbsUp className="w-3 h-3" />}
                            Approve
                          </button>
                          <button onClick={() => setShowRejectModal(task.id)} disabled={isLoading}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-medium transition-colors disabled:opacity-50">
                            <ThumbsDown className="w-3 h-3" /> Reject
                          </button>
                        </div>
                      )}

                      {task.status === 'approved' && (
                        <button onClick={(e) => { e.stopPropagation(); handleExecute(task.id); }} disabled={isLoading}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 text-xs font-medium transition-colors disabled:opacity-50">
                          {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                          Execute
                        </button>
                      )}

                      {isExpanded ? <ChevronDown className="w-4 h-4 text-text-muted" /> : <ChevronRight className="w-4 h-4 text-text-muted" />}
                    </div>
                  </div>

                  {/* Expanded details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="mt-4 pt-4 border-t border-border space-y-3">
                          {task.description && (
                            <div>
                              <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Remediation Steps</p>
                              <p className="text-sm text-text/80">{task.description}</p>
                            </div>
                          )}

                          {task.cli_command && (
                            <div>
                              <p className="text-xs text-text-muted uppercase tracking-wider mb-1 flex items-center gap-1">
                                <Terminal className="w-3 h-3" /> CLI Command
                              </p>
                              <div className="bg-surface/50 rounded-lg p-3 font-mono text-xs text-cyan-400 overflow-x-auto">
                                {task.cli_command}
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                            {task.requested_by && (
                              <div>
                                <p className="text-text-muted">Requested by</p>
                                <p className="text-text flex items-center gap-1 mt-0.5"><User className="w-3 h-3" /> {task.requested_by}</p>
                              </div>
                            )}
                            {task.approved_by && (
                              <div>
                                <p className="text-text-muted">Approved by</p>
                                <p className="text-emerald-400 flex items-center gap-1 mt-0.5"><ThumbsUp className="w-3 h-3" /> {task.approved_by}</p>
                              </div>
                            )}
                            {task.rejected_by && (
                              <div>
                                <p className="text-text-muted">Rejected by</p>
                                <p className="text-red-400 flex items-center gap-1 mt-0.5"><ThumbsDown className="w-3 h-3" /> {task.rejected_by}</p>
                              </div>
                            )}
                            {task.created_at && (
                              <div>
                                <p className="text-text-muted">Requested</p>
                                <p className="text-text flex items-center gap-1 mt-0.5"><Calendar className="w-3 h-3" /> {new Date(task.created_at).toLocaleString()}</p>
                              </div>
                            )}
                          </div>

                          {task.rejection_reason && (
                            <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3">
                              <p className="text-xs text-red-400 font-medium">Rejection Reason</p>
                              <p className="text-sm text-text/80 mt-1">{task.rejection_reason}</p>
                            </div>
                          )}

                          {task.result && (
                            <div className={`rounded-lg p-3 ${task.result.success ? 'bg-emerald-500/5 border border-emerald-500/20' : 'bg-red-500/5 border border-red-500/20'}`}>
                              <p className={`text-xs font-medium ${task.result.success ? 'text-emerald-400' : 'text-red-400'}`}>
                                {task.result.success ? 'Execution Result' : 'Error'}
                              </p>
                              <p className="text-sm text-text/80 mt-1">{task.result.message || task.result.error}</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Reject Modal */}
      <AnimatePresence>
        {showRejectModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowRejectModal(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              className="bg-surface-light border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <h3 className="text-lg font-bold text-text flex items-center gap-2">
                <ThumbsDown className="w-5 h-5 text-red-400" /> Reject Remediation
              </h3>
              <p className="text-sm text-text-muted mt-2">Provide a reason for rejecting this remediation request.</p>
              <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                placeholder="Reason for rejection..."
                className="w-full mt-4 p-3 rounded-lg bg-surface border border-border text-text text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <div className="flex gap-3 mt-4 justify-end">
                <button onClick={() => { setShowRejectModal(null); setRejectReason(''); }}
                  className="px-4 py-2 rounded-lg bg-surface hover:bg-surface-lighter text-text-muted text-sm transition-colors">
                  Cancel
                </button>
                <button onClick={() => handleReject(showRejectModal)}
                  className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 text-sm font-medium transition-colors">
                  Reject
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info banner */}
      <Card hover={false}>
        <div className="flex items-start gap-3">
          <Lock className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-text">Owner Approval Required</p>
            <p className="text-xs text-text-muted mt-1">
              All remediation actions — whether auto or manual — require explicit owner approval before execution.
              This ensures no changes are made to your cloud infrastructure without authorization.
              The flow is: <span className="text-text">Request → Owner Review → Approve/Reject → Execute</span>
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
