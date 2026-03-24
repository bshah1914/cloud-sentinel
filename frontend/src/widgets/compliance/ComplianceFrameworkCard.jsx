import { useState, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { getComplianceFrameworks } from '../../api';

export default function ComplianceFrameworkCard({ account, provider }) {
  const [frameworks, setFrameworks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getComplianceFrameworks()
      .then((d) => setFrameworks(d.frameworks || d || []))
      .catch(() => setFrameworks([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-full text-text-muted text-xs">Loading...</div>;
  if (!frameworks.length) return <div className="flex items-center justify-center h-full text-text-muted text-xs">No frameworks</div>;

  return (
    <div className="space-y-2 overflow-auto">
      {frameworks.map((f, i) => {
        const score = f.score ?? f.compliance_score ?? null;
        const color = score === null ? 'bg-white/10' : score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500';
        return (
          <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition">
            <CheckCircle2 className="w-4 h-4 text-primary-light shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-text truncate">{f.name || f.framework}</p>
              {f.description && <p className="text-[10px] text-text-muted truncate">{f.description}</p>}
            </div>
            {score !== null && (
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 rounded-full bg-white/10">
                  <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
                </div>
                <span className="text-xs font-bold text-text w-8 text-right">{score}%</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
