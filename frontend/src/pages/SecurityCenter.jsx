import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import {
  Shield, ShieldCheck, ShieldAlert, Lock, Key, Eye, EyeOff,
  Globe, Fingerprint, AlertTriangle, CheckCircle2, XCircle,
  RefreshCw, Copy, Plus, Trash2, Clock, FileText, Activity,
  Server, Ban, UserCheck, KeyRound, Hash, Wifi, Wrench, Play, Loader2
} from 'lucide-react';
import Card from '../components/Card';

const CHART_TOOLTIP = {
  contentStyle: { background: '#1a2332', border: '1px solid rgba(99,102,241,0.12)', borderRadius: '12px', color: '#eef2ff', fontSize: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' },
};

function generateSecurityEvents() {
  return [
    { id: 'se-1', type: 'brute_force', severity: 'critical', source: '203.0.113.42', target: '/api/auth/login', count: 156, timestamp: '2026-04-07T11:25:00Z', status: 'blocked', detail: '156 failed login attempts in 5 minutes from single IP' },
    { id: 'se-2', type: 'xss_attempt', severity: 'critical', source: '198.51.100.15', target: '/api/v2/users/update', count: 3, timestamp: '2026-04-07T11:10:00Z', status: 'blocked', detail: 'XSS payload detected in request body: <script>...' },
    { id: 'se-3', type: 'sql_injection', severity: 'critical', source: '192.0.2.100', target: '/api/v1/search', count: 8, timestamp: '2026-04-07T10:45:00Z', status: 'blocked', detail: 'SQL injection attempt: UNION SELECT in query parameter' },
    { id: 'se-4', type: 'rate_limited', severity: 'warning', source: '10.0.1.55', target: '/api/v1/scan/start', count: 52, timestamp: '2026-04-07T10:30:00Z', status: 'throttled', detail: 'Rate limit exceeded: 52 requests/minute (limit: 30)' },
    { id: 'se-5', type: 'invalid_token', severity: 'warning', source: '172.16.0.88', target: '/api/v1/audit', count: 12, timestamp: '2026-04-07T10:15:00Z', status: 'rejected', detail: 'Expired JWT token used 12 times — possible token replay' },
    { id: 'se-6', type: 'cors_violation', severity: 'info', source: 'evil-site.com', target: '/api/v1/export', count: 5, timestamp: '2026-04-07T09:50:00Z', status: 'blocked', detail: 'CORS policy violation from unauthorized origin' },
    { id: 'se-7', type: 'privilege_escalation', severity: 'critical', source: '10.0.2.30', target: '/api/admin/users', count: 1, timestamp: '2026-04-07T09:30:00Z', status: 'blocked', detail: 'Client-role user attempted admin endpoint access' },
    { id: 'se-8', type: 'suspicious_scan', severity: 'warning', source: '45.33.32.156', target: 'multiple', count: 340, timestamp: '2026-04-07T08:00:00Z', status: 'blocked', detail: 'Port scan / path enumeration from known scanner IP (Shodan)' },
  ];
}

function generateApiKeys() {
  return [
    { id: 'key-1', name: 'Production CI/CD', prefix: 'cs_prod_****7x9k', created: '2026-03-15', lastUsed: '2026-04-07T10:30:00Z', permissions: ['read', 'scan'], status: 'active' },
    { id: 'key-2', name: 'Monitoring Integration', prefix: 'cs_mon_****3f2m', created: '2026-03-20', lastUsed: '2026-04-07T11:00:00Z', permissions: ['read'], status: 'active' },
    { id: 'key-3', name: 'Development Testing', prefix: 'cs_dev_****8p1w', created: '2026-02-10', lastUsed: '2026-03-28T14:00:00Z', permissions: ['read', 'write', 'scan'], status: 'active' },
    { id: 'key-4', name: 'Old Integration', prefix: 'cs_old_****2n5r', created: '2025-12-01', lastUsed: '2026-01-15T08:00:00Z', permissions: ['read'], status: 'revoked' },
  ];
}

function generateSecurityScore() {
  return [
    { category: 'Authentication', score: 92, findings: 1, items: ['JWT with 8h expiry', 'bcrypt password hashing', 'OAuth2 bearer scheme', 'Missing: MFA enforcement'] },
    { category: 'Authorization', score: 88, findings: 2, items: ['RBAC (owner/admin/viewer)', 'Route-level access control', 'Missing: Resource-level ACL', 'Missing: API scope limiting'] },
    { category: 'Input Validation', score: 95, findings: 0, items: ['Pydantic schema validation', 'SQL parameterized queries', 'XSS sanitization active', 'File upload validation'] },
    { category: 'Transport Security', score: 90, findings: 1, items: ['HTTPS enforced', 'TLS 1.2+ required', 'HSTS headers set', 'Missing: Certificate pinning'] },
    { category: 'Rate Limiting', score: 85, findings: 1, items: ['Per-IP rate limiting', 'Per-user rate limiting', 'Sliding window algorithm', 'Missing: DDoS mitigation'] },
    { category: 'Data Protection', score: 87, findings: 2, items: ['Credentials encrypted at rest', 'Audit logging enabled', 'Missing: Field-level encryption', 'Missing: Data masking in logs'] },
    { category: 'Security Headers', score: 96, findings: 0, items: ['CSP header configured', 'X-Frame-Options: DENY', 'X-Content-Type-Options', 'Referrer-Policy: strict'] },
    { category: 'Session Management', score: 82, findings: 2, items: ['Token-based sessions', 'Missing: Refresh token rotation', 'Missing: Concurrent session limit', 'Token blacklisting active'] },
  ];
}

const SEVERITY_COLORS = { critical: '#ef4444', warning: '#f59e0b', info: '#3b82f6' };
const STATUS_COLORS = { blocked: '#ef4444', throttled: '#f59e0b', rejected: '#f59e0b' };
const TYPE_ICONS = {
  brute_force: Ban, xss_attempt: AlertTriangle, sql_injection: AlertTriangle,
  rate_limited: Clock, invalid_token: Key, cors_violation: Globe,
  privilege_escalation: ShieldAlert, suspicious_scan: Eye,
};

export default function SecurityCenter() {
  const [events] = useState(generateSecurityEvents);
  const [apiKeys, setApiKeys] = useState(generateApiKeys);
  const [securityScore] = useState(generateSecurityScore);
  const [tab, setTab] = useState('overview');
  const [remediations, setRemediations] = useState([
    { id: 'rem-1', title: 'Restrict CORS to known domains', category: 'Transport Security', severity: 'warning', status: 'pending', description: 'CORS currently allows all origins (*). Restrict to production domains only.', fix: 'Update CORS middleware allow_origins to ["https://sentrix.cloudtrio.in"]', effort: 'Low', impact: 'High' },
    { id: 'rem-2', title: 'Enforce MFA for admin accounts', category: 'Authentication', severity: 'warning', status: 'pending', description: 'Multi-factor authentication is available but not enforced for admin users.', fix: 'Add MFA enforcement check in login flow for role=admin', effort: 'Medium', impact: 'High' },
    { id: 'rem-3', title: 'Implement API key rotation policy', category: 'Authorization', severity: 'info', status: 'pending', description: 'No automated key rotation. Keys should expire after 90 days.', fix: 'Add expiry field to API keys and background job to revoke expired keys', effort: 'Medium', impact: 'Medium' },
    { id: 'rem-4', title: 'Add concurrent session limit', category: 'Session Management', severity: 'critical', status: 'pending', description: 'No limit on concurrent sessions per user. Attacker could maintain persistent access.', fix: 'Track active sessions per user and invalidate oldest when limit exceeded', effort: 'Medium', impact: 'Critical' },
    { id: 'rem-5', title: 'Enable dependency vulnerability scanning', category: 'Data Protection', severity: 'warning', status: 'pending', description: 'No automated CVE scanning on Python/npm packages.', fix: 'Add pip-audit and npm audit to CI pipeline', effort: 'Low', impact: 'High' },
    { id: 'rem-6', title: 'Add field-level encryption for credentials', category: 'Data Protection', severity: 'warning', status: 'pending', description: 'Cloud credentials stored with basic encryption. Upgrade to AES-256-GCM.', fix: 'Implement envelope encryption with rotating master key', effort: 'High', impact: 'Critical' },
    { id: 'rem-7', title: 'Implement refresh token rotation', category: 'Session Management', severity: 'warning', status: 'pending', description: 'JWT tokens are not rotated. Stolen tokens remain valid until expiry.', fix: 'Add refresh token endpoint with token rotation on each refresh', effort: 'Medium', impact: 'High' },
    { id: 'rem-8', title: 'Add data masking in audit logs', category: 'Data Protection', severity: 'info', status: 'pending', description: 'Sensitive data like emails and IPs may appear unmasked in logs.', fix: 'Apply PII masking filter to audit and access log middleware', effort: 'Low', impact: 'Medium' },
  ]);

  const overallScore = Math.round(securityScore.reduce((a, s) => a + s.score, 0) / securityScore.length);
  const totalFindings = securityScore.reduce((a, s) => a + s.findings, 0);
  const criticalEvents = events.filter(e => e.severity === 'critical').length;
  const blockedThreats = events.filter(e => e.status === 'blocked').length;

  const scoreColor = overallScore >= 90 ? '#10b981' : overallScore >= 70 ? '#f59e0b' : '#ef4444';

  const threatTimeline = Array.from({ length: 24 }, (_, i) => ({
    hour: `${String(i).padStart(2, '0')}:00`,
    blocked: Math.floor(Math.random() * 20 + 5),
    warning: Math.floor(Math.random() * 10),
    allowed: Math.floor(Math.random() * 200 + 50),
  }));

  const pieData = [
    { name: 'Secure', value: overallScore, color: scoreColor },
    { name: 'Gaps', value: 100 - overallScore, color: '#1e293b' },
  ];

  const handleRevokeKey = (id) => {
    setApiKeys(prev => prev.map(k => k.id === id ? { ...k, status: 'revoked' } : k));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          Security Center
        </h1>
        <p className="text-sm text-text-muted mt-1">Platform security posture, threat detection, API key management, and hardening status</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface-light/60 border border-border/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1"><Shield className="w-4 h-4" style={{ color: scoreColor }} /><span className="text-xs text-text-muted">Security Score</span></div>
          <p className="text-2xl font-bold" style={{ color: scoreColor }}>{overallScore}/100</p>
        </div>
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1"><AlertTriangle className="w-4 h-4 text-red-400" /><span className="text-xs text-red-400">Critical Events</span></div>
          <p className="text-2xl font-bold text-red-400">{criticalEvents}</p>
        </div>
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1"><Ban className="w-4 h-4 text-emerald-400" /><span className="text-xs text-emerald-400">Threats Blocked</span></div>
          <p className="text-2xl font-bold text-emerald-400">{blockedThreats}</p>
        </div>
        <div className="bg-surface-light/60 border border-border/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1"><Key className="w-4 h-4 text-cyan-400" /><span className="text-xs text-text-muted">Active API Keys</span></div>
          <p className="text-2xl font-bold text-text">{apiKeys.filter(k => k.status === 'active').length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-light/40 p-1 rounded-xl w-fit border border-border/20">
        {[
          { id: 'overview', label: 'Security Posture', icon: Shield },
          { id: 'events', label: 'Threat Events', icon: AlertTriangle },
          { id: 'api-keys', label: 'API Keys', icon: Key },
          { id: 'remediation', label: 'Remediation', icon: Wrench },
          { id: 'hardening', label: 'Hardening Checklist', icon: CheckCircle2 },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all ${tab === t.id ? 'bg-primary/15 text-primary-light' : 'text-text-muted hover:text-text'}`}
          >
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <h3 className="text-sm font-semibold text-text mb-4">Overall Security Score</h3>
            <div className="flex justify-center">
              <div className="relative w-40 h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={70} startAngle={90} endAngle={-270} dataKey="value" paddingAngle={0}>
                      {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold" style={{ color: scoreColor }}>{overallScore}</span>
                  <span className="text-[10px] text-text-muted">out of 100</span>
                </div>
              </div>
            </div>
            <p className="text-center text-xs text-text-muted mt-2">{totalFindings} findings to address</p>
          </Card>

          <div className="lg:col-span-2">
            <Card>
              <h3 className="text-sm font-semibold text-text mb-4">Category Breakdown</h3>
              <div className="space-y-3">
                {securityScore.map(cat => {
                  const catColor = cat.score >= 90 ? '#10b981' : cat.score >= 70 ? '#f59e0b' : '#ef4444';
                  return (
                    <div key={cat.category}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-text">{cat.category}</span>
                        <div className="flex items-center gap-2">
                          {cat.findings > 0 && <span className="text-[10px] text-amber-400">{cat.findings} finding{cat.findings > 1 ? 's' : ''}</span>}
                          <span className="text-xs font-bold" style={{ color: catColor }}>{cat.score}%</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-border/20 rounded-full overflow-hidden">
                        <motion.div className="h-full rounded-full" style={{ background: catColor }} initial={{ width: 0 }} animate={{ width: `${cat.score}%` }} transition={{ duration: 0.8 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          <div className="lg:col-span-3">
            <Card>
              <h3 className="text-sm font-semibold text-text mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary-light" /> Threat Activity (24h)
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={threatTimeline}>
                  <defs>
                    <linearGradient id="blockedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.06)" />
                  <XAxis dataKey="hour" tick={{ fontSize: 9, fill: '#64748b' }} interval={3} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip {...CHART_TOOLTIP} />
                  <Area type="monotone" dataKey="blocked" stroke="#ef4444" fill="url(#blockedGrad)" strokeWidth={2} name="Blocked" />
                  <Area type="monotone" dataKey="warning" stroke="#f59e0b" fill="none" strokeWidth={1.5} strokeDasharray="3 3" name="Warnings" />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </div>
      )}

      {/* Events Tab */}
      {tab === 'events' && (
        <div className="space-y-2">
          {events.map((evt, i) => {
            const EvtIcon = TYPE_ICONS[evt.type] || AlertTriangle;
            return (
              <motion.div key={evt.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                <Card className="!p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${SEVERITY_COLORS[evt.severity]}15` }}>
                      <EvtIcon className="w-4 h-4" style={{ color: SEVERITY_COLORS[evt.severity] }} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-semibold text-text capitalize">{evt.type.replace(/_/g, ' ')}</h4>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: `${SEVERITY_COLORS[evt.severity]}15`, color: SEVERITY_COLORS[evt.severity] }}>{evt.severity}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: `${STATUS_COLORS[evt.status] || '#3b82f6'}15`, color: STATUS_COLORS[evt.status] || '#3b82f6' }}>{evt.status}</span>
                      </div>
                      <p className="text-xs text-text-muted">{evt.detail}</p>
                      <div className="flex gap-4 mt-1.5 text-[10px] text-text-muted">
                        <span>Source: <span className="font-mono text-text">{evt.source}</span></span>
                        <span>Target: <span className="font-mono text-text">{evt.target}</span></span>
                        <span>Count: <span className="text-text font-medium">{evt.count}</span></span>
                        <span>{new Date(evt.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* API Keys Tab */}
      {tab === 'api-keys' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button className="flex items-center gap-2 px-4 py-2 bg-primary/15 text-primary-light rounded-xl text-sm font-medium border border-primary/20 hover:bg-primary/25 transition-all">
              <Plus className="w-4 h-4" /> Generate New Key
            </button>
          </div>
          {apiKeys.map((key, i) => (
            <motion.div key={key.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className={`!p-4 ${key.status === 'revoked' ? 'opacity-50' : ''}`}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <KeyRound className="w-5 h-5 text-primary-light" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-text">{key.name}</h4>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${key.status === 'active' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                        {key.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-text-muted">
                      <span className="font-mono">{key.prefix}</span>
                      <span>Created: {key.created}</span>
                      {key.lastUsed && <span>Last used: {new Date(key.lastUsed).toLocaleDateString()}</span>}
                    </div>
                    <div className="flex gap-1.5 mt-1.5">
                      {key.permissions.map(p => (
                        <span key={p} className="text-[10px] px-1.5 py-0.5 bg-surface/80 border border-border/20 rounded text-text-muted">{p}</span>
                      ))}
                    </div>
                  </div>
                  {key.status === 'active' && (
                    <div className="flex gap-2">
                      <button className="p-2 rounded-lg text-text-muted hover:text-text hover:bg-white/[0.05] transition-all" title="Copy key">
                        <Copy className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleRevokeKey(key.id)} className="p-2 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-all" title="Revoke key">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Remediation Tab */}
      {tab === 'remediation' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-text-muted">{remediations.filter(r => r.status === 'completed').length}/{remediations.length} fixes applied</p>
            <div className="flex gap-2">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400">{remediations.filter(r => r.severity === 'critical').length} Critical</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400">{remediations.filter(r => r.severity === 'warning').length} Warning</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400">{remediations.filter(r => r.severity === 'info').length} Info</span>
            </div>
          </div>
          {remediations.map((rem, i) => {
            const sevColor = rem.severity === 'critical' ? '#ef4444' : rem.severity === 'warning' ? '#f59e0b' : '#3b82f6';
            const isRunning = rem.status === 'running';
            const isDone = rem.status === 'completed';
            return (
              <motion.div key={rem.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Card className={`!p-4 border-l-2 ${isDone ? 'opacity-60' : ''}`} style={{ borderLeftColor: isDone ? '#10b981' : sevColor }}>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: isDone ? '#10b98115' : `${sevColor}15` }}>
                      {isDone ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : isRunning ? <Loader2 className="w-4 h-4 animate-spin" style={{ color: sevColor }} /> : <Wrench className="w-4 h-4" style={{ color: sevColor }} />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-semibold text-text">{rem.title}</h4>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: `${sevColor}15`, color: sevColor }}>{rem.severity}</span>
                        <span className="text-[10px] text-text-muted">{rem.category}</span>
                      </div>
                      <p className="text-xs text-text-muted mb-2">{rem.description}</p>
                      <div className="bg-surface/50 border border-border/20 rounded-lg p-2.5 mb-2">
                        <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1">Recommended Fix</p>
                        <p className="text-xs text-text font-mono">{rem.fix}</p>
                      </div>
                      <div className="flex gap-4 text-[10px] text-text-muted">
                        <span>Effort: <span className={`font-medium ${rem.effort === 'Low' ? 'text-emerald-400' : rem.effort === 'Medium' ? 'text-amber-400' : 'text-red-400'}`}>{rem.effort}</span></span>
                        <span>Impact: <span className={`font-medium ${rem.impact === 'Critical' ? 'text-red-400' : rem.impact === 'High' ? 'text-amber-400' : 'text-blue-400'}`}>{rem.impact}</span></span>
                      </div>
                    </div>
                    {!isDone && (
                      <button
                        onClick={() => {
                          setRemediations(prev => prev.map(r => r.id === rem.id ? { ...r, status: 'running' } : r));
                          setTimeout(() => {
                            setRemediations(prev => prev.map(r => r.id === rem.id ? { ...r, status: 'completed' } : r));
                          }, 2000);
                        }}
                        disabled={isRunning}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/15 text-primary-light rounded-lg text-xs font-medium border border-primary/20 hover:bg-primary/25 transition-all disabled:opacity-50"
                      >
                        {isRunning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                        {isRunning ? 'Applying...' : 'Apply Fix'}
                      </button>
                    )}
                    {isDone && (
                      <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-400 font-medium">Applied</span>
                    )}
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Hardening Checklist Tab */}
      {tab === 'hardening' && (
        <div className="space-y-3">
          {[
            { label: 'HTTPS Enforcement', status: 'pass', detail: 'All traffic redirected to HTTPS via nginx' },
            { label: 'Security Headers (CSP, HSTS, X-Frame-Options)', status: 'pass', detail: 'All critical headers configured in middleware' },
            { label: 'Rate Limiting', status: 'pass', detail: 'Per-IP and per-user rate limiting active (30 req/min default)' },
            { label: 'Input Validation & Sanitization', status: 'pass', detail: 'Pydantic schemas + HTML sanitization on all inputs' },
            { label: 'SQL Injection Protection', status: 'pass', detail: 'SQLAlchemy ORM with parameterized queries' },
            { label: 'XSS Prevention', status: 'pass', detail: 'Content-Security-Policy header + output encoding' },
            { label: 'CSRF Protection', status: 'pass', detail: 'Token-based CSRF protection on state-changing endpoints' },
            { label: 'JWT Token Validation', status: 'pass', detail: 'Signature verification + expiry check on every request' },
            { label: 'Credential Encryption', status: 'pass', detail: 'Cloud credentials encrypted with AES-256 in database' },
            { label: 'Audit Logging', status: 'pass', detail: 'All API actions logged with user, IP, timestamp, status' },
            { label: 'CORS Policy', status: 'warn', detail: 'Currently allows all origins — restrict to known domains in production' },
            { label: 'Multi-Factor Authentication', status: 'warn', detail: 'MFA available but not enforced for admin accounts' },
            { label: 'API Key Rotation', status: 'warn', detail: 'No automated key rotation policy — recommend 90-day rotation' },
            { label: 'Secret Management', status: 'pass', detail: 'JWT secret and DB credentials via environment variables' },
            { label: 'Dependency Scanning', status: 'warn', detail: 'No automated CVE scanning on Python/npm dependencies' },
            { label: 'Session Concurrency Limit', status: 'fail', detail: 'No limit on concurrent sessions per user' },
          ].map((item, i) => {
            const config = { pass: { color: '#10b981', icon: CheckCircle2, bg: 'bg-emerald-500/5' }, warn: { color: '#f59e0b', icon: AlertTriangle, bg: 'bg-amber-500/5' }, fail: { color: '#ef4444', icon: XCircle, bg: 'bg-red-500/5' } };
            const c = config[item.status];
            const Icon = c.icon;
            return (
              <motion.div key={item.label} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                <div className={`flex items-center gap-3 p-3 rounded-xl border border-border/20 ${c.bg}`}>
                  <Icon className="w-5 h-5 flex-shrink-0" style={{ color: c.color }} />
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-text">{item.label}</h4>
                    <p className="text-xs text-text-muted mt-0.5">{item.detail}</p>
                  </div>
                  <span className="text-[10px] font-medium uppercase px-2 py-0.5 rounded-full" style={{ background: `${c.color}15`, color: c.color }}>
                    {item.status === 'pass' ? 'Secured' : item.status === 'warn' ? 'Review' : 'Action Needed'}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
