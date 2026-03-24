import { useState } from 'react';
import { Zap } from 'lucide-react';
import { startScan } from '../../api';

export default function QuickScanButton({ account, provider }) {
  const [scanning, setScanning] = useState(false);
  const [msg, setMsg] = useState(null);

  const handleScan = async () => {
    if (!account) {
      setMsg('No account selected');
      return;
    }
    setScanning(true);
    setMsg(null);
    try {
      await startScan({ accountName: account, provider: provider || 'aws' });
      setMsg('Scan started');
    } catch (e) {
      setMsg(e.message || 'Scan failed');
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full gap-3">
      <button
        onClick={handleScan}
        disabled={scanning}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-light disabled:opacity-50 text-white text-sm font-semibold transition-all shadow-lg shadow-primary/20"
      >
        <Zap className={`w-4 h-4 ${scanning ? 'animate-pulse' : ''}`} />
        {scanning ? 'Scanning...' : 'Quick Scan'}
      </button>
      {msg && <span className="text-[11px] text-text-muted">{msg}</span>}
    </div>
  );
}
