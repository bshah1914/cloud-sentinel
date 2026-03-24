import { useState, useEffect } from 'react';
import { runAudit } from '../../api';

export default function AuditLogFeed({ account, provider }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!account) { setLoading(false); return; }
    runAudit(account, provider)
      .then((d) => {
        const items = d.findings || d.audit_log || d.entries || d.results || [];
        setEntries(Array.isArray(items) ? items.slice(0, 10) : []);
      })
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [account, provider]);

  if (loading) return <div className="flex items-center justify-center h-full text-text-muted text-xs">Loading...</div>;
  if (!entries.length) return <div className="flex items-center justify-center h-full text-text-muted text-xs">No audit entries</div>;

  return (
    <div className="space-y-2 overflow-auto">
      {entries.map((e, i) => (
        <div key={i} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition">
          <p className="text-xs text-text truncate">{e.title || e.message || e.description || 'Audit entry'}</p>
          <div className="flex items-center gap-2 mt-1">
            {e.severity && <span className="text-[10px] text-text-muted">{e.severity}</span>}
            {e.resource && <span className="text-[10px] text-text-muted truncate">{e.resource}</span>}
            {e.timestamp && <span className="text-[10px] text-text-muted ml-auto">{e.timestamp.slice(0, 16)}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
