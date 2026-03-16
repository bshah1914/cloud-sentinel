import { useState, useEffect, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import AiChat from './AiChat';
import { getAccounts } from '../api';

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [activeAccount, setActiveAccount] = useState('');
  const [activeProvider, setActiveProvider] = useState('aws');

  const refreshAccounts = useCallback(async () => {
    try {
      const res = await getAccounts();
      const accts = res.accounts || [];
      setAccounts(accts);
      if (accts.length > 0) {
        const stillExists = accts.find((a) => a.name === activeAccount);
        if (!stillExists) {
          const def = accts.find((a) => a.default) || accts[0];
          setActiveAccount(def.name);
          setActiveProvider(def.provider || 'aws');
        }
      } else {
        setActiveAccount('');
      }
      return accts;
    } catch {
      return [];
    }
  }, [activeAccount]);

  useEffect(() => {
    getAccounts().then((res) => {
      const accts = res.accounts || [];
      setAccounts(accts);
      if (accts.length > 0) {
        const def = accts.find((a) => a.default) || accts[0];
        setActiveAccount(def.name);
        setActiveProvider(def.provider || 'aws');
      }
    }).catch(() => {});
  }, []);

  const handleAccountChange = (name) => {
    setActiveAccount(name);
    const acct = accounts.find((a) => a.name === name);
    if (acct) setActiveProvider(acct.provider || 'aws');
  };

  return (
    <div className="min-h-screen bg-surface mesh-bg noise">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        activeProvider={activeProvider}
      />

      <motion.div
        initial={false}
        animate={{ marginLeft: collapsed ? 72 : 260 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="min-h-screen flex flex-col"
      >
        <Topbar
          account={activeAccount}
          provider={activeProvider}
          onAccountChange={handleAccountChange}
          accounts={accounts}
        />
        <main className="flex-1 p-6">
          <Outlet context={{
            account: activeAccount,
            provider: activeProvider,
            accounts,
            setActiveAccount: handleAccountChange,
            refreshAccounts,
          }} />
        </main>
      </motion.div>

      <AiChat />
    </div>
  );
}
