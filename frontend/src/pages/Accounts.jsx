import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, CheckCircle2, XCircle, MapPin, HardDrive,
  Network, X, Cloud
} from 'lucide-react';
import { getAccounts, addAccount, removeAccount, getCIDRs, addCIDR, removeCIDR } from '../api';
import Card from '../components/Card';
import Loader from '../components/Loader';

export default function Accounts() {
  const { refreshAccounts } = useOutletContext();
  const [accounts, setAccounts] = useState([]);
  const [cidrs, setCidrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showAddCIDR, setShowAddCIDR] = useState(false);
  const [newAccount, setNewAccount] = useState({ id: '', name: '', provider: 'aws', default: false });
  const [newCIDR, setNewCIDR] = useState({ cidr: '', name: '' });
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [acctRes, cidrRes] = await Promise.all([getAccounts(), getCIDRs()]);
      setAccounts(acctRes.accounts || []);
      setCidrs(cidrRes.cidrs || []);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleAddAccount = async (e) => {
    e.preventDefault();
    try {
      await addAccount(newAccount);
      setNewAccount({ id: '', name: '', provider: 'aws', default: false });
      setShowAddAccount(false);
      await load();
      await refreshAccounts();
    } catch (e) { setError(e.message); }
  };

  const handleRemoveAccount = async (id) => {
    if (!confirm('Offboard this account?\n\nThis will permanently delete ALL collected scan data for this account.')) return;
    const acct = accounts.find((a) => a.id === id);
    await removeAccount(id, acct?.provider || 'aws');
    await load();
    await refreshAccounts();
  };

  const handleAddCIDR = async (e) => {
    e.preventDefault();
    try {
      await addCIDR(newCIDR);
      setNewCIDR({ cidr: '', name: '' });
      setShowAddCIDR(false);
      load();
    } catch (e) { setError(e.message); }
  };

  const handleRemoveCIDR = async (cidr) => {
    await removeCIDR(cidr);
    load();
  };

  if (loading) return <Loader text="Loading accounts..." />;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/12 flex items-center justify-center">
            <Cloud className="w-4.5 h-4.5 text-primary-light" />
          </div>
          Account Management
        </h1>
        <p className="text-text-muted text-sm mt-1.5">Manage cloud accounts and trusted CIDR ranges</p>
      </motion.div>

      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="bg-red-500/8 border border-red-500/15 rounded-xl p-3.5 text-red-400 text-sm flex items-center gap-2">
          <XCircle className="w-4 h-4 flex-shrink-0" /> {error}
          <button onClick={() => setError('')} className="ml-auto hover:text-red-300"><X className="w-4 h-4" /></button>
        </motion.div>
      )}

      {/* Accounts Section */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text flex items-center gap-2">
          Cloud Accounts <span className="text-[10px] text-text-muted bg-surface-lighter/50 px-2 py-0.5 rounded-md">{accounts.length}</span>
        </h2>
        <button onClick={() => setShowAddAccount(!showAddAccount)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary rounded-xl text-xs font-medium transition-all shadow-sm shadow-primary/15">
          <Plus className="w-3.5 h-3.5" /> Add Account
        </button>
      </div>

      <AnimatePresence>
        {showAddAccount && (
          <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} onSubmit={handleAddAccount}
            className="bg-surface-light/80 border border-border/30 rounded-2xl p-5 space-y-4 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-[10px] text-text-muted mb-1.5 uppercase tracking-wider font-medium">Provider</label>
                <select value={newAccount.provider} onChange={(e) => setNewAccount({ ...newAccount, provider: e.target.value })}
                  className="w-full bg-surface/60 border border-border/50 rounded-xl px-3 py-2.5 text-sm text-text focus:outline-none focus:border-primary/40 cursor-pointer">
                  <option value="aws">AWS</option>
                  <option value="azure">Azure</option>
                  <option value="gcp">GCP</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-text-muted mb-1.5 uppercase tracking-wider font-medium">Account ID</label>
                <input type="text" value={newAccount.id} onChange={(e) => setNewAccount({ ...newAccount, id: e.target.value })}
                  placeholder="123456789012" required
                  className="w-full bg-surface/60 border border-border/50 rounded-xl px-3 py-2.5 text-sm text-text placeholder:text-text-muted/40 focus:outline-none focus:border-primary/40 transition-all" />
              </div>
              <div>
                <label className="block text-[10px] text-text-muted mb-1.5 uppercase tracking-wider font-medium">Account Name</label>
                <input type="text" value={newAccount.name} onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                  placeholder="production" required
                  className="w-full bg-surface/60 border border-border/50 rounded-xl px-3 py-2.5 text-sm text-text placeholder:text-text-muted/40 focus:outline-none focus:border-primary/40 transition-all" />
              </div>
              <div className="flex items-end gap-3">
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input type="checkbox" checked={newAccount.default} onChange={(e) => setNewAccount({ ...newAccount, default: e.target.checked })}
                    className="w-4 h-4 rounded accent-primary" />
                  Default
                </label>
                <button type="submit" className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-xs font-medium transition-colors">Save</button>
                <button type="button" onClick={() => setShowAddAccount(false)} className="px-4 py-2.5 bg-surface-lighter/50 hover:bg-surface-lighter rounded-xl text-xs transition-colors">Cancel</button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Account Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((acct, i) => (
          <Card key={acct.id} delay={i * 0.04}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${acct.has_data ? 'bg-emerald-500/10 border-emerald-500/15 text-emerald-400' : 'bg-surface-lighter/50 border-border/30 text-text-muted'}`}>
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-text">{acct.name}</h3>
                  <p className="text-[10px] text-text-muted font-mono">{acct.id}
                    <span className={`ml-2 px-1.5 py-0.5 rounded-md text-[10px] font-semibold ${
                      acct.provider === 'azure' ? 'bg-blue-500/10 text-blue-400' :
                      acct.provider === 'gcp' ? 'bg-sky-500/10 text-sky-400' :
                      'bg-orange-500/10 text-orange-400'
                    }`}>{(acct.provider || 'aws').toUpperCase()}</span>
                  </p>
                </div>
              </div>
              <button onClick={() => handleRemoveAccount(acct.id)}
                className="p-1.5 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/8 transition-all">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-4 flex items-center gap-3 text-xs">
              {acct.has_data ? (
                <span className="flex items-center gap-1 text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5" /> Data Available</span>
              ) : (
                <span className="flex items-center gap-1 text-text-muted"><XCircle className="w-3.5 h-3.5" /> No Data</span>
              )}
              {acct.default && (
                <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary-light text-[10px] font-medium border border-primary/10">Default</span>
              )}
            </div>
            {acct.regions?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {acct.regions.map((r) => (
                  <span key={r} className="flex items-center gap-1 text-[10px] bg-surface/40 border border-border/20 rounded-md px-2 py-0.5 text-text-muted">
                    <MapPin className="w-2.5 h-2.5" />{r}
                  </span>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* CIDRs Section */}
      <div className="flex items-center justify-between mt-8">
        <h2 className="text-sm font-semibold text-text flex items-center gap-2">
          <Network className="w-4 h-4 text-accent" /> Trusted CIDRs
          <span className="text-[10px] text-text-muted bg-surface-lighter/50 px-2 py-0.5 rounded-md">{cidrs.length}</span>
        </h2>
        <button onClick={() => setShowAddCIDR(!showAddCIDR)}
          className="flex items-center gap-2 px-4 py-2 bg-accent/12 hover:bg-accent/20 text-accent border border-accent/15 rounded-xl text-xs font-medium transition-all">
          <Plus className="w-3.5 h-3.5" /> Add CIDR
        </button>
      </div>

      <AnimatePresence>
        {showAddCIDR && (
          <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} onSubmit={handleAddCIDR}
            className="bg-surface-light/80 border border-border/30 rounded-2xl p-5 overflow-hidden">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-[10px] text-text-muted mb-1.5 uppercase tracking-wider font-medium">CIDR Block</label>
                <input type="text" value={newCIDR.cidr} onChange={(e) => setNewCIDR({ ...newCIDR, cidr: e.target.value })}
                  placeholder="10.0.0.0/8" required
                  className="w-full bg-surface/60 border border-border/50 rounded-xl px-3 py-2.5 text-sm text-text placeholder:text-text-muted/40 focus:outline-none focus:border-primary/40 transition-all" />
              </div>
              <div className="flex-1">
                <label className="block text-[10px] text-text-muted mb-1.5 uppercase tracking-wider font-medium">Name</label>
                <input type="text" value={newCIDR.name} onChange={(e) => setNewCIDR({ ...newCIDR, name: e.target.value })}
                  placeholder="Office Network" required
                  className="w-full bg-surface/60 border border-border/50 rounded-xl px-3 py-2.5 text-sm text-text placeholder:text-text-muted/40 focus:outline-none focus:border-primary/40 transition-all" />
              </div>
              <button type="submit" className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-xs font-medium transition-colors">Save</button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {cidrs.length > 0 && (
        <Card hover={false}>
          <div className="space-y-1.5">
            {cidrs.map((c, i) => (
              <motion.div key={c.cidr} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.025 }}
                className="flex items-center justify-between bg-surface/40 rounded-xl px-4 py-3 border border-border/20 hover:border-border/40 transition-all">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm text-accent">{c.cidr}</span>
                  <span className="text-text-muted text-xs">{c.name}</span>
                </div>
                <button onClick={() => handleRemoveCIDR(c.cidr)}
                  className="p-1.5 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/8 transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
