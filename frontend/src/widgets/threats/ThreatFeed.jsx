import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { getThreats } from '../../api';

const SEV_COLORS = {
  CRITICAL: 'text-red-400 bg-red-500/15',
  HIGH: 'text-orange-400 bg-orange-500/15',
  MEDIUM: 'text-yellow-400 bg-yellow-500/15',
  LOW: 'text-blue-400 bg-blue-500/15',
};

export default function ThreatFeed({ account, provider }) {
  const [threats, setThreats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!account) { setLoading(false); return; }
    getThreats(account)
      .then((d) => setThreats((d.threats || d || []).slice(0, 10)))
      .catch(() => setThreats([]))
      .finally(() => setLoading(false));
  }, [account]);

  if (loading) return <div className="flex items-center justify-center h-full text-text-muted text-xs">Loading...</div>;
  if (!threats.length) return <div className="flex items-center justify-center h-full text-text-muted text-xs">No threats detected</div>;

  return (
    <div className="space-y-2 overflow-auto">
      {threats.map((t, i) => {
        const sev = (t.severity || 'MEDIUM').toUpperCase();
        const style = SEV_COLORS[sev] || SEV_COLORS.MEDIUM;
        return (
          <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition">
            <AlertTriangle className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${style.split(' ')[0]}`} />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-text truncate">{t.title || t.description || t.type || 'Threat'}</p>
              {t.resource && <p className="text-[10px] text-text-muted truncate">{t.resource}</p>}
            </div>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${style}`}>{sev}</span>
          </div>
        );
      })}
    </div>
  );
}
