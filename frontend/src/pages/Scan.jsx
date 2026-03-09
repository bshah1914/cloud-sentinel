import { useState, useEffect, useRef } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ScanLine, Play, Clock, CheckCircle2, XCircle,
  Loader as LoaderIcon, RefreshCw, Terminal, Plus, Key, Eye, EyeOff
} from 'lucide-react';
import { startScan, getScanStatus, getScanHistory, getProviders } from '../api';
import Card from '../components/Card';
import StatusBadge from '../components/StatusBadge';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';

const PROVIDER_COLORS = {
  aws: 'text-orange-400',
  azure: 'text-blue-400',
  gcp: 'text-sky-400',
};

export default function Scan() {
  const { account, provider, accounts, refreshAccounts } = useOutletContext();
  const [selectedAccount, setSelectedAccount] = useState(account);
  const [selectedProvider, setSelectedProvider] = useState(provider || 'aws');
  const [providers, setProviders] = useState([]);
  const [credentials, setCredentials] = useState({});
  const [region, setRegion] = useState('all');
  const [showSecrets, setShowSecrets] = useState({});
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const pollingRef = useRef({});

  useEffect(() => {
    if (account) setSelectedAccount(account);
  }, [account]);

  useEffect(() => {
    if (provider) setSelectedProvider(provider);
  }, [provider]);

  useEffect(() => {
    getProviders().then((res) => setProviders(res.providers || [])).catch(() => {});
  }, []);

  const loadHistory = async () => {
    try {
      const res = await getScanHistory();
      setJobs(res.jobs || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { loadHistory(); }, []);

  const currentProvider = providers.find((p) => p.id === selectedProvider);
  const credentialFields = currentProvider?.credential_fields || [];

  const pollJob = (jobId) => {
    if (pollingRef.current[jobId]) return;
    pollingRef.current[jobId] = setInterval(async () => {
      try {
        const status = await getScanStatus(jobId);
        setJobs((prev) => prev.map((j) => j.id === jobId ? status : j));
        if (status.status !== 'running') {
          clearInterval(pollingRef.current[jobId]);
          delete pollingRef.current[jobId];
          if (refreshAccounts) refreshAccounts();
        }
      } catch {
        clearInterval(pollingRef.current[jobId]);
        delete pollingRef.current[jobId];
      }
    }, 3000);
  };

  useEffect(() => {
    return () => { Object.values(pollingRef.current).forEach(clearInterval); };
  }, []);

  const handleStartScan = async () => {
    if (!selectedAccount) return;
    // Validate required fields
    const missing = credentialFields.filter((f) => f.required && !credentials[f.key]);
    if (missing.length > 0) {
      alert(`Please fill in: ${missing.map((f) => f.label).join(', ')}`);
      return;
    }
    setStarting(true);
    try {
      const res = await startScan({
        accountName: selectedAccount,
        provider: selectedProvider,
        credentials,
        region,
        // Legacy AWS compat
        awsAccessKeyId: selectedProvider === 'aws' ? credentials.access_key_id : undefined,
        awsSecretAccessKey: selectedProvider === 'aws' ? credentials.secret_access_key : undefined,
        awsRegion: selectedProvider === 'aws' ? region : undefined,
      });
      const newJob = {
        id: res.job_id, provider: selectedProvider,
        status: 'running', account: selectedAccount,
        started: new Date().toISOString(),
        log: ['Starting...'], progress: 0,
      };
      setJobs((prev) => [newJob, ...prev]);
      pollJob(res.job_id);
    } catch (e) {
      alert(`Failed to start scan: ${e.message}`);
    }
    setStarting(false);
  };

  useEffect(() => {
    jobs.filter((j) => j.status === 'running').forEach((j) => pollJob(j.id));
  }, [jobs.length]);

  if (loading) return <Loader text="Loading scan history..." />;

  if (!accounts || accounts.length === 0) {
    return (
      <EmptyState
        icon={Plus} title="No accounts configured"
        description="Add a cloud account first before you can run scans."
        action={
          <Link to="/accounts" className="px-5 py-2.5 bg-primary hover:bg-primary-dark rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Account
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ScanLine className="w-6 h-6 text-primary" /> Scan Management
          </h1>
          <p className="text-text-muted text-sm mt-1">Collect cloud data and run security audits</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={selectedProvider} onChange={(e) => { setSelectedProvider(e.target.value); setCredentials({}); }}
            className="bg-surface-lighter border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary cursor-pointer">
            {providers.map((p) => (
              <option key={p.id} value={p.id}>{p.short_name}</option>
            ))}
          </select>
          <select value={selectedAccount} onChange={(e) => setSelectedAccount(e.target.value)}
            className="bg-surface-lighter border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary cursor-pointer">
            {accounts.map((a) => (
              <option key={a.name} value={a.name}>{a.name}</option>
            ))}
          </select>
          <button onClick={handleStartScan} disabled={starting || !selectedAccount}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-dark disabled:opacity-50 rounded-lg text-sm font-medium transition-colors">
            {starting ? (
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
            ) : (<Play className="w-4 h-4" />)}
            {starting ? 'Starting...' : 'Start Scan'}
          </button>
          <button onClick={loadHistory} className="p-2 rounded-lg text-text-muted hover:text-text hover:bg-surface-lighter transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      {/* Dynamic Credentials Form */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Key className="w-5 h-5 text-amber-400" />
          <h2 className="text-sm font-semibold">
            {currentProvider?.short_name || 'Cloud'} Credentials
          </h2>
          <span className={`text-xs font-medium ${PROVIDER_COLORS[selectedProvider] || 'text-text-muted'}`}>
            {currentProvider?.short_name}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {credentialFields.map((field) => (
            <div key={field.key}>
              <label className="block text-xs text-text-muted mb-1.5">{field.label}</label>
              <div className="relative">
                <input
                  type={field.secret && !showSecrets[field.key] ? 'password' : 'text'}
                  value={credentials[field.key] || ''}
                  onChange={(e) => setCredentials({ ...credentials, [field.key]: e.target.value })}
                  placeholder={field.placeholder}
                  className="w-full bg-surface border border-border rounded-lg px-3 py-2 pr-10 text-sm text-text font-mono focus:outline-none focus:border-primary transition-colors"
                />
                {field.secret && (
                  <button type="button"
                    onClick={() => setShowSecrets({ ...showSecrets, [field.key]: !showSecrets[field.key] })}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text transition-colors">
                    {showSecrets[field.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>
          ))}
          {currentProvider?.region_support && (
            <div>
              <label className="block text-xs text-text-muted mb-1.5">Region</label>
              <input
                type="text" value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="all (recommended)"
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          )}
        </div>
        <p className="mt-3 text-xs text-text-muted">
          Credentials are used only for this scan and are not stored on the server.
        </p>
      </Card>

      {/* Active scans */}
      {jobs.filter((j) => j.status === 'running').length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-text-muted">Active Scans</h2>
          {jobs.filter((j) => j.status === 'running').map((job) => (
            <Card key={job.id} glow="accent">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="w-10 h-10 rounded-lg bg-cyan-500/15 flex items-center justify-center">
                    <LoaderIcon className="w-5 h-5 text-cyan-400" />
                  </motion.div>
                  <div>
                    <h3 className="font-semibold text-sm">
                      {job.account || 'Unknown'}
                      {job.provider && <span className={`ml-2 text-xs ${PROVIDER_COLORS[job.provider] || ''}`}>[{job.provider?.toUpperCase()}]</span>}
                    </h3>
                    <p className="text-xs text-text-muted">
                      Job ID: {job.id}
                      {job.regions_total > 1 && ` \u2022 ${job.regions_scanned?.length || 0}/${job.regions_total} regions`}
                    </p>
                  </div>
                </div>
                <StatusBadge status="running" />
              </div>
              <div className="w-full h-2 bg-surface rounded-full overflow-hidden mb-3">
                <motion.div className="h-full bg-gradient-to-r from-cyan-500 to-primary rounded-full"
                  initial={{ width: 0 }} animate={{ width: `${job.progress || 0}%` }} transition={{ duration: 0.5 }} />
              </div>
              <p className="text-xs text-text-muted">{job.progress || 0}% complete</p>
              {job.log?.length > 0 && (
                <div className="mt-3 bg-surface rounded-lg p-3 max-h-32 overflow-y-auto">
                  {job.log.map((line, i) => (
                    <p key={i} className="text-xs text-text-muted font-mono flex items-start gap-2">
                      <Terminal className="w-3 h-3 mt-0.5 flex-shrink-0" /> {line}
                    </p>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* History */}
      <div>
        <h2 className="text-sm font-semibold text-text-muted mb-3">Scan History ({jobs.length})</h2>
        {jobs.length === 0 ? (
          <Card>
            <div className="text-center py-8 text-text-muted text-sm">
              No scans yet. Select a provider and account, enter credentials, then click "Start Scan".
            </div>
          </Card>
        ) : (
          <div className="space-y-2">
            {jobs.filter((j) => j.status !== 'running').map((job, i) => (
              <motion.div key={job.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="bg-surface-light border border-border rounded-xl p-4 hover:border-border transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      job.status === 'completed' ? 'bg-emerald-500/15' : 'bg-red-500/15'
                    }`}>
                      {job.status === 'completed'
                        ? <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        : <XCircle className="w-5 h-5 text-red-400" />}
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">
                        {job.account || 'Unknown'}
                        {job.provider && <span className={`ml-2 text-xs ${PROVIDER_COLORS[job.provider] || 'text-text-muted'}`}>[{job.provider?.toUpperCase()}]</span>}
                      </h3>
                      <p className="text-xs text-text-muted font-mono">{job.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-text-muted">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {new Date(job.started).toLocaleString()}
                    </span>
                    <StatusBadge status={job.status} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
