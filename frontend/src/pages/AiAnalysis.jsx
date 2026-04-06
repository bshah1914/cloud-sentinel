import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis
} from 'recharts';
import {
  Brain, Sparkles, AlertTriangle, TrendingUp, Search, Layers, Activity,
  Cpu, MemoryStick, Zap, Clock, CheckCircle2, XCircle, ArrowRight,
  MessageSquare, Send, Lightbulb, Target, BarChart3, GitBranch
} from 'lucide-react';
import Card from '../components/Card';

const CHART_TOOLTIP = {
  contentStyle: { background: '#1a2332', border: '1px solid rgba(99,102,241,0.12)', borderRadius: '12px', color: '#eef2ff', fontSize: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' },
};

function generateAnomalies() {
  return [
    { id: 'a-1', type: 'cpu_spike', severity: 'critical', host: 'prod-api-01', metric: 'CPU Usage', value: 95.2, expected: 45, zscore: 4.2, timestamp: '2026-04-07T11:30:00Z', description: 'Unusual CPU spike detected. Z-score 4.2 indicates significant deviation from normal pattern.', recommendation: 'Check for runaway processes or increased load. Consider scaling horizontally.' },
    { id: 'a-2', type: 'memory_leak', severity: 'warning', host: 'prod-web-02', metric: 'Memory Usage', value: 78, expected: 55, zscore: 2.8, timestamp: '2026-04-07T10:15:00Z', description: 'Gradual memory increase detected over 6 hours. Pattern consistent with memory leak.', recommendation: 'Review recent deployments. Check heap dumps and garbage collection logs. Consider restarting the service.' },
    { id: 'a-3', type: 'latency_anomaly', severity: 'warning', host: 'prod-api-01', metric: 'Response Time', value: 850, expected: 200, zscore: 3.1, timestamp: '2026-04-07T09:45:00Z', description: 'P95 latency increased 4x in the last 30 minutes. Correlates with database query slowdown.', recommendation: 'Check slow query log. Verify database connection pool status and index health.' },
    { id: 'a-4', type: 'error_rate', severity: 'critical', host: 'prod-api-01', metric: 'Error Rate', value: 8.5, expected: 0.5, zscore: 5.1, timestamp: '2026-04-07T11:00:00Z', description: 'Error rate 17x above normal. Majority are 503 Service Unavailable responses from payment-service.', recommendation: 'Investigate payment-service health. Check upstream dependency (Stripe API) status page.' },
    { id: 'a-5', type: 'traffic_pattern', severity: 'info', host: 'global', metric: 'Request Rate', value: 1200, expected: 800, zscore: 2.1, timestamp: '2026-04-07T08:00:00Z', description: 'Unusual traffic increase not matching historical patterns. Not correlated with marketing campaigns.', recommendation: 'Monitor for potential DDoS. Check referrer headers for unusual patterns.' },
  ];
}

function generateForecast() {
  const now = Date.now();
  return Array.from({ length: 48 }, (_, i) => {
    const t = new Date(now - (24 - i) * 3600000);
    const isActual = i < 24;
    const base = 45 + Math.sin(i / 6) * 15;
    return {
      time: t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actual: isActual ? Math.round(base + Math.random() * 10) : null,
      forecast: !isActual ? Math.round(base + Math.random() * 8 + (i - 24) * 0.5) : null,
      upper: !isActual ? Math.round(base + 20 + (i - 24) * 0.8) : null,
      lower: !isActual ? Math.round(Math.max(base - 10, 5)) : null,
    };
  });
}

function generateLogClusters() {
  return [
    { id: 'c-1', pattern: 'Connection timeout to database', count: 234, severity: 'critical', services: ['user-service', 'payment-service'], trend: 'increasing', firstSeen: '2026-04-07T08:00:00Z' },
    { id: 'c-2', pattern: 'Rate limit exceeded for client *', count: 156, severity: 'warning', services: ['api-gateway'], trend: 'stable', firstSeen: '2026-04-07T06:00:00Z' },
    { id: 'c-3', pattern: 'Cache miss for key user:*:profile', count: 89, severity: 'info', services: ['user-service', 'cache'], trend: 'decreasing', firstSeen: '2026-04-07T09:00:00Z' },
    { id: 'c-4', pattern: 'TLS handshake failed: certificate *', count: 45, severity: 'critical', services: ['api-gateway', 'auth-service'], trend: 'increasing', firstSeen: '2026-04-07T10:30:00Z' },
    { id: 'c-5', pattern: 'Slow query detected: * (>2000ms)', count: 67, severity: 'warning', services: ['database'], trend: 'stable', firstSeen: '2026-04-06T22:00:00Z' },
  ];
}

const SEVERITY_COLORS = { critical: '#ef4444', warning: '#f59e0b', info: '#3b82f6' };
const TREND_ICONS = { increasing: TrendingUp, stable: Activity, decreasing: TrendingUp };

export default function AiAnalysis() {
  const [anomalies] = useState(generateAnomalies);
  const [forecast] = useState(generateForecast);
  const [logClusters] = useState(generateLogClusters);
  const [tab, setTab] = useState('anomalies');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', content: 'I\'m your AI infrastructure analyst. Ask me about anomalies, performance patterns, or request a root cause analysis. For example:\n\n- "Why is prod-api-01 showing high CPU?"\n- "Analyze the error rate trend"\n- "What caused the latency spike at 9:45 AM?"' },
  ]);

  const handleChat = () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatInput('');

    setTimeout(() => {
      let response = '';
      if (userMsg.toLowerCase().includes('cpu')) {
        response = '**Root Cause Analysis: High CPU on prod-api-01**\n\nBased on correlated metrics:\n\n1. **Primary cause**: Error rate spike at 11:00 AM triggered excessive retry loops in the payment processing pipeline\n2. **Contributing factor**: Memory pressure (92.1%) causing increased garbage collection overhead\n3. **Correlation**: Network anomaly on prod-web-01 at 08:45 may have initiated cascading failures\n\n**Recommended actions:**\n- Implement circuit breaker on payment-service retries\n- Scale prod-api-01 horizontally (add 2 instances)\n- Review memory allocation settings for JVM heap';
      } else if (userMsg.toLowerCase().includes('error') || userMsg.toLowerCase().includes('latency')) {
        response = '**Error Rate & Latency Analysis**\n\nThe error rate increase correlates strongly with:\n\n1. **Database connection pool saturation** — 48/50 connections active since 09:30\n2. **Slow queries** — 67 queries exceeding 2000ms threshold\n3. **Upstream dependency** — payment-service showing 503 errors from external API\n\n**Impact timeline:**\n- 09:30 — DB pool reaches 90% capacity\n- 09:45 — P95 latency jumps from 200ms to 850ms\n- 11:00 — Error rate crosses 5% threshold\n\n**Recommendation:** Increase connection pool size and add query caching layer.';
      } else {
        response = `I've analyzed the current infrastructure state:\n\n- **3 active anomalies** requiring attention\n- **2 critical alerts** firing (CPU and error rate)\n- **Memory leak** pattern detected on prod-web-02\n- **Overall health**: 75/100 (degraded)\n\nThe primary concern is the cascading failure pattern between prod-api-01 and payment-service. Would you like me to provide a detailed root cause analysis for any specific issue?`;
      }
      setChatMessages(prev => [...prev, { role: 'assistant', content: response }]);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-pink-500/20 flex items-center justify-center">
            <Brain className="w-5 h-5 text-violet-400" />
          </div>
          AI Analysis
        </h1>
        <p className="text-sm text-text-muted mt-1">ML-powered anomaly detection, forecasting, log clustering, and intelligent root cause analysis</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Anomalies Detected', value: anomalies.length, color: '#ef4444', icon: AlertTriangle },
          { label: 'Log Patterns', value: logClusters.length, color: '#6366f1', icon: Layers },
          { label: 'Forecasting', value: 'Active', color: '#10b981', icon: TrendingUp },
          { label: 'AI Health Score', value: '75/100', color: '#f59e0b', icon: Target },
        ].map(s => (
          <div key={s.label} className="bg-surface-light/60 border border-border/30 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <s.icon className="w-3.5 h-3.5" style={{ color: s.color }} />
              <span className="text-[10px] text-text-muted uppercase">{s.label}</span>
            </div>
            <p className="text-xl font-bold text-text">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-light/40 p-1 rounded-xl w-fit border border-border/20">
        {[
          { id: 'anomalies', label: 'Anomaly Detection', icon: AlertTriangle },
          { id: 'forecast', label: 'Forecasting', icon: TrendingUp },
          { id: 'clusters', label: 'Log Clusters', icon: Layers },
          { id: 'chat', label: 'AI Assistant', icon: MessageSquare },
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

      {/* Anomalies Tab */}
      {tab === 'anomalies' && (
        <div className="space-y-3">
          {anomalies.map((a, i) => (
            <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className={`!p-4 border-l-2`} style={{ borderLeftColor: SEVERITY_COLORS[a.severity] }}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${SEVERITY_COLORS[a.severity]}15` }}>
                    <AlertTriangle className="w-5 h-5" style={{ color: SEVERITY_COLORS[a.severity] }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-semibold text-text">{a.metric} Anomaly</h4>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: `${SEVERITY_COLORS[a.severity]}15`, color: SEVERITY_COLORS[a.severity] }}>{a.severity}</span>
                      <span className="text-[10px] text-text-muted font-mono">{a.host}</span>
                      <span className="text-[10px] text-text-muted ml-auto">{new Date(a.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-text-muted mb-2">{a.description}</p>
                    <div className="flex gap-4 mb-2 text-xs">
                      <span>Value: <span className="text-text font-medium">{a.value}</span></span>
                      <span>Expected: <span className="text-text font-medium">{a.expected}</span></span>
                      <span>Z-Score: <span className="text-amber-400 font-medium">{a.zscore}</span></span>
                    </div>
                    <div className="bg-surface/50 border border-border/20 rounded-lg p-2.5">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-xs font-medium text-amber-400">AI Recommendation</span>
                      </div>
                      <p className="text-xs text-text-muted">{a.recommendation}</p>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Forecast Tab */}
      {tab === 'forecast' && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary-light" /> CPU Usage Forecast (24h)
            </h3>
            <div className="flex items-center gap-3 text-[10px] text-text-muted">
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-cyan-400 rounded" /> Actual</span>
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-violet-400 rounded" style={{ borderBottom: '1px dashed' }} /> Forecast</span>
              <span className="flex items-center gap-1"><span className="w-3 h-1 bg-violet-400/20 rounded" /> Confidence</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={forecast}>
              <defs>
                <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.06)" />
              <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#64748b' }} interval={4} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} unit="%" />
              <Tooltip {...CHART_TOOLTIP} />
              <Area type="monotone" dataKey="upper" stroke="none" fill="#8b5cf620" />
              <Area type="monotone" dataKey="lower" stroke="none" fill="#1a2332" />
              <Area type="monotone" dataKey="actual" stroke="#06b6d4" fill="url(#actualGrad)" strokeWidth={2} connectNulls={false} />
              <Area type="monotone" dataKey="forecast" stroke="#8b5cf6" fill="url(#forecastGrad)" strokeWidth={2} strokeDasharray="5 3" connectNulls={false} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="mt-4 p-3 bg-surface/50 border border-border/20 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-xs font-medium text-text">AI Forecast Summary</span>
            </div>
            <p className="text-xs text-text-muted">CPU usage is predicted to gradually increase over the next 24 hours, peaking at approximately 65-70% during business hours. The confidence interval widens after 12 hours. Consider pre-scaling resources if forecast exceeds 80% threshold.</p>
          </div>
        </Card>
      )}

      {/* Log Clusters Tab */}
      {tab === 'clusters' && (
        <div className="space-y-3">
          {logClusters.map((cluster, i) => {
            const TrendIcon = TREND_ICONS[cluster.trend] || Activity;
            return (
              <motion.div key={cluster.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="!p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${SEVERITY_COLORS[cluster.severity]}15` }}>
                      <Layers className="w-4 h-4" style={{ color: SEVERITY_COLORS[cluster.severity] }} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <code className="text-sm font-medium text-text">{cluster.pattern}</code>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: `${SEVERITY_COLORS[cluster.severity]}15`, color: SEVERITY_COLORS[cluster.severity] }}>{cluster.severity}</span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-text-muted">
                        <span className="font-medium text-text">{cluster.count} occurrences</span>
                        <span className="flex items-center gap-1">
                          <TrendIcon className={`w-3 h-3 ${cluster.trend === 'increasing' ? 'text-red-400' : cluster.trend === 'decreasing' ? 'text-emerald-400 rotate-180' : 'text-text-muted'}`} />
                          {cluster.trend}
                        </span>
                        <span>First seen: {new Date(cluster.firstSeen).toLocaleTimeString()}</span>
                      </div>
                      <div className="flex gap-1.5 mt-2">
                        {cluster.services.map(s => (
                          <span key={s} className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary-light rounded-full">{s}</span>
                        ))}
                      </div>
                    </div>
                    <span className="text-lg font-bold text-text">{cluster.count}</span>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* AI Chat Tab */}
      {tab === 'chat' && (
        <Card className="!p-0 overflow-hidden">
          <div className="h-[500px] flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-xl p-3 ${msg.role === 'user' ? 'bg-primary/15 border border-primary/20' : 'bg-surface/80 border border-border/20'}`}>
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-1.5 mb-2">
                        <Brain className="w-3.5 h-3.5 text-violet-400" />
                        <span className="text-[10px] font-medium text-violet-400">AI Analyst</span>
                      </div>
                    )}
                    <div className="text-xs text-text whitespace-pre-wrap leading-relaxed">
                      {msg.content.split('\n').map((line, li) => (
                        <span key={li}>
                          {line.startsWith('**') && line.endsWith('**') ? (
                            <strong className="text-text font-semibold">{line.replace(/\*\*/g, '')}</strong>
                          ) : line.startsWith('- ') ? (
                            <span className="block ml-2">{line}</span>
                          ) : (
                            line
                          )}
                          {li < msg.content.split('\n').length - 1 && <br />}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-border/20 p-3 flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleChat()}
                placeholder="Ask about infrastructure health, anomalies, or request analysis..."
                className="flex-1 px-4 py-2.5 bg-surface border border-border/30 rounded-xl text-sm text-text placeholder:text-text-muted/50 focus:outline-none focus:border-primary/40"
              />
              <button onClick={handleChat} className="px-4 py-2.5 bg-primary/20 text-primary-light rounded-xl hover:bg-primary/30 transition-all">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
