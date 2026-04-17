import { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Brain, AlertTriangle, TrendingUp, RefreshCw, Lightbulb, Target,
  CheckCircle2
} from 'lucide-react';
import Card from '../components/Card';
import { getBase } from '../api';

const CHART_TOOLTIP = {
  contentStyle: { background: '#1a2332', border: '1px solid rgba(99,102,241,0.12)', borderRadius: '12px', color: '#eef2ff', fontSize: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' },
};

const SEVERITY_COLORS = { critical: '#ef4444', warning: '#f59e0b', info: '#3b82f6' };

async function fetchJSON(path) {
  const token = localStorage.getItem('cm_token');
  const res = await fetch(`${getBase()}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export default function AiAnalysis() {
  const ctx = useOutletContext() || {};
  const account = ctx.account;
  const [anomalies, setAnomalies] = useState([]);
  const [anomalyMeta, setAnomalyMeta] = useState({ samples_analyzed: 0, note: '' });
  const [forecast, setForecast] = useState([]);
  const [forecastMeta, setForecastMeta] = useState({ samples_used: 0, note: '' });
  const [metric, setMetric] = useState('cpu');
  const [tab, setTab] = useState('anomalies');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!account) { setLoading(false); return; }
    try {
      const [a, f] = await Promise.all([
        fetchJSON(`/monitoring/anomalies?account=${encodeURIComponent(account)}`),
        fetchJSON(`/monitoring/forecast?account=${encodeURIComponent(account)}&metric=${metric}&hours=3`),
      ]);
      setAnomalies(a.anomalies || []);
      setAnomalyMeta({ samples_analyzed: a.samples_analyzed || 0, note: a.note || '' });
      // Transform forecast data for chart
      const chartData = (f.data || []).map(pt => ({
        time: new Date(pt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actual: pt.actual,
        forecast: pt.forecast,
        upper: pt.upper_bound,
        lower: pt.lower_bound,
      }));
      setForecast(chartData);
      setForecastMeta({ samples_used: f.samples_used || 0, note: f.note || '' });
      setError(null);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }, [metric]);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-pink-500/20 flex items-center justify-center">
              <Brain className="w-5 h-5 text-violet-400" />
            </div>
            AI Analysis
          </h1>
          <p className="text-sm text-text-muted mt-1">Z-score anomaly detection &amp; linear regression forecast on real metric history</p>
        </div>
        <button onClick={refresh} className="p-2 rounded-lg bg-surface-light border border-border/30 hover:bg-white/[0.05]">
          <RefreshCw className="w-4 h-4 text-text-muted" />
        </button>
      </div>

      {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">{error}</div>}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="bg-surface-light/60 border border-border/30 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1"><AlertTriangle className="w-3.5 h-3.5 text-red-400" /><span className="text-[10px] text-text-muted uppercase">Anomalies Found</span></div>
          <p className="text-xl font-bold text-text">{anomalies.length}</p>
        </div>
        <div className="bg-surface-light/60 border border-border/30 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1"><Target className="w-3.5 h-3.5 text-cyan-400" /><span className="text-[10px] text-text-muted uppercase">Samples Analyzed</span></div>
          <p className="text-xl font-bold text-text">{anomalyMeta.samples_analyzed}</p>
        </div>
        <div className="bg-surface-light/60 border border-border/30 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1"><TrendingUp className="w-3.5 h-3.5 text-emerald-400" /><span className="text-[10px] text-text-muted uppercase">Forecast Samples</span></div>
          <p className="text-xl font-bold text-text">{forecastMeta.samples_used}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-light/40 p-1 rounded-xl w-fit border border-border/20">
        {[
          { id: 'anomalies', label: 'Anomaly Detection', icon: AlertTriangle },
          { id: 'forecast', label: 'Forecasting', icon: TrendingUp },
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
          {loading ? (
            <div className="text-center py-8 text-sm text-text-muted">Loading…</div>
          ) : anomalies.length === 0 ? (
            <Card className="!p-8 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3 opacity-60" />
              <h3 className="text-sm font-semibold text-text mb-1">No anomalies detected</h3>
              {anomalyMeta.note ? (
                <p className="text-xs text-text-muted">{anomalyMeta.note}</p>
              ) : (
                <p className="text-xs text-text-muted">All metrics within 2.5 standard deviations of normal over {anomalyMeta.samples_analyzed} samples.</p>
              )}
            </Card>
          ) : (
            anomalies.map((a, i) => (
              <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="!p-4 border-l-2" style={{ borderLeftColor: SEVERITY_COLORS[a.severity] }}>
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
                      <div className="flex gap-4 mb-2 text-xs">
                        <span>Value: <span className="text-text font-medium">{a.value}</span></span>
                        <span>Expected (mean): <span className="text-text font-medium">{a.expected}</span></span>
                        <span>Z-Score: <span className="text-amber-400 font-medium">{a.zscore}</span></span>
                      </div>
                      <div className="bg-surface/50 border border-border/20 rounded-lg p-2.5">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                          <span className="text-xs font-medium text-amber-400">Recommendation</span>
                        </div>
                        <p className="text-xs text-text-muted">{a.recommendation}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Forecast Tab */}
      {tab === 'forecast' && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary-light" /> {metric.toUpperCase()} Forecast
            </h3>
            <div className="flex gap-1">
              {['cpu', 'memory', 'disk'].map(m => (
                <button key={m} onClick={() => setMetric(m)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium ${metric === m ? 'bg-primary/15 text-primary-light' : 'text-text-muted hover:text-text'}`}>
                  {m.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          {forecastMeta.note ? (
            <div className="text-center py-8 text-sm text-text-muted">{forecastMeta.note}</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={forecast}>
                  <defs>
                    <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.06)" />
                  <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#64748b' }} interval={Math.max(1, Math.floor(forecast.length / 12))} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} unit="%" />
                  <Tooltip {...CHART_TOOLTIP} />
                  <Area type="monotone" dataKey="upper" stroke="none" fill="#8b5cf620" />
                  <Area type="monotone" dataKey="lower" stroke="none" fill="#1a2332" />
                  <Area type="monotone" dataKey="actual" stroke="#06b6d4" fill="url(#actualGrad)" strokeWidth={2} connectNulls={false} />
                  <Area type="monotone" dataKey="forecast" stroke="#8b5cf6" fill="none" strokeWidth={2} strokeDasharray="5 3" connectNulls={false} />
                </AreaChart>
              </ResponsiveContainer>
              <p className="text-xs text-text-muted mt-2 text-center">Linear regression on {forecastMeta.samples_used} samples · dashed line = forecast · shaded band = 95% confidence</p>
            </>
          )}
        </Card>
      )}
    </div>
  );
}
